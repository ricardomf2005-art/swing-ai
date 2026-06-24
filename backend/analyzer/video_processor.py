"""
Main video processing pipeline.
Extracts frames, runs pose estimation, computes metrics, detects phases.
"""
import cv2
import numpy as np
import os
import base64
from typing import Optional
from .pose_estimator import PoseEstimator, detect_ball_position
from .angle_calculator import (
    spine_angle, shoulder_tilt, hip_rotation_angle,
    left_arm_angle, knee_flex_angle, wrist_position_relative_to_ball,
    swing_plane_deviation, hip_shoulder_separation,
)
from .swing_phases import detect_phases
from .scoring import aggregate_scores
from .report_generator import generate_report


MAX_FRAMES = 40
SAMPLE_EVERY = 2  # process every Nth frame for speed


def process_video(video_path: str, view: str = "dtl") -> dict:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    duration = total_frames / fps

    # Subsample frames
    step = max(1, total_frames // MAX_FRAMES)
    frames, frame_indices = [], []
    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if idx % step == 0:
            frames.append(frame)
            frame_indices.append(idx)
        idx += 1
    cap.release()

    if not frames:
        raise ValueError("No frames extracted from video")

    # Pose estimation
    estimator = PoseEstimator()
    landmarks_list = []
    ball_positions = []
    for frame in frames:
        lm = estimator.extract_landmarks_normalized(frame)
        landmarks_list.append(lm)
        ball_pos = detect_ball_position(frame)
        ball_positions.append(ball_pos)

    # Phase detection
    phase_map = detect_phases(landmarks_list, view)

    # Compute metrics at key phases
    def lm_at(phase: str) -> Optional[dict]:
        fi = phase_map.get(phase, 0)
        # find closest valid
        closest_local = min(range(len(frame_indices)), key=lambda i: abs(frame_indices[i] - fi))
        return landmarks_list[closest_local]

    def ball_at(phase: str) -> Optional[list]:
        fi = phase_map.get(phase, 0)
        closest_local = min(range(len(frame_indices)), key=lambda i: abs(frame_indices[i] - fi))
        return ball_positions[closest_local]

    lm_address = lm_at("address")
    lm_top = lm_at("top_of_backswing")
    lm_impact = lm_at("impact")

    metrics = {}
    if lm_address:
        metrics["spine_angle_address"] = spine_angle(lm_address)
        metrics["knee_flex_address"] = knee_flex_angle(lm_address, "left")
        metrics["shoulder_tilt_address"] = shoulder_tilt(lm_address)

    if lm_top:
        metrics["left_arm_top"] = _left_arm_angle_deg(lm_top)
        metrics["shoulder_turn_top"] = _shoulder_rotation(lm_top, lm_address)
        metrics["hip_turn_top"] = _hip_rotation(lm_top, lm_address)
        metrics["x_factor"] = hip_shoulder_separation(lm_top)

    if lm_impact:
        ball = ball_at("impact")
        metrics["shaft_lean_impact"] = wrist_position_relative_to_ball(lm_impact, ball)
        metrics["impact_risks"] = _detect_impact_risks(lm_impact, metrics)

    # Swing plane from wrist trajectory across all valid frames
    wrist_trajectory = []
    for lm in landmarks_list:
        if lm:
            lw = lm.get("left_wrist")
            if lw:
                wrist_trajectory.append([lw[0], lw[1]])
    metrics["swing_plane_deviation"] = swing_plane_deviation(wrist_trajectory)

    # Early extension
    metrics["early_extension_detected"] = _detect_early_extension(landmarks_list, phase_map, frame_indices)

    # Scoring
    scores = aggregate_scores(metrics)

    # Report
    report = generate_report(metrics, scores, view, phase_map)

    # Extract keyframe thumbnails
    keyframes = _extract_keyframes(frames, frame_indices, phase_map, estimator, landmarks_list)

    estimator.close()

    return {
        "duration": round(duration, 2),
        "total_frames": total_frames,
        "fps": round(fps, 1),
        "view": view,
        "scores": scores,
        "metrics": metrics,
        "report": report,
        "phase_frames": phase_map,
        "keyframes": keyframes,
    }


def _left_arm_angle_deg(lm: dict) -> Optional[float]:
    return left_arm_angle(lm)


def _shoulder_rotation(lm_top: dict, lm_address: Optional[dict]) -> Optional[float]:
    top_angle = shoulder_tilt(lm_top)
    if top_angle is None:
        return None
    if lm_address:
        addr_angle = shoulder_tilt(lm_address)
        if addr_angle is not None:
            return abs(top_angle - addr_angle) + 60  # approximate total rotation
    return top_angle


def _hip_rotation(lm_top: dict, lm_address: Optional[dict]) -> Optional[float]:
    top_angle = hip_rotation_angle(lm_top)
    if top_angle is None:
        return None
    if lm_address:
        addr_angle = hip_rotation_angle(lm_address)
        if addr_angle is not None:
            return abs(top_angle - addr_angle) + 20
    return top_angle


def _detect_impact_risks(lm_impact: dict, metrics: dict) -> list:
    risks = []
    plane_dev = metrics.get("swing_plane_deviation")
    if plane_dev and plane_dev > 18:
        risks.append("slice_risk")
    shaft = metrics.get("shaft_lean_impact")
    if shaft == "backward_lean":
        risks.append("fat_risk")
    return risks


def _detect_early_extension(
    landmarks_list: list, phase_map: dict, frame_indices: list
) -> bool:
    try:
        addr_fi = phase_map.get("address", 0)
        impact_fi = phase_map.get("impact", 0)
        addr_local = min(range(len(frame_indices)), key=lambda i: abs(frame_indices[i] - addr_fi))
        impact_local = min(range(len(frame_indices)), key=lambda i: abs(frame_indices[i] - impact_fi))
        lm_a = landmarks_list[addr_local]
        lm_i = landmarks_list[impact_local]
        if not lm_a or not lm_i:
            return False
        hip_a = lm_a.get("left_hip")
        hip_i = lm_i.get("left_hip")
        if not hip_a or not hip_i:
            return False
        # If hip x moves significantly toward camera (increases in normalized coords for FO view)
        return abs(hip_i[0] - hip_a[0]) > 0.08
    except Exception:
        return False


def _extract_keyframes(
    frames: list, frame_indices: list, phase_map: dict, estimator: PoseEstimator, landmarks_list: list
) -> dict:
    keyframes = {}
    for phase, fi in phase_map.items():
        local = min(range(len(frame_indices)), key=lambda i: abs(frame_indices[i] - fi))
        frame = frames[local].copy()
        lm = landmarks_list[local]
        if lm:
            # Draw skeleton
            # Convert normalized back to pixel for drawing
            h, w = frame.shape[:2]
            lm_px = {k: [v[0] * w, v[1] * h, v[2]] for k, v in lm.items()}
            frame = estimator.draw_skeleton(frame, lm_px)
        # Draw phase label
        cv2.putText(frame, phase.replace("_", " ").upper(), (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 215, 0), 2)
        # Encode to base64 JPEG
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        b64 = base64.b64encode(buf).decode("utf-8")
        keyframes[phase] = f"data:image/jpeg;base64,{b64}"
    return keyframes

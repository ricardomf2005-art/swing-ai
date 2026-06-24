import numpy as np
from typing import Optional


def angle_between_points(a: list, b: list, c: list) -> float:
    """Calculate angle at point b formed by a-b-c."""
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    return float(np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0))))


def spine_angle(landmarks: dict) -> Optional[float]:
    """Angle of spine from vertical using shoulders and hips midpoints."""
    try:
        l_shoulder = landmarks.get("left_shoulder")
        r_shoulder = landmarks.get("right_shoulder")
        l_hip = landmarks.get("left_hip")
        r_hip = landmarks.get("right_hip")
        if not all([l_shoulder, r_shoulder, l_hip, r_hip]):
            return None
        shoulder_mid = [(l_shoulder[0] + r_shoulder[0]) / 2, (l_shoulder[1] + r_shoulder[1]) / 2]
        hip_mid = [(l_hip[0] + r_hip[0]) / 2, (l_hip[1] + r_hip[1]) / 2]
        dx = shoulder_mid[0] - hip_mid[0]
        dy = shoulder_mid[1] - hip_mid[1]
        return float(np.degrees(np.arctan2(abs(dx), abs(dy))))
    except Exception:
        return None


def shoulder_tilt(landmarks: dict) -> Optional[float]:
    """Shoulder line angle from horizontal."""
    try:
        l = landmarks.get("left_shoulder")
        r = landmarks.get("right_shoulder")
        if not l or not r:
            return None
        return float(np.degrees(np.arctan2(abs(l[1] - r[1]), abs(l[0] - r[0]))))
    except Exception:
        return None


def hip_rotation_angle(landmarks: dict) -> Optional[float]:
    """Hip line angle from horizontal — proxy for rotation."""
    try:
        l = landmarks.get("left_hip")
        r = landmarks.get("right_hip")
        if not l or not r:
            return None
        return float(np.degrees(np.arctan2(abs(l[1] - r[1]), abs(l[0] - r[0]))))
    except Exception:
        return None


def left_arm_angle(landmarks: dict) -> Optional[float]:
    """Angle at left elbow: shoulder→elbow→wrist."""
    try:
        s = landmarks.get("left_shoulder")
        e = landmarks.get("left_elbow")
        w = landmarks.get("left_wrist")
        if not all([s, e, w]):
            return None
        return angle_between_points(s, e, w)
    except Exception:
        return None


def knee_flex_angle(landmarks: dict, side: str = "left") -> Optional[float]:
    """Knee flexion angle: hip→knee→ankle."""
    try:
        hip = landmarks.get(f"{side}_hip")
        knee = landmarks.get(f"{side}_knee")
        ankle = landmarks.get(f"{side}_ankle")
        if not all([hip, knee, ankle]):
            return None
        return angle_between_points(hip, knee, ankle)
    except Exception:
        return None


def wrist_position_relative_to_ball(landmarks: dict, ball_pos: Optional[list]) -> Optional[str]:
    """Determine shaft lean direction at impact."""
    if ball_pos is None:
        return None
    try:
        left_wrist = landmarks.get("left_wrist")
        if not left_wrist:
            return None
        dx = left_wrist[0] - ball_pos[0]
        if dx < -0.02:
            return "forward_lean"
        elif dx > 0.02:
            return "backward_lean"
        return "neutral"
    except Exception:
        return None


def swing_plane_deviation(club_positions: list) -> Optional[float]:
    """Estimate plane deviation from ideal 45-degree plane using club tip positions."""
    if len(club_positions) < 3:
        return None
    try:
        pts = np.array(club_positions)
        x, y = pts[:, 0], pts[:, 1]
        coeffs = np.polyfit(x, y, 1)
        slope = coeffs[0]
        actual_angle = np.degrees(np.arctan(abs(slope)))
        ideal_angle = 45.0
        return float(abs(actual_angle - ideal_angle))
    except Exception:
        return None


def hip_shoulder_separation(landmarks: dict) -> Optional[float]:
    """X-factor: difference between shoulder and hip rotation angles."""
    sh = shoulder_tilt(landmarks)
    hi = hip_rotation_angle(landmarks)
    if sh is None or hi is None:
        return None
    return abs(sh - hi)

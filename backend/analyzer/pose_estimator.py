import cv2
import mediapipe as mp
import numpy as np
from typing import Optional

mp_pose = mp.solutions.pose

LANDMARK_NAMES = [
    "nose", "left_eye_inner", "left_eye", "left_eye_outer",
    "right_eye_inner", "right_eye", "right_eye_outer",
    "left_ear", "right_ear", "mouth_left", "mouth_right",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_pinky", "right_pinky",
    "left_index", "right_index", "left_thumb", "right_thumb",
    "left_hip", "right_hip", "left_knee", "right_knee",
    "left_ankle", "right_ankle", "left_heel", "right_heel",
    "left_foot_index", "right_foot_index",
]

KEY_LANDMARKS = {
    "nose": 0,
    "left_shoulder": 11, "right_shoulder": 12,
    "left_elbow": 13, "right_elbow": 14,
    "left_wrist": 15, "right_wrist": 16,
    "left_hip": 23, "right_hip": 24,
    "left_knee": 25, "right_knee": 26,
    "left_ankle": 27, "right_ankle": 28,
    "left_heel": 29, "right_heel": 30,
}


class PoseEstimator:
    def __init__(self):
        self.pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=0,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def extract_landmarks(self, frame: np.ndarray) -> Optional[dict]:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)
        if not results.pose_landmarks:
            return None
        h, w = frame.shape[:2]
        lm = {}
        for name, idx in KEY_LANDMARKS.items():
            p = results.pose_landmarks.landmark[idx]
            lm[name] = [p.x * w, p.y * h, p.z, p.visibility]
        return lm

    def extract_landmarks_normalized(self, frame: np.ndarray) -> Optional[dict]:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)
        if not results.pose_landmarks:
            return None
        lm = {}
        for name, idx in KEY_LANDMARKS.items():
            p = results.pose_landmarks.landmark[idx]
            lm[name] = [p.x, p.y, p.z]
        return lm

    def draw_skeleton(self, frame: np.ndarray, landmarks: dict) -> np.ndarray:
        overlay = frame.copy()
        connections = [
            ("left_shoulder", "right_shoulder"),
            ("left_shoulder", "left_elbow"),
            ("left_elbow", "left_wrist"),
            ("right_shoulder", "right_elbow"),
            ("right_elbow", "right_wrist"),
            ("left_shoulder", "left_hip"),
            ("right_shoulder", "right_hip"),
            ("left_hip", "right_hip"),
            ("left_hip", "left_knee"),
            ("left_knee", "left_ankle"),
            ("right_hip", "right_knee"),
            ("right_knee", "right_ankle"),
        ]
        for a, b in connections:
            if a in landmarks and b in landmarks:
                pa = (int(landmarks[a][0]), int(landmarks[a][1]))
                pb = (int(landmarks[b][0]), int(landmarks[b][1]))
                cv2.line(overlay, pa, pb, (0, 255, 150), 2)
        for name, coords in landmarks.items():
            pt = (int(coords[0]), int(coords[1]))
            cv2.circle(overlay, pt, 5, (255, 200, 0), -1)
        return overlay

    def close(self):
        self.pose.close()


def detect_ball_position(frame: np.ndarray) -> Optional[list]:
    """Simple white/yellow circle detection for golf ball."""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    # white range
    mask_white = cv2.inRange(hsv, np.array([0, 0, 200]), np.array([180, 30, 255]))
    # yellow range
    mask_yellow = cv2.inRange(hsv, np.array([20, 100, 100]), np.array([40, 255, 255]))
    mask = cv2.bitwise_or(mask_white, mask_yellow)
    mask = cv2.erode(mask, None, iterations=2)
    mask = cv2.dilate(mask, None, iterations=4)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best = None
    best_score = 0
    h, w = frame.shape[:2]
    for c in contours:
        area = cv2.contourArea(c)
        if area < 20 or area > 2000:
            continue
        (x, y), radius = cv2.minEnclosingCircle(c)
        if radius < 3 or radius > 25:
            continue
        perimeter = cv2.arcLength(c, True)
        circularity = 4 * np.pi * area / (perimeter ** 2 + 1e-6)
        if circularity > best_score:
            best_score = circularity
            best = [x / w, y / h]
    return best if best_score > 0.5 else None

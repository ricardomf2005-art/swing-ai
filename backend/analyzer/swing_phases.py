"""
Detect swing phases from a sequence of landmark frames.
Uses wrist height and velocity heuristics to segment the swing.
"""
from typing import List, Dict, Optional
import numpy as np

PHASES = [
    "address",
    "takeaway",
    "half_backswing",
    "top_of_backswing",
    "transition",
    "downswing",
    "impact",
    "follow_through",
    "finish",
]


def _wrist_height(lm: dict, view: str = "dtl") -> float:
    """Normalized wrist height (lower y = higher in frame)."""
    left_wrist = lm.get("left_wrist")
    right_wrist = lm.get("right_wrist")
    if left_wrist and right_wrist:
        return (left_wrist[1] + right_wrist[1]) / 2.0
    if left_wrist:
        return left_wrist[1]
    if right_wrist:
        return right_wrist[1]
    return 0.5


def _hip_y(lm: dict) -> float:
    l = lm.get("left_hip")
    r = lm.get("right_hip")
    if l and r:
        return (l[1] + r[1]) / 2.0
    return 0.5


def detect_phases(frames_landmarks: List[Optional[dict]], view: str = "dtl") -> Dict[str, int]:
    """
    Returns a mapping of phase_name → frame_index for best representative frame.
    frames_landmarks: list of landmark dicts (one per sampled frame).
    """
    valid = [(i, lm) for i, lm in enumerate(frames_landmarks) if lm is not None]
    if len(valid) < 5:
        n = len(frames_landmarks)
        return {phase: int(i * n / len(PHASES)) for i, phase in enumerate(PHASES)}

    wrist_heights = [_wrist_height(lm) for _, lm in valid]
    indices = [i for i, _ in valid]

    # Smooth
    window = max(3, len(wrist_heights) // 10)
    kernel = np.ones(window) / window
    if len(wrist_heights) >= window:
        smoothed = np.convolve(wrist_heights, kernel, mode='same')
    else:
        smoothed = np.array(wrist_heights)

    # Find address: first stable frames
    address_idx = indices[0]

    # Find impact: frame closest to address wrist height after midpoint
    mid = len(smoothed) // 2
    address_height = smoothed[0]
    impact_local = mid + int(np.argmin(np.abs(smoothed[mid:] - address_height)))
    impact_idx = indices[min(impact_local, len(indices) - 1)]

    # Top of backswing: minimum wrist y (highest point) before impact
    pre_impact = smoothed[:impact_local + 1]
    top_local = int(np.argmin(pre_impact))  # minimum y = highest wrist
    top_idx = indices[min(top_local, len(indices) - 1)]

    # Takeaway: 15% into backswing
    takeaway_local = max(1, top_local // 4)
    takeaway_idx = indices[min(takeaway_local, len(indices) - 1)]

    # Half backswing: 50% into backswing
    half_local = max(1, top_local // 2)
    half_idx = indices[min(half_local, len(indices) - 1)]

    # Transition: just after top
    transition_local = min(top_local + max(1, (impact_local - top_local) // 5), len(indices) - 1)
    transition_idx = indices[transition_local]

    # Downswing: halfway between transition and impact
    ds_local = (transition_local + impact_local) // 2
    ds_idx = indices[min(ds_local, len(indices) - 1)]

    # Follow through: 25% after impact
    ft_local = impact_local + max(1, (len(indices) - impact_local) // 3)
    ft_idx = indices[min(ft_local, len(indices) - 1)]

    # Finish: last valid frame
    finish_idx = indices[-1]

    return {
        "address": address_idx,
        "takeaway": takeaway_idx,
        "half_backswing": half_idx,
        "top_of_backswing": top_idx,
        "transition": transition_idx,
        "downswing": ds_idx,
        "impact": impact_idx,
        "follow_through": ft_idx,
        "finish": finish_idx,
    }

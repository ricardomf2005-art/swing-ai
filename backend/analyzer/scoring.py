"""
Biomechanical scoring engine.
Each metric returns a 0-100 score based on ideal golf biomechanics ranges.
"""
from typing import Optional
import numpy as np


def _score(value: float, ideal: float, tolerance: float) -> float:
    """Gaussian-like score: 100 at ideal, decays with tolerance."""
    deviation = abs(value - ideal)
    score = 100 * np.exp(-0.5 * (deviation / tolerance) ** 2)
    return float(np.clip(score, 0, 100))


def score_spine_angle(angle: Optional[float]) -> float:
    if angle is None:
        return 50.0
    return _score(angle, 30.0, 10.0)  # ideal ~25-35 deg forward tilt


def score_knee_flex(angle: Optional[float]) -> float:
    if angle is None:
        return 50.0
    return _score(angle, 155.0, 12.0)  # ideal ~140-165 deg (slight flex)


def score_left_arm(angle: Optional[float]) -> float:
    if angle is None:
        return 50.0
    # At top: ideally straight or slightly bent ~160-180
    return _score(angle, 170.0, 15.0)


def score_shoulder_turn(angle: Optional[float]) -> float:
    if angle is None:
        return 50.0
    return _score(angle, 90.0, 15.0)  # ideal ~75-105 deg rotation


def score_hip_turn(angle: Optional[float]) -> float:
    if angle is None:
        return 50.0
    return _score(angle, 45.0, 12.0)  # ideal ~35-55 deg at top


def score_x_factor(separation: Optional[float]) -> float:
    if separation is None:
        return 50.0
    return _score(separation, 45.0, 10.0)  # ideal ~35-55 deg separation


def score_swing_plane(deviation: Optional[float]) -> float:
    if deviation is None:
        return 50.0
    return _score(deviation, 0.0, 12.0)  # less deviation = better


def score_shaft_lean(position: Optional[str]) -> float:
    if position is None:
        return 50.0
    return 95.0 if position == "forward_lean" else 40.0


def aggregate_scores(metrics: dict) -> dict:
    """
    Combine individual metrics into category scores and final score.
    metrics: dict with keys matching analyzer output.
    """
    spine = score_spine_angle(metrics.get("spine_angle_address"))
    knee = score_knee_flex(metrics.get("knee_flex_address"))
    arm = score_left_arm(metrics.get("left_arm_top"))
    shoulder = score_shoulder_turn(metrics.get("shoulder_turn_top"))
    hip = score_hip_turn(metrics.get("hip_turn_top"))
    xfactor = score_x_factor(metrics.get("x_factor"))
    plane = score_swing_plane(metrics.get("swing_plane_deviation"))
    shaft = score_shaft_lean(metrics.get("shaft_lean_impact"))

    technique = float(np.mean([spine, knee, plane, shaft]))
    consistency = float(np.mean([arm, shoulder]))
    balance = float(np.mean([knee, spine]))
    rotation = float(np.mean([shoulder, hip, xfactor]))
    impact_score = float(np.mean([shaft, plane]))

    final = float(np.mean([technique, consistency, balance, rotation, impact_score]))

    handicap = _estimate_handicap(final)

    return {
        "technique": round(technique),
        "consistency": round(consistency),
        "balance": round(balance),
        "rotation": round(rotation),
        "impact": round(impact_score),
        "overall": round(final),
        "handicap_range": handicap,
    }


def _estimate_handicap(score: float) -> str:
    if score >= 90:
        return "0-5 (Scratch / Near-Scratch)"
    elif score >= 80:
        return "5-12 (Low Handicap)"
    elif score >= 70:
        return "12-18 (Mid Handicap)"
    elif score >= 60:
        return "18-24 (High Handicap)"
    else:
        return "24+ (Beginner)"

"""
Generates structured coaching report from biomechanical metrics.
"""
from typing import Optional


DRILLS = {
    "over_the_top": {
        "name": "Pump Drill",
        "description": "Take club to top, then pump downswing 3 times leading with hips before completing. 20 reps.",
    },
    "casting": {
        "name": "Lag Retention Drill",
        "description": "Feel wrist hinge maintained until hands pass hip height on downswing. Use alignment stick.",
    },
    "reverse_pivot": {
        "name": "Step-Through Drill",
        "description": "Step onto front foot as you start downswing to force weight transfer. 15 reps.",
    },
    "early_extension": {
        "name": "Glute Wall Drill",
        "description": "Stand 4 inches from wall, maintain glute contact throughout swing. 10 slow-motion reps.",
    },
    "overswing": {
        "name": "Three-Quarter Drill",
        "description": "Consciously stop backswing at 3/4 length. Focus on shoulder turn not arm length. 20 reps.",
    },
    "inside_takeaway": {
        "name": "Alignment Stick Takeaway Drill",
        "description": "Place stick along ball-target line, trace stick path on takeaway to feel correct plane.",
    },
    "outside_takeaway": {
        "name": "Towel Under Arm Drill",
        "description": "Tuck towel under right arm, keep it during takeaway. Promotes on-plane takeaway.",
    },
    "poor_balance": {
        "name": "Eyes Closed Drill",
        "description": "Hit chip shots with eyes closed to improve kinesthetic balance awareness. 15 reps.",
    },
}


def generate_report(metrics: dict, scores: dict, view: str, phase_frames: dict) -> dict:
    strengths = []
    improvements = []
    corrections = []

    spine = metrics.get("spine_angle_address")
    knee = metrics.get("knee_flex_address")
    left_arm = metrics.get("left_arm_top")
    shoulder_turn = metrics.get("shoulder_turn_top")
    hip_turn = metrics.get("hip_turn_top")
    x_factor = metrics.get("x_factor")
    plane_dev = metrics.get("swing_plane_deviation")
    shaft_lean = metrics.get("shaft_lean_impact")
    impact_risks = metrics.get("impact_risks", [])

    # --- Strengths ---
    if spine is not None and 20 <= spine <= 40:
        strengths.append({
            "icon": "✓",
            "text": f"Excelente inclinación de columna en address ({spine:.1f}°). Postura sólida.",
        })

    if knee is not None and 140 <= knee <= 170:
        strengths.append({
            "icon": "✓",
            "text": f"Buena flexión de rodillas ({180 - knee:.0f}° de flexión). Posición atlética.",
        })

    if shoulder_turn is not None and shoulder_turn >= 75:
        strengths.append({
            "icon": "✓",
            "text": f"Excelente giro de hombros ({shoulder_turn:.0f}°). Gran amplitud de backswing.",
        })

    if x_factor is not None and x_factor >= 35:
        strengths.append({
            "icon": "✓",
            "text": f"Buen X-Factor ({x_factor:.0f}°). Buena separación hombros-caderas para generar potencia.",
        })

    if shaft_lean == "forward_lean":
        strengths.append({
            "icon": "✓",
            "text": "Shaft lean positivo en impacto. Comprimes bien la pelota.",
        })

    if plane_dev is not None and plane_dev < 10:
        strengths.append({
            "icon": "✓",
            "text": f"Plano de swing consistente (desviación {plane_dev:.1f}°). Trayectoria predecible.",
        })

    if left_arm is not None and left_arm >= 160:
        strengths.append({
            "icon": "✓",
            "text": f"Brazo izquierdo extendido en la parte alta ({left_arm:.0f}°). Arco amplio.",
        })

    # Default if no strengths
    if not strengths:
        strengths.append({
            "icon": "✓",
            "text": "Posición inicial reconocible. Base sobre la que trabajar.",
        })

    # --- Improvements & Corrections ---
    if shoulder_turn is not None and shoulder_turn < 70:
        improvements.append({
            "icon": "✗",
            "text": f"Giro de hombros insuficiente ({shoulder_turn:.0f}°). Ideal ≥ 80°.",
            "phase": "top_of_backswing",
        })
        corrections.append({
            "title": "Falta de rotación de hombros",
            "phase": "Backswing",
            "what": f"El giro de hombros es de {shoulder_turn:.0f}°, por debajo del ideal de 80-100°.",
            "why": "Los brazos llevan el palo sin que el torso gire correctamente. Falta movilidad torácica o el giro está bloqueado.",
            "how": "Siente cómo el hombro izquierdo gira bajo la barbilla. El hombro derecho debe quedar detrás de ti al llegar arriba.",
            "drill": DRILLS["overswing"],
            "severity": "high",
        })

    if left_arm is not None and left_arm < 145:
        improvements.append({
            "icon": "✗",
            "text": f"Brazo izquierdo muy doblado en la parte alta ({left_arm:.0f}°). Riesgo de overswing y pérdida de control.",
            "phase": "top_of_backswing",
        })
        corrections.append({
            "title": "Flexión excesiva del brazo izquierdo",
            "phase": "Top of Backswing",
            "what": f"El codo izquierdo forma un ángulo de {left_arm:.0f}°. Debería estar en 160-180°.",
            "why": "El backswing es demasiado largo o se está intentando compensar falta de rotación con el brazo.",
            "how": "Acorta conscientemente el backswing. El palo debe parar cuando el torso deja de girar.",
            "drill": DRILLS["overswing"],
            "severity": "medium",
        })

    if plane_dev is not None and plane_dev > 15:
        improvements.append({
            "icon": "✗",
            "text": f"Desviación del plano de swing ({plane_dev:.0f}°). El palo no viaja en un plano consistente.",
            "phase": "downswing",
        })
        corrections.append({
            "title": "Over The Top / Fuera de plano",
            "phase": "Downswing",
            "what": f"El palo se desvía {plane_dev:.0f}° del plano ideal. Probable trayectoria out-to-in.",
            "why": "El downswing se inicia con los hombros antes de que las caderas lideren la transición.",
            "how": "Comienza el downswing con un desplazamiento lateral de las caderas hacia el objetivo. Las manos caen pasivas.",
            "drill": DRILLS["over_the_top"],
            "severity": "high",
        })

    if "slice_risk" in impact_risks:
        improvements.append({
            "icon": "✗",
            "text": "Alto riesgo de slice. Cara abierta o trayectoria out-to-in detectada.",
            "phase": "impact",
        })
        corrections.append({
            "title": "Riesgo de Slice",
            "phase": "Impact",
            "what": "Combinación de trayectoria out-to-in y/o cara abierta genera efecto de corte.",
            "why": "Secuencia incorrecta del downswing: hombros lideran, caderas no rotan antes del impacto.",
            "how": "Trabaja la sensación de atacar la pelota 'desde dentro': imagina golpear la mitad derecha de la pelota.",
            "drill": DRILLS["over_the_top"],
            "severity": "high",
        })

    if x_factor is not None and x_factor < 25:
        improvements.append({
            "icon": "✗",
            "text": f"X-Factor bajo ({x_factor:.0f}°). Poca diferencia entre rotación de hombros y caderas. Pérdida de potencia.",
            "phase": "top_of_backswing",
        })

    if spine is not None and spine > 45:
        improvements.append({
            "icon": "✗",
            "text": f"Inclinación lateral excesiva ({spine:.0f}°). Posible reverse pivot.",
            "phase": "address",
        })
        corrections.append({
            "title": "Reverse Pivot",
            "phase": "Backswing / Address",
            "what": f"La columna se inclina hacia el objetivo ({spine:.0f}°) en lugar de alejarse.",
            "why": "El peso no se transfiere correctamente durante el backswing, permanece en el pie delantero.",
            "how": "Siente el peso cargarse en el talón derecho durante el backswing. El hombro derecho va hacia atrás y abajo.",
            "drill": DRILLS["reverse_pivot"],
            "severity": "high",
        })

    if metrics.get("early_extension_detected"):
        improvements.append({
            "icon": "✗",
            "text": "Early extension detectado. La pelvis se mueve hacia la pelota durante el downswing.",
            "phase": "downswing",
        })
        corrections.append({
            "title": "Early Extension",
            "phase": "Downswing",
            "what": "Las caderas se empujan hacia la pelota durante el downswing en lugar de rotar.",
            "why": "Falta de estabilidad en el core o la postura del setup es demasiado erguida.",
            "how": "Mantén el doblez de cadera constante desde address hasta impacto. El trasero debe rozar un objeto imaginario detrás.",
            "drill": DRILLS["early_extension"],
            "severity": "medium",
        })

    # Default improvement
    if not improvements:
        improvements.append({
            "icon": "✗",
            "text": "Continúa trabajando la consistencia. Los fundamentos están presentes pero pueden refinarse.",
            "phase": "general",
        })

    # Shot shape prediction
    shot_prediction = _predict_shot(impact_risks, plane_dev, shaft_lean)

    return {
        "view": view,
        "strengths": strengths,
        "improvements": improvements,
        "corrections": corrections,
        "shot_prediction": shot_prediction,
        "metrics_summary": _format_metrics(metrics),
    }


def _predict_shot(impact_risks: list, plane_dev: Optional[float], shaft_lean: Optional[str]) -> dict:
    if "slice_risk" in impact_risks:
        return {"shape": "Slice", "color": "#ef4444", "description": "Trayectoria out-to-in con cara abierta"}
    if "hook_risk" in impact_risks:
        return {"shape": "Hook", "color": "#f97316", "description": "Trayectoria in-to-out con cara cerrada"}
    if "fat_risk" in impact_risks:
        return {"shape": "Fat Shot", "color": "#eab308", "description": "Contacto con el suelo antes de la bola"}
    if "thin_risk" in impact_risks:
        return {"shape": "Thin", "color": "#eab308", "description": "Contacto en la parte baja de la cara"}
    if shaft_lean == "backward_lean":
        return {"shape": "Push/Flip", "color": "#f97316", "description": "Sin shaft lean, pérdida de potencia y control"}
    return {"shape": "Straight / Draw", "color": "#22c55e", "description": "Trayectoria correcta"}


def _format_metrics(metrics: dict) -> list:
    items = []
    mapping = [
        ("spine_angle_address", "Ángulo de columna (address)", "°", 20, 40),
        ("knee_flex_address", "Flexión de rodillas", "°", 140, 170),
        ("left_arm_top", "Brazo izquierdo (top)", "°", 155, 180),
        ("shoulder_turn_top", "Giro de hombros", "°", 75, 105),
        ("hip_turn_top", "Giro de caderas", "°", 35, 55),
        ("x_factor", "X-Factor", "°", 35, 55),
        ("swing_plane_deviation", "Desviación de plano", "°", 0, 10),
    ]
    for key, label, unit, lo, hi in mapping:
        val = metrics.get(key)
        if val is not None:
            in_range = lo <= val <= hi
            items.append({
                "label": label,
                "value": round(val, 1),
                "unit": unit,
                "ideal_range": f"{lo}-{hi}{unit}",
                "status": "good" if in_range else "warning",
            })
    return items

"""
NeuroBalance AI — FastAPI Stress Scoring Microservice
Rule-based cognitive stress analysis from eye-tracking signals.
"""

from __future__ import annotations

import asyncio
import json
import math
from typing import List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="NeuroBalance AI Service",
    description="Real-time cognitive stress scoring from eye-tracking biometrics",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────────────────────
# Pydantic models
# ──────────────────────────────────────────────────────────────────────────────


class StressInput(BaseModel):
    blinkRate: float = Field(..., ge=0, le=60, description="Blinks per minute")
    gazeDirection: str = Field(..., description="left | right | center")
    eyeClosure: float = Field(..., ge=0, le=1, description="0.0–1.0")
    screenTimeMinutes: float = Field(..., ge=0, description="Continuous screen time in minutes")
    gazeShifts: int = Field(..., ge=0, description="Gaze direction changes per minute")
    userBaseline: float = Field(40.0, ge=0, le=100, description="Personalised baseline stress")


class ScoreComponents(BaseModel):
    blinkScore: float
    screenTimeScore: float
    gazeInstabilityScore: float
    eyeClosureScore: float


class StressOutput(BaseModel):
    stressScore: float
    level: str  # "low" | "medium" | "high"
    components: ScoreComponents
    recommendations: List[str]


# ──────────────────────────────────────────────────────────────────────────────
# Core scoring engine
# ──────────────────────────────────────────────────────────────────────────────


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def compute_stress(payload: StressInput) -> StressOutput:
    # ── 1. Blink score (weight 30%) ──────────────────────────────────────────
    normal_blink = 15.0
    blink_deviation = abs(payload.blinkRate - normal_blink)
    blink_score = _clamp((blink_deviation / 15.0) * 60.0)
    # Extra penalty for very low blink (eye strain) or very high (anxiety)
    if payload.blinkRate < 8:
        blink_score = _clamp(blink_score + 20)
    elif payload.blinkRate > 25:
        blink_score = _clamp(blink_score + 15)

    # ── 2. Screen-time score (weight 30%) ─────────────────────────────────────
    screen_time_score = _clamp((payload.screenTimeMinutes / 90.0) * 100.0)
    if payload.screenTimeMinutes > 45:
        screen_time_score = _clamp(screen_time_score + 20)

    # ── 3. Gaze instability score (weight 25%) ───────────────────────────────
    gaze_instability_score = _clamp((payload.gazeShifts / 20.0) * 70.0)
    if payload.gazeDirection != "center":
        gaze_instability_score = _clamp(gaze_instability_score + 15)

    # ── 4. Eye-closure score (weight 15%) ────────────────────────────────────
    eye_closure_score: float = 0.0
    if payload.eyeClosure > 0.4:
        eye_closure_score = _clamp(((payload.eyeClosure - 0.4) / 0.6) * 100.0)

    # ── 5. Weighted fusion ────────────────────────────────────────────────────
    raw_score = (
        blink_score * 0.30
        + screen_time_score * 0.30
        + gaze_instability_score * 0.25
        + eye_closure_score * 0.15
    )

    # ── 6. Personalization adjustment ────────────────────────────────────────
    adjustment = (40.0 - payload.userBaseline) * 0.3
    final_score = _clamp(raw_score + adjustment)

    # ── 7. Level classification ───────────────────────────────────────────────
    if final_score < 35:
        level = "low"
    elif final_score <= 65:
        level = "medium"
    else:
        level = "high"

    # ── 8. Context-aware recommendations ─────────────────────────────────────
    recommendations: List[str] = []

    if payload.blinkRate < 8:
        recommendations.append(
            "Your blink rate is very low — try the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds."
        )
    elif payload.blinkRate > 25:
        recommendations.append(
            "Elevated blink rate detected, which can signal anxiety. Consider a short mindfulness pause."
        )

    if payload.screenTimeMinutes > 45:
        recommendations.append(
            f"You've been at your screen for {payload.screenTimeMinutes:.0f} minutes. A 5-minute break significantly boosts focus."
        )

    if payload.gazeShifts > 15:
        recommendations.append(
            "Your gaze is shifting rapidly — try narrowing your focus to one task to reduce cognitive load."
        )

    if payload.eyeClosure > 0.5:
        recommendations.append(
            "High eye-closure percentage detected — you may be experiencing drowsiness. Splash water on your face or stretch."
        )

    if final_score > 65:
        recommendations.append(
            "Your stress score is high. Try box breathing: inhale 4s → hold 4s → exhale 4s → hold 4s."
        )
    elif final_score > 35:
        recommendations.append(
            "Moderate stress detected. Maintain good posture and keep water nearby."
        )
    else:
        recommendations.append(
            "You're in a good cognitive zone! Keep up the steady pace."
        )

    return StressOutput(
        stressScore=round(final_score, 2),
        level=level,
        components=ScoreComponents(
            blinkScore=round(blink_score, 2),
            screenTimeScore=round(screen_time_score, 2),
            gazeInstabilityScore=round(gaze_instability_score, 2),
            eyeClosureScore=round(eye_closure_score, 2),
        ),
        recommendations=recommendations,
    )


# ──────────────────────────────────────────────────────────────────────────────
# HTTP endpoints
# ──────────────────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {"status": "ok", "service": "neurobalance-ai", "version": "1.0.0"}


@app.post("/predict-stress", response_model=StressOutput)
async def predict_stress(payload: StressInput) -> StressOutput:
    return compute_stress(payload)


# ──────────────────────────────────────────────────────────────────────────────
# WebSocket endpoint  /ws/stress
# ──────────────────────────────────────────────────────────────────────────────


@app.websocket("/ws/stress")
async def ws_stress(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                payload = StressInput(**data)
                result = compute_stress(payload)
                await websocket.send_text(result.model_dump_json())
            except Exception as exc:
                await websocket.send_text(json.dumps({"error": str(exc)}))
    except WebSocketDisconnect:
        pass

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# -------------------------------------------------
# Database
# -------------------------------------------------
from app.db.database import init_db

# -------------------------------------------------
# Model imports
# -------------------------------------------------
import app.models.user
import app.models.gym
import app.models.visit
import app.models.gallery
import app.models.workout_log
import app.models.weight_log
import app.models.reminder
import app.models.reminder_log

# -------------------------------------------------
# Core Routers
# -------------------------------------------------
from app.routers import health, auth
from app.routers import users as users_router

# -------------------------------------------------
# Discovery
# -------------------------------------------------
from app.routers import gyms, analytics, discovery
from app.routers import gallery as gallery_router

# -------------------------------------------------
# User Data
# -------------------------------------------------
from app.routers import progress as progress_router
from app.routers import health_profile as health_profile_router
from app.routers import health_memory
from app.routers import reminders

# -------------------------------------------------
# Home
# -------------------------------------------------
from app.routers import home as home_router

# -------------------------------------------------
# Internal / System
# -------------------------------------------------
from app.routes import internal
from app.routers import internal_reminder_eval
from app.routers.library import router as library_router
from app.routers import library

# -------------------------------------------------
# AI Routers (non-orchestrator)
# -------------------------------------------------
from app.ai.routers.ai_chat_router import router as ai_chat_router
from app.ai.routers.ai_plan_router import router as ai_plan_router
from app.ai.routers.ai_progress_router import router as ai_progress_router
from app.ai.routers.ai_recommendation_router import router as ai_recommendation_router
from app.ai.routers.ai_metrics_router import router as ai_metrics_router
from app.routers.ai_image import router as ai_image_router
from app.routers import ai_central
from app.routers import ai_adaptation
from app.ai.routers import central_summary

# -------------------------------------------------
# Diet
# -------------------------------------------------
from app.routes import diet

# -------------------------------------------------
# Onboarding / Reminder Intelligence
# -------------------------------------------------
from app.routers import onboarding
from app.routers import onboarding_health
from app.routers import reminder_reasoning
from app.routers import reminder_behavior

# -------------------------------------------------
# Orchestrator app
# -------------------------------------------------
from app.ai.orchestrator.orchestrator import app as orchestrator_app

# -------------------------------------------------
# App Init
# -------------------------------------------------
app = FastAPI(title="FitConnect API", version="1.0.0")

# -------------------------------------------------
# CORS
# -------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# Static
# -------------------------------------------------
app.mount("/static", StaticFiles(directory="static"), name="static")

# -------------------------------------------------
# Routers
# -------------------------------------------------
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users_router.router)

app.include_router(gyms.router)
app.include_router(discovery.router)
app.include_router(analytics.router)
app.include_router(gallery_router.router)

app.include_router(progress_router.router)
app.include_router(health_profile_router.router)
app.include_router(health_memory.router)
app.include_router(reminders.router)

app.include_router(home_router.router)

app.include_router(internal.router)
app.include_router(internal_reminder_eval.router)
app.include_router(library_router)
app.include_router(library.router)

app.include_router(ai_chat_router)
app.include_router(ai_plan_router)
app.include_router(ai_progress_router)
app.include_router(ai_recommendation_router)
app.include_router(ai_metrics_router)
app.include_router(ai_image_router)
app.include_router(ai_central.router)
app.include_router(ai_adaptation.router)
app.include_router(central_summary.router)

app.include_router(diet.router)

app.include_router(onboarding.router)
app.include_router(onboarding_health.router)
app.include_router(reminder_reasoning.router)
app.include_router(reminder_behavior.router)

# -------------------------------------------------
# 🔥 CORRECT ORCHESTRATOR MOUNT
# -------------------------------------------------
app.mount("/orchestrate", orchestrator_app)

# -------------------------------------------------
# Startup
# -------------------------------------------------
@app.on_event("startup")
def on_startup():
    init_db()

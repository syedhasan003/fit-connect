from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

# -------------------------------------------------
# Database
# -------------------------------------------------
from app.db.database import init_db

# -------------------------------------------------
# Model imports (ENSURE TABLES EXIST)
# -------------------------------------------------
import app.models.user
import app.models.gym
import app.models.gym_amenities  # ✅ NEW - Added for amenities table
import app.models.visit
import app.models.gallery
import app.models.workout_log
import app.models.weight_log
import app.models.reminder
import app.models.reminder_log
import app.models.medication_schedule
import app.models.health_record
import app.models.evaluator_state
import app.models.health_memory
import app.models.daily_health_snapshot
import app.models.vault_item
import app.models.fitness_tracking  # ensures body_weight_logs + water_logs tables are created
import app.models.user_ai_preferences  # ensures user_ai_preferences table is created
import app.models.exercise              # Phase 4 — exercise library
import app.models.food                  # Phase 4 — food database

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
from app.routers import workout_endpoints
from app.routers import diet_endpoints
from app.routers import body_metrics

# -------------------------------------------------
# Home
# -------------------------------------------------
from app.routers import home as home_router

# -------------------------------------------------
# Vault
# -------------------------------------------------
from app.routers import vault
from app.routers import vault_health_timeline   # ✅ NEW (READ-ONLY DAILY SNAPSHOT)
from app.routers import vault_collections       # ✅ Collections feature
import app.models.vault_collection              # ensure table is created

# -------------------------------------------------
# Internal / System (Evaluator)
# -------------------------------------------------
from app.routes import internal
from app.routes import internal_evaluator

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
from app.routers import medication as medication_router
from app.routers import health_records as health_records_router
from app.routers import reminder_reasoning
from app.routers import reminder_behavior

# -------------------------------------------------
# Behavioural Event Log
# -------------------------------------------------
from app.routers import behaviour

# -------------------------------------------------
# Agent Layer (Foundations A, B, C)
# -------------------------------------------------
from app.routers import agent_ws, agent_api
from app.routers import voice as voice_router
from app.agent.scheduler import start_scheduler, stop_scheduler

# -------------------------------------------------
# Orchestrator App (ISOLATED)
# -------------------------------------------------
from app.ai.orchestrator.orchestrator import app as orchestrator_app

# -------------------------------------------------
# Lifespan (replaces deprecated on_event)
# -------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────
    init_db()

    # Create behaviour_log table if it doesn't exist yet
    from sqlalchemy import text
    from app.db.database import get_db
    db = next(get_db())
    db.execute(text(behaviour.CREATE_TABLE_SQL))
    db.commit()

    # Start the agent scheduler (Foundation A)
    start_scheduler()

    yield  # app is running

    # ── Shutdown ─────────────────────────────────
    stop_scheduler()


# -------------------------------------------------
# App Init
# -------------------------------------------------
app = FastAPI(
    title="FitConnect API",
    version="1.0.0",
    lifespan=lifespan,
)

# -------------------------------------------------
# CORS
# -------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# Static Files
# -------------------------------------------------
app.mount("/static", StaticFiles(directory="static"), name="static")

# -------------------------------------------------
# ROUTERS
# -------------------------------------------------

# Core
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users_router.router)

# Discovery
app.include_router(gyms.router)
app.include_router(discovery.router)
app.include_router(analytics.router)
app.include_router(gallery_router.router)

# User Data
app.include_router(progress_router.router)
app.include_router(health_profile_router.router)
app.include_router(health_memory.router)
app.include_router(reminders.router)
app.include_router(workout_endpoints.router)
app.include_router(diet_endpoints.router)
app.include_router(body_metrics.router)

# Home
app.include_router(home_router.router)

# Vault
app.include_router(vault.router)
app.include_router(vault_health_timeline.router)  # ✅ READ-ONLY HEALTH TIMELINE
app.include_router(vault_collections.router)       # ✅ Collections

# Internal (Evaluator)
app.include_router(internal.router)
app.include_router(internal_evaluator.router)

# AI
app.include_router(ai_chat_router)
app.include_router(ai_plan_router)
app.include_router(ai_progress_router)
app.include_router(ai_recommendation_router)
app.include_router(ai_metrics_router)
app.include_router(ai_image_router)
app.include_router(ai_central.router)
app.include_router(ai_adaptation.router)
app.include_router(central_summary.router)

# Diet
app.include_router(diet.router)

# Onboarding
app.include_router(onboarding.router)
app.include_router(onboarding_health.router)

# Phase 3 — Medication + Health Records
app.include_router(medication_router.router)
app.include_router(health_records_router.router)
app.include_router(reminder_reasoning.router)
app.include_router(reminder_behavior.router)

# Phase 4 — Exercise Library + Food Database
from app.routers import exercises as exercises_router
from app.routers import foods as foods_router
app.include_router(exercises_router.router)
app.include_router(foods_router.router)

# Behavioural Event Log
app.include_router(behaviour.router)

# Agent Layer — WebSocket + REST API
app.include_router(agent_ws.router)
app.include_router(agent_api.router)
app.include_router(voice_router.router)

# -------------------------------------------------
# ORCHESTRATOR
# -------------------------------------------------
app.mount("/orchestrate", orchestrator_app)
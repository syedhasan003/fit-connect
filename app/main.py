from app.db.database import init_db
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.db.database import engine, Base
from app.routers import health, auth, gyms, analytics
import app.models.user as _user_models
import app.models.gym as _gym_models
import app.models.visit as _visit_models
import app.models.gallery as _gallery_models  # new gallery model import
from app.ai.routers.ai_chat_router import router as ai_chat_router
from app.ai.routers.ai_plan_router import router as ai_plan_router
from app.ai.routers.ai_progress_router import router as ai_progress_router
from app.ai.routers.ai_recommendation_router import router as ai_recommendation_router
from app.ai.routers.ai_metrics_router import router as ai_metrics_router
from app.routers import users as users_router
app = FastAPI(title="FitConnect API", version="1.0.0")
from app.routers import progress as progress_router
from app.routers import health_profile as health_profile_router
from app.routers import health_memory
from app.routers import reminders
from app.routers import reminder_actions
from app.routers.reminder_ack import router as reminder_ack_router
from app.routes import internal
from app.routers.library import router as library_router
from app.routers import library
from app.routers.ai_image import router as ai_image_router
from app.routers import ai_central
from app.routers import onboarding
from app.routers import reminder_reasoning
from app.routers import onboarding_health
from app.routers import reminder_behavior
from app.routers import ai_adaptation
# Static files (for images, videos, media)
app.mount("/static", StaticFiles(directory="static"), name="static")

# include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(gyms.router)
app.include_router(analytics.router)
app.include_router(ai_chat_router)
app.include_router(ai_plan_router)
app.include_router(ai_progress_router)
app.include_router(ai_recommendation_router)
app.include_router(ai_metrics_router)
app.include_router(users_router.router)
app.include_router(progress_router.router)
app.include_router(health_profile_router.router)
app.include_router(health_memory.router)
app.include_router(reminders.router)
app.include_router(reminder_actions.router)
app.include_router(reminder_ack_router)
app.include_router(internal.router)
app.include_router(library_router)
app.include_router(library.router)
app.include_router(ai_image_router) 
app.include_router(ai_central.router)
app.include_router(onboarding.router)
app.include_router(reminder_reasoning.router)
app.include_router(onboarding_health.router)
app.include_router(reminder_behavior.router)
app.include_router(ai_adaptation.router)
# include gallery router separately (avoid circular import)
from app.routers import gallery as gallery_router
app.include_router(gallery_router.router)

@app.on_event("startup")
def on_startup():
    init_db()
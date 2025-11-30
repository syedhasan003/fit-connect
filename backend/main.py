# main.py
from app.routers.analytics import router as analytics_router
from fastapi import FastAPI
from app.database.session import init_db
from app.database.seed import seed_gyms

# Import routers (these ARE ALREADY APIRouter objects)
from app.routers import auth, health, progress, gym

app = FastAPI(
    title="FitConnect API",
    version="1.0.0",
    description="Backend API for FitConnect Fitness Platform"
)

# Include routers directly
app.include_router(auth)
app.include_router(health)
app.include_router(progress)
app.include_router(gym)
app.include_router(analytics_router)
@app.on_event("startup")
def on_startup():
    init_db()
    seed_gyms()

@app.get("/")
def root():
    return {"message": "FitConnect API is live!"}

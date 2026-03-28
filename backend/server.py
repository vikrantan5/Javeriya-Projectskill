from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="TalentConnect - Intelligent Student Collaboration & Academic Support Platform"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(',') if settings.CORS_ORIGINS != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")

# Import and include route modules
from app.api.routes import (
    auth, skills, sessions, tasks, reviews, payments, ai, admin, 
    notifications, users, reputation, mentors, roadmap, verification,
      realtime, leaderboard, calendar, activities, storage, dashboard, 
    ratings, wallet, reports, disputes
)


api_router.include_router(auth.router)
api_router.include_router(skills.router)
api_router.include_router(sessions.router)
api_router.include_router(tasks.router)
api_router.include_router(reviews.router)
api_router.include_router(payments.router)
api_router.include_router(ai.router)
api_router.include_router(admin.router)
api_router.include_router(notifications.router)
api_router.include_router(users.router)
api_router.include_router(reputation.router)
api_router.include_router(mentors.router)
api_router.include_router(roadmap.router)
api_router.include_router(verification.router)
api_router.include_router(realtime.router)
api_router.include_router(leaderboard.router)
api_router.include_router(calendar.router)
api_router.include_router(activities.router)
api_router.include_router(storage.router)
api_router.include_router(dashboard.router)
api_router.include_router(ratings.router)
api_router.include_router(wallet.router)
api_router.include_router(reports.router)
api_router.include_router(disputes.router)
# Include API router in main app
app.include_router(api_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to TalentConnect API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "TalentConnect"}

@app.head("/health")
async def health_head():
    return

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

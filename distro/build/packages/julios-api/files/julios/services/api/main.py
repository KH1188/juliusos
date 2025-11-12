"""Main FastAPI application for JuliusOS."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .config import settings
from .routers import (
    health, settings as settings_router, calendar, tasks, habits,
    meals, workouts, sleep, projects, skills, journal, notes,
    bible, finances, contacts, routines, goals, automations, agent,
    skin, profile, relationships
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="JuliOS API",
    description="Local-first life operating system API",
    version="2.0.0",
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "tauri://localhost"],  # Tauri dev + prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(settings_router.router, prefix="/settings", tags=["settings"])
app.include_router(calendar.router, prefix="/calendars", tags=["calendar"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(habits.router, prefix="/habits", tags=["habits"])
app.include_router(meals.router, prefix="/meals", tags=["meals"])
app.include_router(workouts.router, prefix="/workouts", tags=["workouts"])
app.include_router(sleep.router, prefix="/sleep", tags=["sleep"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(skills.router, prefix="/skills", tags=["skills"])
app.include_router(journal.router, prefix="/journal", tags=["journal"])
app.include_router(notes.router, prefix="/notes", tags=["notes"])
app.include_router(bible.router, prefix="/bible", tags=["bible"])
app.include_router(finances.router, prefix="/finances", tags=["finances"])
app.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
app.include_router(routines.router, prefix="/routines", tags=["routines"])
app.include_router(goals.router, prefix="/goals", tags=["goals"])
app.include_router(automations.router, prefix="/automations", tags=["automations"])
app.include_router(agent.router, prefix="/agent", tags=["agent"])
app.include_router(skin.router, prefix="/skin", tags=["skin"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(relationships.router, prefix="/relationships", tags=["relationships"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
    )

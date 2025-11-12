"""Pydantic schemas for JuliusOS API."""
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


# Base schemas
class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"


# Settings
class SettingsBase(BaseModel):
    ollama_model: Optional[str] = "llama3:8b"
    ollama_url: Optional[str] = "http://localhost:11434"
    theme: Optional[str] = "system"
    first_day_of_week: Optional[int] = 0
    privacy_lock: Optional[bool] = False


class SettingsResponse(SettingsBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# Calendar
class CalendarCreate(BaseModel):
    title: str


class CalendarResponse(BaseModel):
    id: int
    user_id: int
    title: str

    class Config:
        from_attributes = True


# Events
class EventCreate(BaseModel):
    calendar_id: int
    title: str
    description: Optional[str] = None
    start_ts: datetime
    end_ts: datetime
    location: Optional[str] = None
    all_day: bool = False
    tags: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_ts: Optional[datetime] = None
    end_ts: Optional[datetime] = None
    location: Optional[str] = None
    all_day: Optional[bool] = None
    tags: Optional[str] = None


class EventResponse(BaseModel):
    id: int
    calendar_id: int
    title: str
    description: Optional[str]
    start_ts: datetime
    end_ts: datetime
    location: Optional[str]
    all_day: bool
    tags: Optional[str]

    class Config:
        from_attributes = True


# Tasks
class TaskCreate(BaseModel):
    title: str
    notes: Optional[str] = None
    due_ts: Optional[datetime] = None
    status: str = "todo"
    priority: int = 0
    project_id: Optional[int] = None
    tags: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    due_ts: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    project_id: Optional[int] = None
    tags: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    notes: Optional[str]
    due_ts: Optional[datetime]
    status: str
    priority: int
    project_id: Optional[int]
    tags: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Habits
class HabitCreate(BaseModel):
    name: str
    cadence_json: Dict[str, Any]
    target: Optional[int] = None
    unit: Optional[str] = None
    is_active: bool = True


class HabitResponse(BaseModel):
    id: int
    user_id: int
    name: str
    cadence_json: Dict[str, Any]
    target: Optional[int]
    unit: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class HabitLogCreate(BaseModel):
    date: datetime
    value: int = 1


class HabitLogResponse(BaseModel):
    id: int
    habit_id: int
    date: datetime
    value: int

    class Config:
        from_attributes = True


# Meals
class MealCreate(BaseModel):
    name: str
    dt: datetime
    calories: int = 0
    protein_g: int = 0
    carbs_g: int = 0
    fat_g: int = 0
    notes: Optional[str] = None
    items_json: Optional[Dict[str, Any]] = None


class MealResponse(BaseModel):
    id: int
    user_id: int
    name: str
    dt: datetime
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    notes: Optional[str]
    items_json: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


# Workouts
class WorkoutCreate(BaseModel):
    dt: datetime
    type: str
    duration_min: int = 0
    notes: Optional[str] = None


class WorkoutResponse(BaseModel):
    id: int
    user_id: int
    dt: datetime
    type: str
    duration_min: int
    notes: Optional[str]

    class Config:
        from_attributes = True


# Sleep
class SleepLogCreate(BaseModel):
    date: datetime
    duration_min: int
    quality: int = 3


class SleepLogResponse(BaseModel):
    id: int
    user_id: int
    date: datetime
    duration_min: int
    quality: int

    class Config:
        from_attributes = True


# Projects
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "active"
    start_ts: Optional[datetime] = None
    end_ts: Optional[datetime] = None


class ProjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    status: str
    start_ts: datetime
    end_ts: Optional[datetime]

    class Config:
        from_attributes = True


# Skills
class SkillCreate(BaseModel):
    name: str
    level: int = 1
    goal_level: int = 10


class SkillResponse(BaseModel):
    id: int
    user_id: int
    name: str
    level: int
    goal_level: int
    created_at: datetime

    class Config:
        from_attributes = True


# Learning Sessions
class LearningSessionCreate(BaseModel):
    dt: datetime
    skill_id: Optional[int] = None
    duration_min: int = 0
    notes: Optional[str] = None
    source: Optional[str] = None


class LearningSessionResponse(BaseModel):
    id: int
    user_id: int
    dt: datetime
    skill_id: Optional[int]
    duration_min: int
    notes: Optional[str]
    source: Optional[str]

    class Config:
        from_attributes = True


# Journal
class JournalEntryCreate(BaseModel):
    dt: datetime
    title: Optional[str] = None
    content_md: str
    mood: Optional[int] = None
    tags: Optional[str] = None


class JournalEntryResponse(BaseModel):
    id: int
    user_id: int
    dt: datetime
    title: Optional[str]
    content_md: str
    mood: Optional[int]
    tags: Optional[str]

    class Config:
        from_attributes = True


# Notes
class NoteCreate(BaseModel):
    title: str
    content_md: str
    tags: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content_md: Optional[str] = None
    tags: Optional[str] = None


class NoteResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content_md: str
    tags: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Bible
class BiblePlanCreate(BaseModel):
    name: str
    plan_json: Dict[str, Any]


class BiblePlanResponse(BaseModel):
    id: int
    user_id: int
    name: str
    plan_json: Dict[str, Any]

    class Config:
        from_attributes = True


class BibleReadingCreate(BaseModel):
    plan_id: Optional[int] = None
    dt: datetime
    book: str
    chapter: int
    verse_start: Optional[int] = None
    verse_end: Optional[int] = None


class BibleReadingResponse(BaseModel):
    id: int
    plan_id: Optional[int]
    dt: datetime
    book: str
    chapter: int
    verse_start: Optional[int]
    verse_end: Optional[int]

    class Config:
        from_attributes = True


class BibleReflectionCreate(BaseModel):
    dt: datetime
    passage_ref: str
    reflection_md: str
    tags: Optional[str] = None


class BibleReflectionResponse(BaseModel):
    id: int
    user_id: int
    dt: datetime
    passage_ref: str
    reflection_md: str
    tags: Optional[str]

    class Config:
        from_attributes = True


class PrayerItemCreate(BaseModel):
    title: str
    details: Optional[str] = None
    status: str = "open"


class PrayerItemUpdate(BaseModel):
    title: Optional[str] = None
    details: Optional[str] = None
    status: Optional[str] = None
    answered_at: Optional[datetime] = None


class PrayerItemResponse(BaseModel):
    id: int
    user_id: int
    title: str
    details: Optional[str]
    status: str
    created_at: datetime
    answered_at: Optional[datetime]

    class Config:
        from_attributes = True


# Finances
class BudgetCreate(BaseModel):
    month_yyyymm: str
    categories_json: Dict[str, int]


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    month_yyyymm: str
    categories_json: Dict[str, int]

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    dt: datetime
    amount_cents: int
    category: str
    merchant: Optional[str] = None
    memo: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    dt: datetime
    amount_cents: int
    category: str
    merchant: Optional[str]
    memo: Optional[str]

    class Config:
        from_attributes = True


class SavingsGoalCreate(BaseModel):
    name: str
    target_cents: int
    current_cents: int = 0
    target_date: Optional[datetime] = None


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_cents: Optional[int] = None
    current_cents: Optional[int] = None
    target_date: Optional[datetime] = None


class SavingsGoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    target_cents: int
    current_cents: int
    target_date: Optional[datetime]

    class Config:
        from_attributes = True


# Relationships
class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    birthday: Optional[datetime] = None
    notes: Optional[str] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    birthday: Optional[datetime] = None
    notes: Optional[str] = None


class ContactResponse(BaseModel):
    id: int
    user_id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    birthday: Optional[datetime]
    notes: Optional[str]

    class Config:
        from_attributes = True


class InteractionCreate(BaseModel):
    contact_id: int
    dt: datetime
    type: str
    summary: Optional[str] = None
    follow_up_ts: Optional[datetime] = None
    sentiment: int = 3


class InteractionResponse(BaseModel):
    id: int
    user_id: int
    contact_id: int
    dt: datetime
    type: str
    summary: Optional[str]
    follow_up_ts: Optional[datetime]
    sentiment: int

    class Config:
        from_attributes = True


# Routines
class RoutineCreate(BaseModel):
    name: str
    cadence_json: Dict[str, Any]
    checklist_json: Dict[str, Any]


class RoutineResponse(BaseModel):
    id: int
    user_id: int
    name: str
    cadence_json: Dict[str, Any]
    checklist_json: Dict[str, Any]

    class Config:
        from_attributes = True


class RoutineRunCreate(BaseModel):
    routine_id: int
    dt: datetime
    completed: bool = False
    notes: Optional[str] = None


class RoutineRunResponse(BaseModel):
    id: int
    routine_id: int
    dt: datetime
    completed: bool
    notes: Optional[str]

    class Config:
        from_attributes = True


# Goals
class GoalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    horizon: str
    status: str = "active"
    start_ts: Optional[datetime] = None
    target_ts: Optional[datetime] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    horizon: Optional[str] = None
    status: Optional[str] = None
    target_ts: Optional[datetime] = None


class GoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    horizon: str
    status: str
    start_ts: datetime
    target_ts: Optional[datetime]

    class Config:
        from_attributes = True


class GoalCheckinCreate(BaseModel):
    goal_id: int
    dt: datetime
    progress: int
    notes: Optional[str] = None


class GoalCheckinResponse(BaseModel):
    id: int
    goal_id: int
    dt: datetime
    progress: int
    notes: Optional[str]

    class Config:
        from_attributes = True


# Automations
class AutomationRuleCreate(BaseModel):
    name: str
    trigger_json: Dict[str, Any]
    condition_json: Dict[str, Any]
    action_json: Dict[str, Any]
    is_active: bool = True


class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = None
    trigger_json: Optional[Dict[str, Any]] = None
    condition_json: Optional[Dict[str, Any]] = None
    action_json: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class AutomationRuleResponse(BaseModel):
    id: int
    user_id: int
    name: str
    trigger_json: Dict[str, Any]
    condition_json: Dict[str, Any]
    action_json: Dict[str, Any]
    is_active: bool
    last_run_ts: Optional[datetime]

    class Config:
        from_attributes = True


class AutomationLogResponse(BaseModel):
    id: int
    rule_id: int
    dt: datetime
    result_json: Dict[str, Any]

    class Config:
        from_attributes = True


# Agent schemas
class AgentAskRequest(BaseModel):
    query: str
    context_window_days: int = 7


class AgentAskResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = []
    reasoning: Optional[str] = None


class DailyDigestResponse(BaseModel):
    plan: List[Dict[str, Any]]
    conflicts: List[Dict[str, Any]]
    blocks: List[Dict[str, Any]]
    health: Dict[str, Any]
    bible: Dict[str, Any]
    journal_prompt: str


class WeeklyReviewResponse(BaseModel):
    wins: List[str]
    improvements: List[str]
    metrics: Dict[str, Any]
    goals_checkin: List[Dict[str, Any]]
    habit_notes: List[str]


# Skin & Hygiene
class SkinProductCreate(BaseModel):
    name: str
    step: str  # cleanser, treat, moisturizer, spf, other
    active_json: Optional[Dict[str, Any]] = None
    opened_at: Optional[datetime] = None
    pao_months: Optional[int] = None
    notes: Optional[str] = None
    is_active: bool = True


class SkinProductResponse(BaseModel):
    id: int
    user_id: int
    name: str
    step: str
    active_json: Optional[Dict[str, Any]]
    opened_at: Optional[datetime]
    pao_months: Optional[int]
    notes: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class SkinRoutineCreate(BaseModel):
    name: str
    time_of_day: str  # AM, PM
    steps_json: Dict[str, Any]


class SkinRoutineResponse(BaseModel):
    id: int
    user_id: int
    name: str
    time_of_day: str
    steps_json: Dict[str, Any]

    class Config:
        from_attributes = True


class SkinLogCreate(BaseModel):
    dt: datetime
    irritation: int = 0
    dryness: int = 0
    oiliness: int = 0
    notes: Optional[str] = None


class SkinLogResponse(BaseModel):
    id: int
    user_id: int
    dt: datetime
    irritation: int
    dryness: int
    oiliness: int
    notes: Optional[str]

    class Config:
        from_attributes = True


# User Profile
class UserProfileUpdate(BaseModel):
    profile_json: Dict[str, Any]


class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    profile_json: Dict[str, Any]
    updated_at: datetime

    class Config:
        from_attributes = True


class MemoryEventCreate(BaseModel):
    question: str
    answer: str
    confidence: int = 5
    context_tag: Optional[str] = None


class MemoryEventResponse(BaseModel):
    id: int
    user_id: int
    question: str
    answer: str
    confidence: int
    context_tag: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ValuesJournalCreate(BaseModel):
    dt: datetime
    north_star: Optional[str] = None
    quarterly_bets_json: Optional[Dict[str, Any]] = None
    reflections_md: Optional[str] = None


class ValuesJournalResponse(BaseModel):
    id: int
    user_id: int
    dt: datetime
    north_star: Optional[str]
    quarterly_bets_json: Optional[Dict[str, Any]]
    reflections_md: Optional[str]

    class Config:
        from_attributes = True


# Environment Prompts
class EnvironmentPromptCreate(BaseModel):
    kind: str
    cadence_json: Dict[str, Any]
    is_active: bool = True


class EnvironmentPromptResponse(BaseModel):
    id: int
    user_id: int
    kind: str
    cadence_json: Dict[str, Any]
    last_run_dt: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True


# Nurture Cycles
class NurtureCycleCreate(BaseModel):
    contact_id: int
    tie_strength: str = "medium"
    cadence_days: int = 14
    last_contact_dt: Optional[datetime] = None


class NurtureCycleUpdate(BaseModel):
    tie_strength: Optional[str] = None
    cadence_days: Optional[int] = None
    last_contact_dt: Optional[datetime] = None


class NurtureCycleResponse(BaseModel):
    id: int
    contact_id: int
    tie_strength: str
    cadence_days: int
    last_contact_dt: Optional[datetime]

    class Config:
        from_attributes = True


# Purchase Cooldown
class PurchaseCooldownCreate(BaseModel):
    item_name: str
    category: str
    amount_cents: int
    expires_at: datetime
    notes: Optional[str] = None


class PurchaseCooldownResponse(BaseModel):
    id: int
    user_id: int
    item_name: str
    category: str
    amount_cents: int
    added_at: datetime
    expires_at: datetime
    purchased: bool
    notes: Optional[str]

    class Config:
        from_attributes = True


# Next Best Step
class NextBestStepResponse(BaseModel):
    action: str
    duration_min: int
    why: str
    refs: List[Dict[str, Any]] = []


# Skin Coach
class SkinCoachResponse(BaseModel):
    routine: List[Dict[str, Any]]
    notes: str

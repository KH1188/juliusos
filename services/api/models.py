"""SQLAlchemy models for JuliusOS."""
from datetime import datetime
from sqlalchemy import (
    Boolean, Column, Integer, String, Text, DateTime,
    ForeignKey, Index, JSON
)
from sqlalchemy.orm import relationship
from .database import Base


# Core & Identity
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String(255), nullable=False)
    timezone = Column(String(50), default="UTC")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ollama_model = Column(String(100), default="llama3:8b")
    ollama_url = Column(String(255), default="http://localhost:11434")
    theme = Column(String(50), default="system")
    first_day_of_week = Column(Integer, default=0)  # 0 = Sunday
    privacy_lock = Column(Boolean, default=False)
    privacy_lock_hash = Column(String(255), nullable=True)

    user = relationship("User", backref="settings")


# Planning
class Calendar(Base):
    __tablename__ = "calendars"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)

    user = relationship("User", backref="calendars")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    calendar_id = Column(Integer, ForeignKey("calendars.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_ts = Column(DateTime, nullable=False)
    end_ts = Column(DateTime, nullable=False)
    location = Column(String(255), nullable=True)
    all_day = Column(Boolean, default=False)
    tags = Column(Text, nullable=True)  # JSON array as text

    calendar = relationship("Calendar", backref="events")

    __table_args__ = (
        Index("idx_events_calendar_start", "calendar_id", "start_ts"),
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    due_ts = Column(DateTime, nullable=True)
    status = Column(String(20), default="todo")  # todo, doing, done
    priority = Column(Integer, default=0)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="tasks")
    project = relationship("Project", back_populates="tasks")

    __table_args__ = (
        Index("idx_tasks_user_status", "user_id", "status"),
        Index("idx_tasks_user_due", "user_id", "due_ts"),
    )


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    cadence_json = Column(JSON, nullable=False)  # {type: "daily"|"weekly", days: []}
    target = Column(Integer, nullable=True)
    unit = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="habits")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    value = Column(Integer, default=1)

    habit = relationship("Habit", backref="logs")

    __table_args__ = (
        Index("idx_habit_logs_habit_date", "habit_id", "date"),
    )


# Health
class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    dt = Column(DateTime, nullable=False)
    calories = Column(Integer, default=0)
    protein_g = Column(Integer, default=0)
    carbs_g = Column(Integer, default=0)
    fat_g = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    items_json = Column(JSON, nullable=True)

    user = relationship("User", backref="meals")

    __table_args__ = (
        Index("idx_meals_user_dt", "user_id", "dt"),
    )


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dt = Column(DateTime, nullable=False)
    type = Column(String(100), nullable=False)
    duration_min = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    user = relationship("User", backref="workouts")

    __table_args__ = (
        Index("idx_workouts_user_dt", "user_id", "dt"),
    )


class SleepLog(Base):
    __tablename__ = "sleep_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    duration_min = Column(Integer, default=0)
    quality = Column(Integer, default=3)  # 1-5 scale

    user = relationship("User", backref="sleep_logs")

    __table_args__ = (
        Index("idx_sleep_logs_user_date", "user_id", "date"),
    )


# Skill & Projects
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active")
    start_ts = Column(DateTime, default=datetime.utcnow)
    end_ts = Column(DateTime, nullable=True)

    user = relationship("User", backref="projects")
    tasks = relationship("Task", back_populates="project")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    level = Column(Integer, default=1)
    goal_level = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="skills")


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dt = Column(DateTime, nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    duration_min = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    source = Column(Text, nullable=True)

    user = relationship("User", backref="learning_sessions")
    skill = relationship("Skill", backref="sessions")

    __table_args__ = (
        Index("idx_learning_sessions_user_dt", "user_id", "dt"),
    )


# Journaling & Knowledge
class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dt = Column(DateTime, nullable=False)
    title = Column(String(255), nullable=True)
    content_md = Column(Text, nullable=False)
    mood = Column(Integer, nullable=True)  # 1-5 scale
    tags = Column(Text, nullable=True)

    user = relationship("User", backref="journal_entries")

    __table_args__ = (
        Index("idx_journal_entries_user_dt", "user_id", "dt"),
    )


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content_md = Column(Text, nullable=False)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="notes")


class NoteLink(Base):
    __tablename__ = "note_links"

    id = Column(Integer, primary_key=True, index=True)
    src_note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    dst_note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)

    src_note = relationship("Note", foreign_keys=[src_note_id], backref="outgoing_links")
    dst_note = relationship("Note", foreign_keys=[dst_note_id], backref="incoming_links")


# Bible Study
class BiblePlan(Base):
    __tablename__ = "bible_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    plan_json = Column(JSON, nullable=False)

    user = relationship("User", backref="bible_plans")


class BibleReading(Base):
    __tablename__ = "bible_readings"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("bible_plans.id"), nullable=True)
    dt = Column(DateTime, nullable=False)
    book = Column(String(100), nullable=False)
    chapter = Column(Integer, nullable=False)
    verse_start = Column(Integer, nullable=True)
    verse_end = Column(Integer, nullable=True)

    plan = relationship("BiblePlan", backref="readings")

    __table_args__ = (
        Index("idx_bible_readings_dt", "dt"),
    )


class BibleReflection(Base):
    __tablename__ = "bible_reflections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dt = Column(DateTime, nullable=False)
    passage_ref = Column(String(255), nullable=False)
    reflection_md = Column(Text, nullable=False)
    tags = Column(Text, nullable=True)

    user = relationship("User", backref="bible_reflections")

    __table_args__ = (
        Index("idx_bible_reflections_user_dt", "user_id", "dt"),
    )


class PrayerItem(Base):
    __tablename__ = "prayer_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String(50), default="open")  # open, answered, archived
    created_at = Column(DateTime, default=datetime.utcnow)
    answered_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="prayer_items")


# Finances
class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    month_yyyymm = Column(String(7), nullable=False)  # e.g., "2024-01"
    categories_json = Column(JSON, nullable=False)  # {category: limit_cents}

    user = relationship("User", backref="budgets")

    __table_args__ = (
        Index("idx_budgets_user_month", "user_id", "month_yyyymm"),
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dt = Column(DateTime, nullable=False)
    amount_cents = Column(Integer, nullable=False)
    category = Column(String(100), nullable=False)
    merchant = Column(String(255), nullable=True)
    memo = Column(Text, nullable=True)

    user = relationship("User", backref="transactions")

    __table_args__ = (
        Index("idx_transactions_user_dt", "user_id", "dt"),
    )


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    target_cents = Column(Integer, nullable=False)
    current_cents = Column(Integer, default=0)
    target_date = Column(DateTime, nullable=True)

    user = relationship("User", backref="savings_goals")


# Relationships
class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    birthday = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", backref="contacts")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    dt = Column(DateTime, nullable=False)
    type = Column(String(100), nullable=False)  # call, text, meeting, etc.
    summary = Column(Text, nullable=True)
    follow_up_ts = Column(DateTime, nullable=True)
    sentiment = Column(Integer, default=3)  # 1-5 scale

    user = relationship("User", backref="interactions")
    contact = relationship("Contact", backref="interactions")

    __table_args__ = (
        Index("idx_interactions_user_dt", "user_id", "dt"),
        Index("idx_interactions_contact_dt", "contact_id", "dt"),
    )


# Routines & Chores
class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    cadence_json = Column(JSON, nullable=False)
    checklist_json = Column(JSON, nullable=False)

    user = relationship("User", backref="routines")


class RoutineRun(Base):
    __tablename__ = "routine_runs"

    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"), nullable=False)
    dt = Column(DateTime, nullable=False)
    completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    routine = relationship("Routine", backref="runs")

    __table_args__ = (
        Index("idx_routine_runs_routine_dt", "routine_id", "dt"),
    )


# Long-Term Vision
class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    horizon = Column(String(50), nullable=False)  # weekly, quarter, year, 5yr
    status = Column(String(50), default="active")
    start_ts = Column(DateTime, default=datetime.utcnow)
    target_ts = Column(DateTime, nullable=True)

    user = relationship("User", backref="goals")


class GoalCheckin(Base):
    __tablename__ = "goal_checkins"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    dt = Column(DateTime, nullable=False)
    progress = Column(Integer, default=0)  # percentage
    notes = Column(Text, nullable=True)

    goal = relationship("Goal", backref="checkins")

    __table_args__ = (
        Index("idx_goal_checkins_goal_dt", "goal_id", "dt"),
    )


# Automations
class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    trigger_json = Column(JSON, nullable=False)
    condition_json = Column(JSON, nullable=False)
    action_json = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    last_run_ts = Column(DateTime, nullable=True)

    user = relationship("User", backref="automation_rules")


class AutomationLog(Base):
    __tablename__ = "automation_logs"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("automation_rules.id"), nullable=False)
    dt = Column(DateTime, default=datetime.utcnow)
    result_json = Column(JSON, nullable=False)

    rule = relationship("AutomationRule", backref="logs")

    __table_args__ = (
        Index("idx_automation_logs_rule_dt", "rule_id", "dt"),
    )


# Skin & Hygiene
class SkinProduct(Base):
    __tablename__ = "skin_products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    step = Column(String(50), nullable=False)  # cleanser, treat, moisturizer, spf, other
    active_json = Column(JSON, nullable=True)  # active ingredients
    opened_at = Column(DateTime, nullable=True)
    pao_months = Column(Integer, nullable=True)  # period after opening
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", backref="skin_products")


class SkinRoutine(Base):
    __tablename__ = "skin_routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    time_of_day = Column(String(10), nullable=False)  # AM, PM
    steps_json = Column(JSON, nullable=False)  # [{product_id, order, notes}]

    user = relationship("User", backref="skin_routines")


class SkinLog(Base):
    __tablename__ = "skin_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dt = Column(DateTime, nullable=False)
    irritation = Column(Integer, default=0)  # 0-5 scale
    dryness = Column(Integer, default=0)  # 0-5 scale
    oiliness = Column(Integer, default=0)  # 0-5 scale
    notes = Column(Text, nullable=True)

    user = relationship("User", backref="skin_logs")

    __table_args__ = (
        Index("idx_skin_logs_user_dt", "user_id", "dt"),
    )


# User Profile & Memory
class UserProfile(Base):
    __tablename__ = "user_profile"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    profile_json = Column(JSON, nullable=False, default=dict)  # core facts: skin_type, chronotype, protein_target, etc.
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="profile", uselist=False)


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key = Column(String(100), nullable=False)
    value_json = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="preferences")

    __table_args__ = (
        Index("idx_user_preferences_user_key", "user_id", "key", unique=True),
    )


class ProfileHistory(Base):
    __tablename__ = "profile_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key = Column(String(100), nullable=False)
    old_json = Column(JSON, nullable=True)
    new_json = Column(JSON, nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="profile_history")

    __table_args__ = (
        Index("idx_profile_history_user_changed", "user_id", "changed_at"),
    )


class MemoryEvent(Base):
    __tablename__ = "memory_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    confidence = Column(Integer, default=5)  # 1-10 scale
    context_tag = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="memory_events")

    __table_args__ = (
        Index("idx_memory_events_user_created", "user_id", "created_at"),
    )


class ValuesJournal(Base):
    __tablename__ = "values_journal"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dt = Column(DateTime, nullable=False)
    north_star = Column(Text, nullable=True)
    quarterly_bets_json = Column(JSON, nullable=True)
    reflections_md = Column(Text, nullable=True)

    user = relationship("User", backref="values_journal")

    __table_args__ = (
        Index("idx_values_journal_user_dt", "user_id", "dt"),
    )


# Physical & Environmental
class EnvironmentPrompt(Base):
    __tablename__ = "environment_prompts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    kind = Column(String(50), nullable=False)  # mobility, desk_reset, etc.
    cadence_json = Column(JSON, nullable=False)  # {minutes: 45} or {cron: "0 17 * * 5"}
    last_run_dt = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", backref="environment_prompts")


# Relationships Enhancement
class NurtureCycle(Base):
    __tablename__ = "nurture_cycles"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    tie_strength = Column(String(20), default="medium")  # light, medium, strong
    cadence_days = Column(Integer, default=14)
    last_contact_dt = Column(DateTime, nullable=True)

    contact = relationship("Contact", backref="nurture_cycle", uselist=False)


# Finances Add-on
class PurchaseCooldown(Base):
    __tablename__ = "purchase_cooldowns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    amount_cents = Column(Integer, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    purchased = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    user = relationship("User", backref="purchase_cooldowns")

    __table_args__ = (
        Index("idx_purchase_cooldowns_user_expires", "user_id", "expires_at"),
    )


# Onboarding
class OnboardingProgress(Base):
    __tablename__ = "onboarding_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    day_0_complete = Column(Boolean, default=False)
    day_2_complete = Column(Boolean, default=False)
    day_7_complete = Column(Boolean, default=False)
    questions_asked_today = Column(Integer, default=0)
    last_question_date = Column(DateTime, nullable=True)
    monthly_checkin_last = Column(DateTime, nullable=True)

    user = relationship("User", backref="onboarding_progress", uselist=False)

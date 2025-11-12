"""Seed data for JuliusOS development and testing."""
import sys
from pathlib import Path
from datetime import datetime, timedelta
import json

# Add the services directory to the path
root_dir = Path(__file__).parent.parent.parent
services_dir = root_dir / "services"
sys.path.insert(0, str(services_dir))

from api.database import SessionLocal, engine, Base
from api import models


def seed_database():
    """Populate database with sample data."""
    print("Seeding database...")

    # Create all tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if data already exists
        existing_user = db.query(models.User).first()
        if existing_user:
            print("Database already seeded. Skipping...")
            return

        # Create user
        user = models.User(
            display_name="Julius",
            timezone="America/Chicago",
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.flush()

        # Create settings
        settings = models.Settings(
            user_id=user.id,
            ollama_model="llama3:8b",
            ollama_url="http://localhost:11434",
            theme="system",
            first_day_of_week=0,
        )
        db.add(settings)

        # Create calendar
        calendar = models.Calendar(user_id=user.id, title="Personal")
        db.add(calendar)
        db.flush()

        # Create sample events for next week
        now = datetime.utcnow()
        for i in range(5):
            event = models.Event(
                calendar_id=calendar.id,
                title=f"Meeting {i+1}",
                description=f"Sample meeting {i+1}",
                start_ts=now + timedelta(days=i, hours=10),
                end_ts=now + timedelta(days=i, hours=11),
                all_day=False,
            )
            db.add(event)

        # Create project
        project = models.Project(
            user_id=user.id,
            name="JuliusOS",
            description="Build local-first life OS",
            status="active",
            start_ts=now,
        )
        db.add(project)
        db.flush()

        # Create sample tasks
        task_titles = [
            "Complete weekly review",
            "Update Bible reading plan",
            "Log workout for today",
            "Review budget for month",
            "Call Mom",
            "Finish project milestone",
            "Schedule dentist appointment",
        ]

        for i, title in enumerate(task_titles):
            task = models.Task(
                user_id=user.id,
                title=title,
                notes=f"Sample note for {title}",
                due_ts=now + timedelta(days=i),
                status="todo" if i < 5 else "doing" if i < 6 else "done",
                priority=len(task_titles) - i,
                project_id=project.id if i == 5 else None,
            )
            db.add(task)

        # Create habits
        habits_data = [
            {"name": "Pushups", "target": 50, "unit": "reps"},
            {"name": "Reading", "target": 30, "unit": "minutes"},
            {"name": "Meditation", "target": 15, "unit": "minutes"},
        ]

        for habit_data in habits_data:
            habit = models.Habit(
                user_id=user.id,
                name=habit_data["name"],
                cadence_json={"type": "daily"},
                target=habit_data["target"],
                unit=habit_data["unit"],
                is_active=True,
            )
            db.add(habit)
            db.flush()

            # Log past week
            for i in range(7):
                log = models.HabitLog(
                    habit_id=habit.id,
                    date=now - timedelta(days=i),
                    value=1 if i < 6 else 0,  # Miss one day
                )
                db.add(log)

        # Create sample meals
        meals_data = [
            {"name": "Breakfast - Oatmeal", "calories": 350, "protein_g": 15, "carbs_g": 60, "fat_g": 8},
            {"name": "Lunch - Chicken Salad", "calories": 450, "protein_g": 40, "carbs_g": 30, "fat_g": 18},
            {"name": "Dinner - Salmon & Rice", "calories": 600, "protein_g": 45, "carbs_g": 70, "fat_g": 20},
            {"name": "Snack - Protein Shake", "calories": 200, "protein_g": 30, "carbs_g": 15, "fat_g": 3},
        ]

        for day in range(7):
            for meal_data in meals_data:
                meal = models.Meal(
                    user_id=user.id,
                    name=meal_data["name"],
                    dt=now - timedelta(days=day, hours=8),
                    calories=meal_data["calories"],
                    protein_g=meal_data["protein_g"],
                    carbs_g=meal_data["carbs_g"],
                    fat_g=meal_data["fat_g"],
                )
                db.add(meal)

        # Create workouts
        workout_types = ["Strength Training", "Cardio", "Yoga", "HIIT"]
        for i in range(7):
            if i % 2 == 0:  # Every other day
                workout = models.Workout(
                    user_id=user.id,
                    dt=now - timedelta(days=i),
                    type=workout_types[i % len(workout_types)],
                    duration_min=45 + (i * 5),
                    notes="Felt great!",
                )
                db.add(workout)

        # Create sleep logs
        for i in range(7):
            sleep_log = models.SleepLog(
                user_id=user.id,
                date=now - timedelta(days=i),
                duration_min=360 + (i * 15),  # 6-7.5 hours
                quality=3 + (i % 3),  # Quality 3-5
            )
            db.add(sleep_log)

        # Create skills
        skills_data = [
            {"name": "Python", "level": 7, "goal_level": 9},
            {"name": "React", "level": 6, "goal_level": 8},
            {"name": "Machine Learning", "level": 4, "goal_level": 7},
        ]

        for skill_data in skills_data:
            skill = models.Skill(user_id=user.id, **skill_data)
            db.add(skill)

        # Create learning sessions
        for i in range(5):
            session = models.LearningSession(
                user_id=user.id,
                dt=now - timedelta(days=i),
                duration_min=60,
                notes=f"Studied advanced concepts",
                source="Online course",
            )
            db.add(session)

        # Create journal entries
        for i in range(7):
            entry = models.JournalEntry(
                user_id=user.id,
                dt=now - timedelta(days=i),
                title=f"Day {i+1} Reflection",
                content_md=f"Today was productive. Made progress on projects and felt energized.",
                mood=4,
            )
            db.add(entry)

        # Create Bible plan
        bible_plan = models.BiblePlan(
            user_id=user.id,
            name="Gospel of John",
            plan_json={"days": [{"date": "2025-01-15", "readings": ["John 1:1-18"]}]},
        )
        db.add(bible_plan)
        db.flush()

        # Create Bible readings
        books = ["John", "Matthew", "Romans", "Psalms"]
        for i in range(7):
            reading = models.BibleReading(
                plan_id=bible_plan.id,
                dt=now - timedelta(days=i),
                book=books[i % len(books)],
                chapter=i + 1,
                verse_start=1,
                verse_end=20,
            )
            db.add(reading)

        # Create transactions
        categories = ["Groceries", "Gas", "Eating Out", "Entertainment", "Utilities"]
        for i in range(15):
            transaction = models.Transaction(
                user_id=user.id,
                dt=now - timedelta(days=i % 7),
                amount_cents=-2500 - (i * 100),
                category=categories[i % len(categories)],
                merchant=f"Store {i+1}",
            )
            db.add(transaction)

        # Create budget
        budget = models.Budget(
            user_id=user.id,
            month_yyyymm=now.strftime("%Y-%m"),
            categories_json={
                "Groceries": 50000,
                "Gas": 15000,
                "Eating Out": 20000,
                "Entertainment": 10000,
                "Utilities": 25000,
            },
        )
        db.add(budget)

        # Create contacts
        contacts_data = [
            {"name": "Mom", "phone": "555-0101", "birthday": datetime(1960, 5, 15)},
            {"name": "Dad", "phone": "555-0102", "birthday": datetime(1958, 8, 20)},
            {"name": "Sarah", "email": "sarah@example.com", "birthday": now + timedelta(days=10)},
            {"name": "Mike", "email": "mike@example.com", "phone": "555-0104"},
            {"name": "Emily", "email": "emily@example.com"},
        ]

        for contact_data in contacts_data:
            contact = models.Contact(user_id=user.id, **contact_data)
            db.add(contact)

        # Create goals
        goals_data = [
            {"name": "Launch JuliusOS", "horizon": "quarter", "description": "Complete and release v1.0"},
            {"name": "Read 24 books", "horizon": "year", "description": "Read 2 books per month"},
            {"name": "Complete ML course", "horizon": "quarter", "description": "Finish online ML specialization"},
        ]

        for goal_data in goals_data:
            goal = models.Goal(
                user_id=user.id,
                **goal_data,
                status="active",
                target_ts=now + timedelta(days=90),
            )
            db.add(goal)

        # Create routine
        routine = models.Routine(
            user_id=user.id,
            name="Morning Routine",
            cadence_json={"type": "daily"},
            checklist_json={"items": ["Meditate", "Exercise", "Journal", "Review goals"]},
        )
        db.add(routine)

        db.commit()
        print("✅ Database seeded successfully!")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

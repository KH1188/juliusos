"""Automation engine with APScheduler."""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import httpx
import logging
from .database import SessionLocal
from .models import AutomationRule, AutomationLog
import json

logger = logging.getLogger(__name__)


class AutomationEngine:
    """Automation engine for running scheduled tasks and rules."""

    def __init__(self, api_url: str = "http://localhost:8000", agent_url: str = "http://localhost:8001"):
        self.scheduler = BackgroundScheduler()
        self.api_url = api_url
        self.agent_url = agent_url
        self.client = httpx.Client(timeout=60.0)

    def start(self):
        """Start the automation scheduler."""
        logger.info("Starting automation engine...")
        self.load_rules()
        self.scheduler.start()
        logger.info("Automation engine started")

    def stop(self):
        """Stop the automation scheduler."""
        logger.info("Stopping automation engine...")
        self.scheduler.shutdown()
        self.client.close()
        logger.info("Automation engine stopped")

    def load_rules(self):
        """Load all active automation rules from database."""
        db = SessionLocal()
        try:
            rules = db.query(AutomationRule).filter(AutomationRule.is_active == True).all()

            for rule in rules:
                self.add_rule(rule)

            logger.info(f"Loaded {len(rules)} automation rules")
        finally:
            db.close()

    def add_rule(self, rule: AutomationRule):
        """Add a rule to the scheduler."""
        trigger = rule.trigger_json
        trigger_type = trigger.get("type")

        if trigger_type == "cron":
            cron_expr = trigger.get("cron")
            if cron_expr:
                # Parse cron expression (e.g., "30 7 * * *" = 7:30 AM daily)
                parts = cron_expr.split()
                if len(parts) == 5:
                    minute, hour, day, month, day_of_week = parts

                    trigger_obj = CronTrigger(
                        minute=minute,
                        hour=hour,
                        day=day,
                        month=month,
                        day_of_week=day_of_week,
                    )

                    self.scheduler.add_job(
                        self.execute_rule,
                        trigger_obj,
                        args=[rule.id],
                        id=f"rule_{rule.id}",
                        name=rule.name,
                        replace_existing=True,
                    )

                    logger.info(f"Scheduled rule: {rule.name} with cron: {cron_expr}")

    def execute_rule(self, rule_id: int):
        """Execute a single automation rule."""
        db = SessionLocal()
        try:
            rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
            if not rule or not rule.is_active:
                return

            logger.info(f"Executing rule: {rule.name}")

            # Check condition
            if not self.check_condition(rule.condition_json, rule.user_id):
                logger.info(f"Rule {rule.name} condition not met, skipping")
                return

            # Execute action
            result = self.execute_action(rule.action_json, rule.user_id)

            # Log execution
            log_entry = AutomationLog(
                rule_id=rule.id,
                dt=datetime.utcnow(),
                result_json=result,
            )
            db.add(log_entry)

            # Update last run timestamp
            rule.last_run_ts = datetime.utcnow()

            db.commit()
            logger.info(f"Rule {rule.name} executed successfully")

        except Exception as e:
            logger.error(f"Error executing rule {rule_id}: {e}")
            db.rollback()
        finally:
            db.close()

    def check_condition(self, condition: dict, user_id: int) -> bool:
        """Check if a condition is met."""
        condition_type = condition.get("type")

        if condition_type == "always":
            return True

        elif condition_type == "journal_absent":
            window = condition.get("window", "today")
            try:
                response = self.client.get(f"{self.api_url}/journal")
                entries = response.json()

                if window == "today":
                    today = datetime.utcnow().date()
                    today_entries = [
                        e for e in entries
                        if datetime.fromisoformat(e["dt"].replace("Z", "+00:00")).date() == today
                    ]
                    return len(today_entries) == 0

            except Exception as e:
                logger.error(f"Error checking journal_absent condition: {e}")
                return False

        elif condition_type == "protein_gap_gt":
            target_gap = condition.get("grams", 30)
            try:
                response = self.client.get(f"{self.api_url}/meals")
                meals = response.json()

                # Calculate today's protein
                today = datetime.utcnow().date()
                today_meals = [
                    m for m in meals
                    if datetime.fromisoformat(m["dt"].replace("Z", "+00:00")).date() == today
                ]

                total_protein = sum(m.get("protein_g", 0) for m in today_meals)
                gap = max(0, 150 - total_protein)  # Assuming 150g target

                return gap >= target_gap

            except Exception as e:
                logger.error(f"Error checking protein_gap_gt condition: {e}")
                return False

        return False

    def execute_action(self, action: dict, user_id: int) -> dict:
        """Execute an action."""
        action_type = action.get("type")

        if action_type == "run_agent_recipe":
            recipe_name = action.get("name")
            save_to = action.get("save_to")

            try:
                response = self.client.post(
                    f"{self.agent_url}/recipes/{recipe_name}",
                    json={"user_id": user_id, "params": {}},
                )
                result = response.json()

                return {"status": "success", "recipe": recipe_name, "result": result}

            except Exception as e:
                logger.error(f"Error running recipe {recipe_name}: {e}")
                return {"status": "error", "message": str(e)}

        elif action_type == "notify_ui":
            message = action.get("message", "")
            # In a real implementation, this would send a notification to the UI
            # For now, we just log it
            logger.info(f"UI Notification: {message}")
            return {"status": "success", "message": message}

        return {"status": "unknown_action", "action_type": action_type}


# Global automation engine instance
_automation_engine = None


def get_automation_engine() -> AutomationEngine:
    """Get or create the global automation engine."""
    global _automation_engine
    if _automation_engine is None:
        _automation_engine = AutomationEngine()
    return _automation_engine


def start_automation_engine():
    """Start the automation engine."""
    engine = get_automation_engine()
    engine.start()


def stop_automation_engine():
    """Stop the automation engine."""
    engine = get_automation_engine()
    engine.stop()

"""Context builder for aggregating user data."""
import httpx
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from ..config import settings


class ContextBuilder:
    """Builds context packages from user data."""

    def __init__(self, api_url: str = None):
        self.api_url = api_url or settings.api_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def build_context(
        self,
        user_id: int,
        window_days: int = 7,
        include_modules: Optional[list] = None,
    ) -> Dict[str, Any]:
        """Build a context package for the agent.

        Args:
            user_id: User ID
            window_days: Number of days to include
            include_modules: List of modules to include (None = all)

        Returns:
            Dict with aggregated user data
        """
        now = datetime.utcnow()
        start = now - timedelta(days=window_days)

        all_modules = [
            "tasks", "events", "habits", "meals", "workouts", "sleep",
            "journal", "projects", "skills", "goals", "transactions",
            "contacts", "bible", "routines"
        ]

        modules = include_modules or all_modules

        context = {
            "user_id": user_id,
            "window_start": start.isoformat(),
            "window_end": now.isoformat(),
            "window_days": window_days,
        }

        # Tasks
        if "tasks" in modules:
            context["tasks"] = await self._get_json(
                f"/tasks?status=todo"
            ) + await self._get_json(f"/tasks?status=doing")

        # Events
        if "events" in modules:
            context["events"] = await self._get_json(
                f"/calendars/events?start={start.isoformat()}&end={now.isoformat()}"
            )

        # Habits
        if "habits" in modules:
            context["habits"] = await self._get_json("/habits?is_active=true")
            # Get habit logs for window
            habit_logs = {}
            for habit in context.get("habits", []):
                logs = await self._get_json(
                    f"/habits/{habit['id']}/logs?start={start.isoformat()}"
                )
                habit_logs[habit["id"]] = logs
            context["habit_logs"] = habit_logs

        # Meals
        if "meals" in modules:
            context["meals"] = await self._get_json(
                f"/meals?start={start.isoformat()}&end={now.isoformat()}"
            )
            # Calculate macro totals
            context["macro_totals"] = self._calculate_macros(context["meals"])

        # Workouts
        if "workouts" in modules:
            context["workouts"] = await self._get_json(
                f"/workouts?start={start.isoformat()}&end={now.isoformat()}"
            )

        # Sleep
        if "sleep" in modules:
            context["sleep"] = await self._get_json(
                f"/sleep?start={start.isoformat()}&end={now.isoformat()}"
            )

        # Journal
        if "journal" in modules:
            context["journal"] = await self._get_json(
                f"/journal?start={start.isoformat()}&end={now.isoformat()}"
            )

        # Projects
        if "projects" in modules:
            context["projects"] = await self._get_json("/projects?status=active")

        # Skills
        if "skills" in modules:
            context["skills"] = await self._get_json("/skills")

        # Goals
        if "goals" in modules:
            context["goals"] = await self._get_json("/goals?status=active")

        # Transactions
        if "transactions" in modules:
            context["transactions"] = await self._get_json(
                f"/finances/transactions?start={start.isoformat()}&end={now.isoformat()}"
            )

        # Contacts with upcoming birthdays
        if "contacts" in modules:
            all_contacts = await self._get_json("/contacts")
            upcoming_birthdays = []
            for contact in all_contacts:
                if contact.get("birthday"):
                    # Check if birthday is within next 30 days
                    bday = datetime.fromisoformat(contact["birthday"].replace("Z", "+00:00"))
                    # Adjust year to current year
                    this_year_bday = bday.replace(year=now.year)
                    if this_year_bday < now:
                        this_year_bday = bday.replace(year=now.year + 1)
                    days_until = (this_year_bday - now).days
                    if 0 <= days_until <= 30:
                        upcoming_birthdays.append({
                            "contact": contact,
                            "days_until": days_until,
                        })
            context["upcoming_birthdays"] = upcoming_birthdays

        # Bible
        if "bible" in modules:
            context["bible_plans"] = await self._get_json("/bible/plans")
            context["recent_readings"] = await self._get_json(
                f"/bible/readings?start={start.isoformat()}"
            )

        # Routines
        if "routines" in modules:
            context["routines"] = await self._get_json("/routines")

        return context

    async def _get_json(self, endpoint: str) -> Any:
        """Fetch JSON from API endpoint."""
        try:
            response = await self.client.get(f"{self.api_url}{endpoint}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return []

    def _calculate_macros(self, meals: list) -> Dict[str, int]:
        """Calculate total macros from meals."""
        totals = {
            "calories": 0,
            "protein_g": 0,
            "carbs_g": 0,
            "fat_g": 0,
        }

        for meal in meals:
            totals["calories"] += meal.get("calories", 0)
            totals["protein_g"] += meal.get("protein_g", 0)
            totals["carbs_g"] += meal.get("carbs_g", 0)
            totals["fat_g"] += meal.get("fat_g", 0)

        return totals

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

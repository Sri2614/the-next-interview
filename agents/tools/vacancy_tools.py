"""Tools for loading and working with job vacancy data.

fetch_live_vacancies() is the primary tool — it calls the JSearch API
(RapidAPI) to return TODAY's real job listings from LinkedIn, Indeed,
Glassdoor, and ZipRecruiter.

Falls back to 23 local mock vacancies when:
  - RAPIDAPI_KEY env var is not set (demo mode)
  - The API returns 0 results for the given role
  - Any network / API error occurs
"""

import json
import os
import pathlib
import urllib.parse
import urllib.request
from typing import Any

from google.adk.tools import ToolContext

DATA_DIR = pathlib.Path(__file__).parent.parent.parent / "data"
VACANCIES_DIR = DATA_DIR / "vacancies"


# ── Public tool ──────────────────────────────────────────────────────────────

def fetch_live_vacancies(tool_context: ToolContext) -> list[dict[str, Any]]:
    """Fetch real-time job vacancies from JSearch (LinkedIn/Indeed/Glassdoor).

    Reads search_role and search_location from ADK session state.
    Uses RAPIDAPI_KEY env var to call the JSearch API.
    Falls back to local mock vacancies if the key is absent or the call fails.

    Returns:
        List of vacancy dicts ready for the vacancy_matcher to score.
    """
    api_key: str = os.environ.get("RAPIDAPI_KEY", "")
    role: str = tool_context.state.get("search_role", "software engineer")
    location: str = tool_context.state.get("search_location", "remote")

    if not api_key:
        # Demo / local mode — no API key configured
        return _load_all_vacancies()

    try:
        query = urllib.parse.quote(f"{role} {location}")
        url = (
            "https://jsearch.p.rapidapi.com/search"
            f"?query={query}&page=1&num_pages=1&date_posted=today&num_results=20"
        )
        req = urllib.request.Request(
            url,
            headers={
                "X-RapidAPI-Key": api_key,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        jobs: list[dict] = data.get("data", [])
        if not jobs:
            return _load_all_vacancies()  # no results for this role today

        return [_normalise_jsearch_job(j) for j in jobs[:20]]

    except Exception:
        # Any error (timeout, bad JSON, API limit) → fallback
        return _load_all_vacancies()


# ── Private helpers ───────────────────────────────────────────────────────────

def _normalise_jsearch_job(j: dict[str, Any]) -> dict[str, Any]:
    """Map a JSearch job object to our Vacancy-like format.

    Descriptions are truncated to 500 chars to stay within Gemini token limits.
    """
    skills: list[str] = j.get("job_required_skills") or []
    city: str = j.get("job_city") or ""
    country: str = j.get("job_country") or ""
    location_str = ", ".join(filter(None, [city, country]))

    return {
        "id":          (j.get("job_id") or "")[:30],
        "title":       j.get("job_title") or "",
        "company":     j.get("employer_name") or "",
        "industry":    j.get("job_industry") or "Technology",
        "location":    location_str,
        "type":        j.get("job_employment_type") or "FULLTIME",
        "description": (j.get("job_description") or "")[:500],
        "requirements": {
            "mustHave":        skills,
            "niceToHave":      [],
            "yearsExperience": 0,
        },
        "techStack":   skills,
        "postedDate":  j.get("job_posted_at_datetime_utc") or "",
        "applyLink":   j.get("job_apply_link") or "",
    }


def _load_all_vacancies() -> list[dict[str, Any]]:
    """Load the 23 mock vacancies from disk. Used as fallback."""
    vacancies = []
    for vacancy_file in sorted(VACANCIES_DIR.glob("*.json")):
        vacancies.append(json.loads(vacancy_file.read_text()))
    return vacancies


def load_vacancy(vacancy_id: str) -> dict[str, Any]:
    """Load a specific job vacancy by its ID.

    Args:
        vacancy_id: The vacancy identifier (e.g., 'senior-java-fintech')

    Returns:
        Vacancy data as a dictionary, or error dict if not found.
    """
    vacancy_path = VACANCIES_DIR / f"{vacancy_id}.json"
    if not vacancy_path.exists():
        available = [f.stem for f in VACANCIES_DIR.glob("*.json")]
        return {
            "error": f"Vacancy '{vacancy_id}' not found.",
            "available_vacancies": available,
        }
    return json.loads(vacancy_path.read_text())

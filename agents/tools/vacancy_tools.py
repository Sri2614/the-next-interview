"""Tools for loading and working with job vacancy data.

fetch_live_vacancies() calls the JSearch API (RapidAPI) to return real job
listings from LinkedIn, Indeed, Glassdoor, and ZipRecruiter.

If the specific role+location search returns 0 results, the query is broadened
progressively (remove location → first keyword only) before giving up.
No mock fallback — always live data or a clear failure.
"""

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from google.adk.tools import ToolContext

logger = logging.getLogger(__name__)


# ── Public tool ──────────────────────────────────────────────────────────────

def fetch_live_vacancies(tool_context: ToolContext) -> list[dict[str, Any]]:
    """Fetch real-time job vacancies from JSearch (LinkedIn/Indeed/Glassdoor).

    Reads search_role and search_location from ADK session state.
    Tries up to three progressively broader queries before returning empty list.

    Returns:
        List of vacancy dicts ready for the vacancy_matcher to score.
    """
    api_key: str = os.environ.get("RAPIDAPI_KEY", "")
    role: str = tool_context.state.get("search_role", "software engineer")
    location: str = tool_context.state.get("search_location", "remote")

    if not api_key:
        raise ValueError("RAPIDAPI_KEY is not configured on this server.")

    # Progressive broadening: specific → role only → first keyword globally
    first_keyword = role.split()[0].lower()
    queries = [
        f"{role} {location}",
        role,
        f"{first_keyword} engineer",
    ]

    for query in queries:
        jobs = _call_jsearch(api_key, query)
        if jobs:
            logger.info("JSearch returned %d jobs for query: %s", len(jobs), query)
            return [_normalise_jsearch_job(j) for j in jobs[:20]]

    logger.warning("JSearch returned 0 results for all queries (role=%s, location=%s)", role, location)
    return []


# ── Private helpers ───────────────────────────────────────────────────────────

def _call_jsearch(api_key: str, query: str) -> list[dict]:
    """Make one JSearch API call. Returns raw job list or [] on any error."""
    try:
        encoded = urllib.parse.quote(query)
        url = (
            "https://jsearch.p.rapidapi.com/search"
            f"?query={encoded}&page=1&num_pages=1&num_results=20"
        )
        req = urllib.request.Request(
            url,
            headers={
                "X-RapidAPI-Key": api_key,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            },
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode())
        return data.get("data", [])
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, TimeoutError, OSError) as exc:
        logger.warning("JSearch query '%s' failed: %s: %s", query, type(exc).__name__, exc)
        return []


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

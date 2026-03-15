"""Tools for loading and working with job vacancy data.

fetch_live_vacancies() calls the JSearch API (RapidAPI) to return real job
listings from LinkedIn, Indeed, Glassdoor, and ZipRecruiter.

Strategy:
- For Europe: query multiple EU tech hubs + filter out US-only jobs
- For Remote: single remote query
- For other regions: location-specific + remote queries
- Merge, deduplicate, and return up to 20 jobs
No mock fallback — always live data or a clear failure.
"""

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from google.adk.tools import ToolContext

logger = logging.getLogger(__name__)

# Countries considered part of the European job market
_EU_COUNTRIES = {
    "GB", "DE", "NL", "FR", "SE", "PL", "ES", "IT", "BE", "CH",
    "AT", "DK", "NO", "FI", "IE", "PT", "CZ", "HU", "RO", "LT",
    "LV", "EE", "SK", "HR", "BG", "SI", "LU", "MT", "CY", "GR",
}

# Countries that are NOT Europe (used to exclude non-remote US/CA/AU jobs)
_NON_EU_COUNTRIES = {"US", "CA", "AU", "IN", "MX", "BR", "SG", "PH"}


# ── Public tool ──────────────────────────────────────────────────────────────

def fetch_live_vacancies(tool_context: ToolContext) -> list[dict[str, Any]]:
    """Fetch real-time job vacancies from JSearch (LinkedIn/Indeed/Glassdoor).

    Reads search_role and search_location from ADK session state.
    Uses location-aware query strategy and filters out irrelevant regional jobs.

    Returns:
        List of vacancy dicts ready for the vacancy_matcher to score.
    """
    api_key: str = os.environ.get("RAPIDAPI_KEY", "")
    role: str = tool_context.state.get("search_role", "software engineer")
    location: str = tool_context.state.get("search_location", "remote")

    if not api_key:
        raise ValueError("RAPIDAPI_KEY is not configured on this server.")

    # Build queries based on location
    queries = _build_queries(role, location)
    logger.info("fetch_live_vacancies: role='%s' location='%s' queries=%s", role, location, queries)

    # Phase 1: run all queries in parallel
    combined: list[dict] = _run_parallel_queries(api_key, queries)

    # Phase 2: filter by location relevance
    filtered = [j for j in combined if _is_relevant_for_location(j, location)]
    logger.info("After location filter: %d / %d jobs kept", len(filtered), len(combined))

    # Phase 3: broaden if too few after filtering
    if len(filtered) < 5:
        logger.info("Too few after filter — broadening with role-only query")
        extra = _call_jsearch(api_key, role)
        extra_filtered = [j for j in extra if _is_relevant_for_location(j, location)]
        filtered = _merge_jobs(filtered, extra_filtered)

    if len(filtered) < 5:
        # Last resort: drop location filter entirely
        logger.info("Still too few — dropping location filter, returning all")
        filtered = combined
        if len(filtered) < 5:
            extra = _call_jsearch(api_key, role)
            filtered = _merge_jobs(filtered, extra)

    logger.info(
        "fetch_live_vacancies returning %d jobs for role='%s' location='%s'",
        len(filtered), role, location,
    )
    return [_normalise_jsearch_job(j) for j in filtered[:20]]


# ── Query building ────────────────────────────────────────────────────────────

def _build_queries(role: str, location: str) -> list[str]:
    """Return 2-3 JSearch queries optimised for the requested location."""
    loc = location.lower().strip()

    if loc in ("remote (worldwide)", "remote", "", "worldwide"):
        return [f"{role} remote"]

    if loc == "europe":
        # Target the biggest EU tech hubs — JSearch is US-centric so we cast wide
        return [
            f"{role} Netherlands",
            f"{role} Germany",
            f"{role} remote Europe",
        ]

    if loc in ("united kingdom", "uk"):
        return [f"{role} United Kingdom", f"{role} London remote"]

    if loc in ("united states", "us", "usa"):
        return [f"{role} United States", f"{role} remote USA"]

    if loc == "india":
        return [f"{role} India", f"{role} Bangalore remote"]

    if loc == "canada":
        return [f"{role} Canada", f"{role} Toronto remote"]

    if loc == "apac":
        return [f"{role} Singapore", f"{role} Australia remote"]

    if loc in ("middle east", "gulf"):
        return [f"{role} Dubai", f"{role} Middle East"]

    if loc in ("latin america", "latam"):
        return [f"{role} Latin America remote", f"{role} Brazil remote"]

    # Generic fallback: location as-is + remote
    return [f"{role} {location}", f"{role} remote"]


# ── Location relevance filter ─────────────────────────────────────────────────

def _is_relevant_for_location(job: dict, location: str) -> bool:
    """Return True if the job is relevant for the requested location.

    Remote jobs are always relevant. For region-specific searches we exclude
    jobs clearly tied to a different region (e.g. "Senior DevOps - USA Only"
    when user wants Europe).
    """
    loc = location.lower().strip()

    # Remote worldwide — accept everything
    if loc in ("remote (worldwide)", "remote", "", "worldwide"):
        return True

    is_remote: bool = bool(job.get("job_is_remote", False))
    job_country: str = (job.get("job_country") or "").upper()
    job_title: str = (job.get("job_title") or "").lower()

    # Always keep fully remote jobs — they're accessible from anywhere
    if is_remote:
        # But exclude remote jobs that explicitly state US-only in their title
        us_only_phrases = [" - usa", " - us", "usa only", "us only", "united states only", "- united states"]
        if any(p in job_title for p in us_only_phrases):
            return False
        return True

    if loc == "europe":
        # Keep EU-country jobs
        if job_country in _EU_COUNTRIES:
            return True
        # Exclude jobs from clearly non-EU countries (US, CA, AU, IN)
        if job_country in _NON_EU_COUNTRIES:
            return False
        # Unknown country — include (benefit of the doubt)
        return True

    if loc in ("united kingdom", "uk"):
        return job_country in ("GB", "IE") or job_country == ""

    if loc in ("united states", "us", "usa"):
        return job_country == "US" or job_country == ""

    if loc == "india":
        return job_country == "IN" or job_country == ""

    if loc == "canada":
        return job_country == "CA" or job_country == ""

    # For other locations: accept all (imperfect but avoids empty results)
    return True


# ── Private helpers ───────────────────────────────────────────────────────────

def _run_parallel_queries(api_key: str, queries: list[str]) -> list[dict]:
    """Run multiple JSearch queries concurrently and merge deduplicated results."""
    if len(queries) == 1:
        return _call_jsearch(api_key, queries[0])

    results: list[list[dict]] = [[] for _ in queries]
    with ThreadPoolExecutor(max_workers=len(queries)) as pool:
        futures = {pool.submit(_call_jsearch, api_key, q): i for i, q in enumerate(queries)}
        for future in as_completed(futures):
            idx = futures[future]
            try:
                results[idx] = future.result()
            except Exception as exc:  # noqa: BLE001
                logger.warning("Parallel JSearch query %d failed: %s", idx, exc)

    combined: list[dict] = []
    for batch in results:
        combined = _merge_jobs(combined, batch)
    return combined


def _merge_jobs(existing: list[dict], new_jobs: list[dict]) -> list[dict]:
    """Append new_jobs to existing, deduplicating by job_id."""
    seen_ids: set[str] = {j.get("job_id", "") for j in existing}
    merged = list(existing)
    for job in new_jobs:
        jid = job.get("job_id", "")
        if jid not in seen_ids:
            seen_ids.add(jid)
            merged.append(job)
    return merged


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
    is_remote: bool = bool(j.get("job_is_remote", False))

    if is_remote and not city:
        location_str = "Remote"
    else:
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
        "isRemote":    is_remote,
    }

"""Tools for loading and working with job vacancy data.

fetch_live_vacancies() calls the JSearch API (RapidAPI) to return real job
listings from LinkedIn, Indeed, Glassdoor, and ZipRecruiter.

Strategy: run TWO queries in parallel threads ({role} {location} AND {role} remote),
merge and deduplicate results, return up to 20 jobs.  If combined results are still
fewer than 5, broaden further (role-only, then first-keyword).
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


# ── Public tool ──────────────────────────────────────────────────────────────

def fetch_live_vacancies(tool_context: ToolContext) -> list[dict[str, Any]]:
    """Fetch real-time job vacancies from JSearch (LinkedIn/Indeed/Glassdoor).

    Reads search_role and search_location from ADK session state.
    Runs two parallel queries ({role} {location} + {role} remote) and merges
    results to maximise job count before broadening further.

    Returns:
        List of vacancy dicts ready for the vacancy_matcher to score.
    """
    api_key: str = os.environ.get("RAPIDAPI_KEY", "")
    role: str = tool_context.state.get("search_role", "software engineer")
    location: str = tool_context.state.get("search_location", "remote")

    if not api_key:
        raise ValueError("RAPIDAPI_KEY is not configured on this server.")

    location_lower = location.lower()

    # Phase 1: dual parallel queries — location-specific + remote
    # (skip remote query when user already selected remote to avoid duplicate API call)
    primary_query = f"{role} {location}"
    if "remote" in location_lower or location_lower in ("", "worldwide", "remote (worldwide)"):
        phase1_queries = [primary_query]
    else:
        phase1_queries = [primary_query, f"{role} remote"]

    combined: list[dict] = _run_parallel_queries(api_key, phase1_queries)

    # Phase 2: broaden if still too few results
    if len(combined) < 5:
        logger.info("Phase 1 returned %d jobs — broadening to role-only query", len(combined))
        extra = _call_jsearch(api_key, role)
        combined = _merge_jobs(combined, extra)

    if len(combined) < 5:
        first_keyword = role.split()[0].lower()
        broad_query = f"{first_keyword} engineer"
        logger.info("Still %d jobs — broadening to '%s'", len(combined), broad_query)
        extra = _call_jsearch(api_key, broad_query)
        combined = _merge_jobs(combined, extra)

    logger.info(
        "fetch_live_vacancies returning %d jobs for role='%s' location='%s'",
        len(combined), role, location,
    )
    return [_normalise_jsearch_job(j) for j in combined[:20]]


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

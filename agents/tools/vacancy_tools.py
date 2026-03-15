"""Tools for loading and working with job vacancy data.

fetch_live_vacancies() calls TWO APIs in parallel:
  1. JSearch (RapidAPI)  — LinkedIn/Indeed/Glassdoor/ZipRecruiter, global
  2. Adzuna              — dedicated European job boards (NL, DE, GB, FR, PL…)

Strategy:
- Run JSearch + Adzuna queries concurrently
- Merge and deduplicate all results
- Filter out jobs that don't match the requested region
- Return up to 25 jobs
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

from tools.salary_tools import enrich_salaries_from_levelsfyi

logger = logging.getLogger(__name__)

# Adzuna country codes for each region
_ADZUNA_EU_COUNTRIES = ["nl", "de", "gb", "fr", "pl", "at", "be", "ch", "se", "ie"]
_ADZUNA_COUNTRY_MAP = {
    "europe":         ["nl", "de", "gb", "fr", "pl"],
    "united kingdom": ["gb"],
    "uk":             ["gb"],
    "india":          ["in"],
    "canada":         ["ca"],
    "australia":      ["au"],
    "united states":  ["us"],
    "us":             ["us"],
    "usa":            ["us"],
}

# EU country codes (ISO 3166-1 alpha-2) — used to filter JSearch results
_EU_COUNTRIES = {
    "GB", "DE", "NL", "FR", "SE", "PL", "ES", "IT", "BE", "CH",
    "AT", "DK", "NO", "FI", "IE", "PT", "CZ", "HU", "RO", "LT",
    "LV", "EE", "SK", "HR", "BG", "SI", "LU", "MT", "CY", "GR",
}
_NON_EU_COUNTRIES = {"US", "CA", "AU", "IN", "MX", "BR", "SG", "PH"}


# ── Salary formatting ────────────────────────────────────────────────────────

# Currency symbols by ISO code. Extend as needed.
_CURRENCY_SYMBOLS: dict[str, str] = {
    "USD": "$", "GBP": "£", "EUR": "€", "CAD": "CA$",
    "AUD": "A$", "INR": "₹", "CHF": "CHF", "SEK": "SEK",
    "PLN": "PLN", "CZK": "CZK",
}


def _format_salary(
    min_val: float | None,
    max_val: float | None,
    currency: str = "USD",
    period: str = "YEAR",
) -> str:
    """Format a salary range as a human-readable string.

    Returns "" if both min and max are None/0.
    Examples: "$120K-$160K/yr", "£45K-£55K/yr", "From $120K/yr"
    """
    # Return empty if both are None/zero
    if (min_val is None or min_val == 0) and (max_val is None or max_val == 0):
        return ""
    # Clamp negative sentinel values (e.g. -1 from JSearch) to None
    if min_val is not None and min_val < 0:
        min_val = None
    if max_val is not None and max_val < 0:
        max_val = None
    # After clamping, check again if both are empty
    if min_val is None and max_val is None:
        return ""

    sym = _CURRENCY_SYMBOLS.get(currency.upper(), currency.upper() + " ")
    suffix = "/yr" if period.upper() in ("YEAR", "YEARLY", "ANNUAL", "") else f"/{period.lower()}"

    def _fmt(v: float) -> str:
        if v >= 1000:
            return f"{sym}{v / 1000:.0f}K"
        return f"{sym}{v:.0f}"

    if min_val is not None and max_val is not None:
        return f"{_fmt(min_val)}-{_fmt(max_val)}{suffix}"
    if min_val is not None:
        return f"From {_fmt(min_val)}{suffix}"
    return f"Up to {_fmt(max_val)}{suffix}"


# ── Public tool ──────────────────────────────────────────────────────────────

def fetch_live_vacancies(tool_context: ToolContext) -> list[dict[str, Any]]:
    """Fetch real-time job vacancies from JSearch + Adzuna in parallel.

    Reads search_role and search_location from ADK session state.
    Returns merged, deduplicated, location-filtered results.
    """
    jsearch_key: str = os.environ.get("RAPIDAPI_KEY", "")
    adzuna_app_id: str = os.environ.get("ADZUNA_APP_ID", "")
    adzuna_app_key: str = os.environ.get("ADZUNA_APP_KEY", "")
    role: str = tool_context.state.get("search_role", "software engineer")
    location: str = tool_context.state.get("search_location", "remote")

    if not jsearch_key:
        raise ValueError("RAPIDAPI_KEY is not configured on this server.")

    loc = location.lower().strip()

    # ── Run JSearch + Adzuna concurrently ────────────────────────────────────
    jsearch_queries = _build_jsearch_queries(role, location)
    adzuna_countries = _ADZUNA_COUNTRY_MAP.get(loc, [])

    all_jobs: list[dict] = []

    with ThreadPoolExecutor(max_workers=6) as pool:
        futures: dict = {}

        # JSearch futures
        for q in jsearch_queries:
            f = pool.submit(_call_jsearch, jsearch_key, q)
            futures[f] = ("jsearch", q)

        # Adzuna futures (only when we have credentials + relevant countries)
        if adzuna_app_id and adzuna_app_key and adzuna_countries:
            for country in adzuna_countries[:3]:  # max 3 countries to stay fast
                f = pool.submit(_call_adzuna, adzuna_app_id, adzuna_app_key, country, role)
                futures[f] = ("adzuna", country)

        for future in as_completed(futures):
            source, tag = futures[future]
            try:
                jobs = future.result()
                logger.info("%s[%s] returned %d jobs", source, tag, len(jobs))
                all_jobs = _merge_jobs(all_jobs, jobs)
            except Exception as exc:  # noqa: BLE001
                logger.warning("%s[%s] failed: %s", source, tag, exc)

    logger.info("Combined before filter: %d jobs", len(all_jobs))

    # ── Filter by location relevance ─────────────────────────────────────────
    filtered = [j for j in all_jobs if _is_relevant_for_location(j, location)]
    logger.info("After location filter: %d / %d jobs kept", len(filtered), len(all_jobs))

    # ── Broaden if too few ────────────────────────────────────────────────────
    if len(filtered) < 5:
        logger.info("Too few — broadening with role-only query")
        extra = _call_jsearch(jsearch_key, role)
        extra_f = [j for j in extra if _is_relevant_for_location(j, location)]
        filtered = _merge_jobs(filtered, extra_f)

    if len(filtered) < 5:
        logger.info("Still too few — dropping location filter")
        filtered = all_jobs
        if len(filtered) < 5:
            filtered = _merge_jobs(filtered, _call_jsearch(jsearch_key, role))

    logger.info("fetch_live_vacancies returning %d jobs", len(filtered))
    normalised = [_normalise_job(j) for j in filtered[:25]]
    normalised = enrich_salaries_from_levelsfyi(normalised)
    return normalised


# ── JSearch ───────────────────────────────────────────────────────────────────

def _build_jsearch_queries(role: str, location: str) -> list[str]:
    loc = location.lower().strip()

    if loc in ("remote (worldwide)", "remote", "", "worldwide"):
        return [f"{role} remote"]

    if loc == "europe":
        return [f"{role} Netherlands", f"{role} Germany", f"{role} remote Europe"]

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

    return [f"{role} {location}", f"{role} remote"]


def _call_jsearch(api_key: str, query: str) -> list[dict]:
    """Make one JSearch API call. Returns raw job list or [] on error."""
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
        jobs = data.get("data", [])
        # Tag source for normalisation
        for j in jobs:
            j["_source"] = "jsearch"
        return jobs
    except Exception as exc:  # noqa: BLE001
        logger.warning("JSearch '%s' failed: %s", query, exc)
        return []


# ── Adzuna ────────────────────────────────────────────────────────────────────

def _call_adzuna(app_id: str, app_key: str, country: str, role: str) -> list[dict]:
    """Call Adzuna jobs API for a specific country. Returns normalised-ready list."""
    try:
        encoded = urllib.parse.quote(role)
        url = (
            f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
            f"?app_id={app_id}&app_key={app_key}"
            f"&results_per_page=20&what={encoded}&content-type=application/json"
        )
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode())
        results = data.get("results", [])
        # Tag source + country for normalisation
        for j in results:
            j["_source"] = "adzuna"
            j["_country"] = country.upper()
        return results
    except Exception as exc:  # noqa: BLE001
        logger.warning("Adzuna[%s] '%s' failed: %s", country, role, exc)
        return []


# ── Location filter ───────────────────────────────────────────────────────────

def _is_relevant_for_location(job: dict, location: str) -> bool:
    loc = location.lower().strip()

    if loc in ("remote (worldwide)", "remote", "", "worldwide"):
        return True

    source = job.get("_source", "jsearch")

    # Adzuna jobs are already country-specific — always relevant
    if source == "adzuna":
        return True

    # JSearch jobs — check country + remote flag
    is_remote: bool = bool(job.get("job_is_remote", False))
    job_country: str = (job.get("job_country") or "").upper()
    job_title: str = (job.get("job_title") or "").lower()

    if is_remote:
        us_only = [" - usa", " - us", "usa only", "us only", "united states only", "- united states"]
        if any(p in job_title for p in us_only):
            return False
        return True

    if loc == "europe":
        if job_country in _EU_COUNTRIES:
            return True
        if job_country in _NON_EU_COUNTRIES:
            return False
        return True  # unknown — include

    if loc in ("united kingdom", "uk"):
        return job_country in ("GB", "IE") or job_country == ""

    if loc in ("united states", "us", "usa"):
        return job_country == "US" or job_country == ""

    if loc == "india":
        return job_country == "IN" or job_country == ""

    if loc == "canada":
        return job_country == "CA" or job_country == ""

    return True


# ── Normalisation ─────────────────────────────────────────────────────────────

def _normalise_job(j: dict[str, Any]) -> dict[str, Any]:
    source = j.get("_source", "jsearch")
    if source == "adzuna":
        return _normalise_adzuna_job(j)
    return _normalise_jsearch_job(j)


def _normalise_jsearch_job(j: dict[str, Any]) -> dict[str, Any]:
    skills: list[str] = j.get("job_required_skills") or []
    city: str = j.get("job_city") or ""
    country: str = j.get("job_country") or ""
    is_remote: bool = bool(j.get("job_is_remote", False))
    location_str = "Remote" if (is_remote and not city) else ", ".join(filter(None, [city, country]))

    # Salary extraction
    salary_min = j.get("job_min_salary")
    salary_max = j.get("job_max_salary")
    salary_currency = j.get("job_salary_currency") or "USD"
    salary_period = j.get("job_salary_period") or "YEAR"
    salary_str = _format_salary(
        float(salary_min) if salary_min else None,
        float(salary_max) if salary_max else None,
        salary_currency,
        salary_period,
    )

    return {
        "id":          (j.get("job_id") or "")[:40],
        "title":       j.get("job_title") or "",
        "company":     j.get("employer_name") or "",
        "industry":    j.get("job_industry") or "Technology",
        "location":    location_str,
        "salaryRange": salary_str,
        "type":        j.get("job_employment_type") or "FULLTIME",
        "description": (j.get("job_description") or "")[:500],
        "requirements": {"mustHave": skills, "niceToHave": [], "yearsExperience": 0},
        "techStack":   skills,
        "postedDate":  j.get("job_posted_at_datetime_utc") or "",
        "applyLink":   j.get("job_apply_link") or "",
        "isRemote":    is_remote,
        "source":      "jsearch",
    }


def _normalise_adzuna_job(j: dict[str, Any]) -> dict[str, Any]:
    country_code = j.get("_country", "")
    location_obj = j.get("location", {})
    location_parts = location_obj.get("display_name", "") if isinstance(location_obj, dict) else ""
    company_obj = j.get("company", {})
    company_name = company_obj.get("display_name", "") if isinstance(company_obj, dict) else ""
    category_obj = j.get("category", {})
    industry = category_obj.get("label", "Technology") if isinstance(category_obj, dict) else "Technology"

    # Build unique ID from Adzuna's id field
    job_id = str(j.get("id", ""))

    # Salary extraction — skip Adzuna's predicted/estimated salaries
    is_predicted = str(j.get("salary_is_predicted", "0")) == "1"
    salary_str = ""
    if not is_predicted:
        salary_min = j.get("salary_min")
        salary_max = j.get("salary_max")
        # Adzuna salaries are in local currency; map country to currency
        currency_map = {
            "GB": "GBP", "DE": "EUR", "NL": "EUR", "FR": "EUR",
            "PL": "PLN", "AT": "EUR", "BE": "EUR", "CH": "CHF",
            "SE": "SEK", "IE": "EUR", "US": "USD", "CA": "CAD",
            "AU": "AUD", "IN": "INR",
        }
        currency = currency_map.get(country_code, "EUR")
        salary_str = _format_salary(
            float(salary_min) if salary_min else None,
            float(salary_max) if salary_max else None,
            currency,
            "YEAR",
        )

    return {
        "id":          f"adzuna-{job_id}"[:40],
        "title":       j.get("title") or "",
        "company":     company_name,
        "industry":    industry,
        "location":    location_parts or country_code,
        "salaryRange": salary_str,
        "type":        "FULLTIME",
        "description": (j.get("description") or "")[:500],
        "requirements": {"mustHave": [], "niceToHave": [], "yearsExperience": 0},
        "techStack":   [],
        "postedDate":  j.get("created") or "",
        "applyLink":   j.get("redirect_url") or "",
        "isRemote":    False,
        "source":      "adzuna",
    }


# ── Merge helper ──────────────────────────────────────────────────────────────

def _merge_jobs(existing: list[dict], new_jobs: list[dict]) -> list[dict]:
    seen_ids: set[str] = {j.get("job_id", j.get("id", "")) for j in existing}
    merged = list(existing)
    for job in new_jobs:
        jid = job.get("job_id", job.get("id", ""))
        if jid and jid not in seen_ids:
            seen_ids.add(jid)
            merged.append(job)
    return merged

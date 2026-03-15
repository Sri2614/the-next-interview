"""Levels.fyi salary enrichment for jobs missing posted salary data.

Best-effort: fetches company+role compensation from the free
/companies/{slug}/salaries.md endpoint. If the company or role is not
found, the job's salaryRange is left empty.
"""

import logging
import re
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Semaphore
from typing import Any

logger = logging.getLogger(__name__)

# ── Company slug normalization ────────────────────────────────────────────────

_STRIP_SUFFIXES = re.compile(
    r",?\s*\b(Inc\.?|LLC|Ltd\.?|Corp\.?|Corporation|Platforms|\.com|Group|Holdings|Technologies|SE|AG|GmbH|PLC|Co\.?)\b\.?",
    re.IGNORECASE,
)


def _company_to_slug(name: str) -> str:
    """Normalize a company name to a Levels.fyi URL slug.

    'Google LLC' -> 'google', 'Meta Platforms, Inc.' -> 'meta'
    """
    slug = _STRIP_SUFFIXES.sub("", name).strip()
    slug = slug.lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)   # drop special chars
    slug = re.sub(r"\s+", "-", slug).strip("-")  # spaces to hyphens
    return slug


# ── Job title to Levels.fyi job family mapping ────────────────────────────────

_TITLE_TO_FAMILY: list[tuple[list[str], str]] = [
    (["software", "backend", "frontend", "full stack", "full-stack",
      "fullstack", "platform", "devops", "sre", "site reliability",
      "infrastructure", "systems"], "Software Engineering"),
    (["engineering manager", "eng manager"], "Software Engineering Manager"),
    (["data scientist"], "Data Science"),
    (["data engineer", "data platform", "analytics engineer"], "Data Engineering"),
    (["product manager"], "Product Management"),
    (["product designer", "ux designer", "ui designer"], "Product Design"),
    (["machine learning", "ml engineer", "ai engineer"], "Machine Learning Engineering"),
    (["security engineer", "appsec", "infosec"], "Security Engineering"),
    (["mobile", "android", "ios"], "Software Engineering"),
    (["qa", "test engineer", "sdet", "quality"], "Software Engineering"),
    (["cloud", "solutions architect"], "Solutions Architect"),
]


def _match_job_family(title: str) -> str | None:
    """Map a job title to a Levels.fyi job family name. Returns None if no match."""
    t = title.lower()
    for keywords, family in _TITLE_TO_FAMILY:
        if any(kw in t for kw in keywords):
            return family
    return None


# ── Levels.fyi markdown parsing ───────────────────────────────────────────────

def _parse_salary_from_md(md_text: str, job_family: str) -> str | None:
    """Extract median total comp for a job family from the Levels.fyi .md table.

    The table has columns like: | Rank | Job Family | Median Total Comp | ...
    Returns formatted string like '~$328K/yr USD (Levels.fyi)' or None.
    """
    for line in md_text.splitlines():
        if "|" not in line:
            continue
        cells = [c.strip() for c in line.split("|")]
        # Match job family column (case-insensitive)
        if any(job_family.lower() == c.lower() for c in cells):
            # Find the cell that looks like a dollar amount
            for cell in cells:
                match = re.search(r"\$[\d,]+", cell)
                if match:
                    raw = match.group().replace(",", "").replace("$", "")
                    try:
                        val = int(raw)
                        return f"~${val // 1000}K/yr USD (Levels.fyi)"
                    except ValueError:
                        continue
    return None


# ── Fetching ──────────────────────────────────────────────────────────────────

_RATE_LIMIT = Semaphore(4)  # max 4 concurrent requests


def _fetch_levelsfyi_md(slug: str) -> str | None:
    """Fetch /companies/{slug}/salaries.md. Returns markdown text or None."""
    url = f"https://www.levels.fyi/companies/{slug}/salaries.md"
    _RATE_LIMIT.acquire()
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "TheNextInterview/1.0 (salary enrichment)"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                return resp.read().decode("utf-8", errors="replace")
        return None
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as exc:
        logger.debug("Levels.fyi fetch failed for '%s': %s", slug, exc)
        return None
    finally:
        _RATE_LIMIT.release()


# ── Public API ────────────────────────────────────────────────────────────────

def enrich_salaries_from_levelsfyi(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Enrich jobs missing salaryRange with Levels.fyi compensation data.

    Modifies jobs in place and returns the same list.
    Best-effort: jobs without a match are left unchanged.
    """
    # Identify jobs needing enrichment and deduplicate by slug
    slug_map: dict[str, str] = {}  # slug -> company name (for logging)
    job_indices_by_slug: dict[str, list[int]] = {}

    for i, job in enumerate(jobs):
        if job.get("salaryRange"):
            continue  # already has salary from posting
        company = job.get("company", "")
        if not company:
            continue
        slug = _company_to_slug(company)
        if not slug:
            continue
        slug_map[slug] = company
        job_indices_by_slug.setdefault(slug, []).append(i)

    if not slug_map:
        return jobs

    logger.info("Levels.fyi enrichment: fetching %d unique companies", len(slug_map))

    # Fetch all unique slugs in parallel
    slug_to_md: dict[str, str | None] = {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(_fetch_levelsfyi_md, slug): slug for slug in slug_map}
        for future in as_completed(futures):
            slug = futures[future]
            try:
                slug_to_md[slug] = future.result()
            except Exception:  # noqa: BLE001
                slug_to_md[slug] = None

    # Parse and apply salary data
    enriched_count = 0
    for slug, md_text in slug_to_md.items():
        if not md_text:
            continue
        for idx in job_indices_by_slug.get(slug, []):
            title = jobs[idx].get("title", "")
            family = _match_job_family(title)
            if not family:
                continue
            salary = _parse_salary_from_md(md_text, family)
            if salary:
                jobs[idx]["salaryRange"] = salary
                enriched_count += 1

    logger.info(
        "Levels.fyi enrichment: enriched %d / %d jobs needing enrichment",
        enriched_count,
        sum(len(v) for v in job_indices_by_slug.values()),
    )
    return jobs

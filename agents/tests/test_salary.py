"""Tests for salary formatting, slug normalization, job family matching,
normalizer salary extraction, and the enrichment public function."""

from unittest.mock import patch
import pytest
from tools.vacancy_tools import _format_salary, _normalise_jsearch_job, _normalise_adzuna_job
from tools.salary_tools import (
    _company_to_slug, _match_job_family, _parse_salary_from_md,
    enrich_salaries_from_levelsfyi,
)


# ── _format_salary ────────────────────────────────────────────────────────────

class TestFormatSalary:
    def test_both_bounds_usd(self):
        assert _format_salary(120000, 160000, "USD", "YEAR") == "$120K-$160K/yr"

    def test_both_bounds_gbp(self):
        assert _format_salary(45000, 55000, "GBP", "YEAR") == "\u00a345K-\u00a355K/yr"

    def test_both_bounds_eur(self):
        assert _format_salary(50000, 70000, "EUR", "YEAR") == "\u20ac50K-\u20ac70K/yr"

    def test_min_only(self):
        assert _format_salary(120000, None, "USD", "YEAR") == "From $120K/yr"

    def test_max_only(self):
        assert _format_salary(None, 160000, "USD", "YEAR") == "Up to $160K/yr"

    def test_both_none(self):
        assert _format_salary(None, None) == ""

    def test_both_zero(self):
        assert _format_salary(0, 0) == ""

    def test_small_values(self):
        assert _format_salary(500, 800, "USD", "YEAR") == "$500-$800/yr"

    def test_unknown_currency(self):
        result = _format_salary(100000, 200000, "BRL", "YEAR")
        assert "BRL" in result

    def test_hourly_period(self):
        result = _format_salary(50, 75, "USD", "HOUR")
        assert "/hour" in result


# ── _company_to_slug ──────────────────────────────────────────────────────────

class TestCompanyToSlug:
    def test_simple(self):
        assert _company_to_slug("Google") == "google"

    def test_strip_llc(self):
        assert _company_to_slug("Google LLC") == "google"

    def test_strip_inc(self):
        assert _company_to_slug("Apple Inc.") == "apple"

    def test_strip_platforms_inc(self):
        assert _company_to_slug("Meta Platforms, Inc.") == "meta"

    def test_strip_corp(self):
        assert _company_to_slug("Microsoft Corporation") == "microsoft"

    def test_strip_dot_com(self):
        assert _company_to_slug("Amazon.com") == "amazon"

    def test_multi_word(self):
        assert _company_to_slug("JPMorgan Chase") == "jpmorgan-chase"

    def test_empty(self):
        assert _company_to_slug("") == ""


# ── _match_job_family ─────────────────────────────────────────────────────────

class TestMatchJobFamily:
    def test_software_engineer(self):
        assert _match_job_family("Senior Software Engineer") == "Software Engineering"

    def test_backend(self):
        assert _match_job_family("Backend Engineer - Payments") == "Software Engineering"

    def test_frontend(self):
        assert _match_job_family("Senior Frontend Developer") == "Software Engineering"

    def test_data_scientist(self):
        assert _match_job_family("Senior Data Scientist") == "Data Science"

    def test_product_manager(self):
        assert _match_job_family("Product Manager, Growth") == "Product Management"

    def test_data_engineer(self):
        assert _match_job_family("Staff Data Engineer") == "Data Engineering"

    def test_ml_engineer(self):
        assert _match_job_family("ML Engineer") == "Machine Learning Engineering"

    def test_engineering_manager(self):
        assert _match_job_family("Engineering Manager, Payments") == "Software Engineering Manager"

    def test_no_match(self):
        assert _match_job_family("Office Manager") is None

    def test_devops(self):
        assert _match_job_family("DevOps Engineer") == "Software Engineering"

    def test_sre(self):
        assert _match_job_family("Site Reliability Engineer") == "Software Engineering"


# ── _parse_salary_from_md ─────────────────────────────────────────────────────

SAMPLE_MD = """\
# Google Compensation Data

| Rank | Job Family | Median Total Comp |
|------|-----------|-------------------|
| 1 | Software Engineering Manager | $792,821 |
| 2 | Software Engineering | $328,000 |
| 3 | Data Science | $275,000 |
| 4 | Product Management | $310,000 |
"""


class TestParseSalaryFromMd:
    def test_software_engineering(self):
        result = _parse_salary_from_md(SAMPLE_MD, "Software Engineering")
        assert result == "~$328K/yr USD (Levels.fyi)"

    def test_data_science(self):
        result = _parse_salary_from_md(SAMPLE_MD, "Data Science")
        assert result == "~$275K/yr USD (Levels.fyi)"

    def test_not_found(self):
        result = _parse_salary_from_md(SAMPLE_MD, "Marketing")
        assert result is None

    def test_empty_md(self):
        result = _parse_salary_from_md("", "Software Engineering")
        assert result is None


# ── _normalise_jsearch_job salary extraction ──────────────────────────────────

class TestNormaliseJSearchSalary:
    def test_with_salary(self):
        job = {
            "_source": "jsearch",
            "job_id": "123",
            "job_title": "SWE",
            "employer_name": "Acme",
            "job_min_salary": 120000,
            "job_max_salary": 160000,
            "job_salary_currency": "USD",
            "job_salary_period": "YEAR",
        }
        result = _normalise_jsearch_job(job)
        assert result["salaryRange"] == "$120K-$160K/yr"

    def test_without_salary(self):
        job = {"_source": "jsearch", "job_id": "456", "job_title": "SWE", "employer_name": "Acme"}
        result = _normalise_jsearch_job(job)
        assert result["salaryRange"] == ""


# ── _normalise_adzuna_job salary extraction ───────────────────────────────────

class TestNormaliseAdzunaSalary:
    def test_with_real_salary(self):
        job = {
            "_source": "adzuna", "_country": "GB",
            "id": "789", "title": "SWE",
            "salary_min": 45000, "salary_max": 55000,
        }
        result = _normalise_adzuna_job(job)
        assert result["salaryRange"] == "\u00a345K-\u00a355K/yr"

    def test_predicted_salary_skipped(self):
        job = {
            "_source": "adzuna", "_country": "GB",
            "id": "790", "title": "SWE",
            "salary_min": 30000, "salary_max": 50000,
            "salary_is_predicted": "1",
        }
        result = _normalise_adzuna_job(job)
        assert result["salaryRange"] == ""

    def test_without_salary(self):
        job = {"_source": "adzuna", "_country": "NL", "id": "791", "title": "SWE"}
        result = _normalise_adzuna_job(job)
        assert result["salaryRange"] == ""


# ── enrich_salaries_from_levelsfyi (integration, mocked HTTP) ─────────────────

MOCK_GOOGLE_MD = """\
| Rank | Job Family | Median Total Comp |
|------|-----------|-------------------|
| 1 | Software Engineering | $328,000 |
| 2 | Data Science | $275,000 |
"""


class TestEnrichSalaries:
    @patch("tools.salary_tools._fetch_levelsfyi_md")
    def test_enriches_missing_salary(self, mock_fetch):
        mock_fetch.return_value = MOCK_GOOGLE_MD
        jobs = [
            {"title": "Software Engineer", "company": "Google LLC", "salaryRange": ""},
            {"title": "Data Scientist", "company": "Google LLC", "salaryRange": ""},
        ]
        result = enrich_salaries_from_levelsfyi(jobs)
        assert result[0]["salaryRange"] == "~$328K/yr USD (Levels.fyi)"
        assert result[1]["salaryRange"] == "~$275K/yr USD (Levels.fyi)"
        # Should only fetch once (deduplicated by slug)
        mock_fetch.assert_called_once_with("google")

    @patch("tools.salary_tools._fetch_levelsfyi_md")
    def test_skips_jobs_with_existing_salary(self, mock_fetch):
        jobs = [
            {"title": "Software Engineer", "company": "Google LLC", "salaryRange": "$120K-$160K/yr"},
        ]
        result = enrich_salaries_from_levelsfyi(jobs)
        assert result[0]["salaryRange"] == "$120K-$160K/yr"
        mock_fetch.assert_not_called()

    @patch("tools.salary_tools._fetch_levelsfyi_md")
    def test_leaves_empty_when_fetch_fails(self, mock_fetch):
        mock_fetch.return_value = None
        jobs = [
            {"title": "Software Engineer", "company": "Unknown Corp", "salaryRange": ""},
        ]
        result = enrich_salaries_from_levelsfyi(jobs)
        assert result[0]["salaryRange"] == ""

    @patch("tools.salary_tools._fetch_levelsfyi_md")
    def test_leaves_empty_when_role_not_matched(self, mock_fetch):
        mock_fetch.return_value = MOCK_GOOGLE_MD
        jobs = [
            {"title": "Office Manager", "company": "Google LLC", "salaryRange": ""},
        ]
        result = enrich_salaries_from_levelsfyi(jobs)
        assert result[0]["salaryRange"] == ""

"""Tools for loading and working with mock job vacancy data."""

import json
import pathlib
from typing import Any

DATA_DIR = pathlib.Path(__file__).parent.parent.parent / "data"
VACANCIES_DIR = DATA_DIR / "vacancies"


def load_all_vacancies() -> list[dict[str, Any]]:
    """Load all mock job vacancies from the data directory.

    Returns:
        List of all vacancy dictionaries.
    """
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

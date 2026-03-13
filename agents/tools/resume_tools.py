"""Tools for loading and working with mock resume data."""

import json
import pathlib
from typing import Any

DATA_DIR = pathlib.Path(__file__).parent.parent.parent / "data"
RESUMES_DIR = DATA_DIR / "resumes"


def load_resume(resume_id: str) -> dict[str, Any]:
    """Load a mock resume by its ID from the data directory.

    Args:
        resume_id: The resume identifier (e.g., 'java-dev-3yr', 'python-ml-5yr')

    Returns:
        Resume data as a dictionary, or an error dict if not found.
    """
    resume_path = RESUMES_DIR / f"{resume_id}.json"
    if not resume_path.exists():
        available = [f.stem for f in RESUMES_DIR.glob("*.json")]
        return {
            "error": f"Resume '{resume_id}' not found.",
            "available_resumes": available,
        }
    return json.loads(resume_path.read_text())


def list_resumes() -> list[dict[str, Any]]:
    """List all available mock resumes with their basic info.

    Returns:
        List of resume summaries with id, name, role, and yearsExperience.
    """
    resumes = []
    for resume_file in sorted(RESUMES_DIR.glob("*.json")):
        data = json.loads(resume_file.read_text())
        resumes.append({
            "id": data["id"],
            "name": data["name"],
            "role": data["role"],
            "yearsExperience": data["yearsExperience"],
            "summary": data.get("summary", ""),
        })
    return resumes

"""Vacancy Matcher Agent — scores all vacancies against a parsed resume."""

from google.adk.agents import LlmAgent
from google.genai import types
from tools.vacancy_tools import load_all_vacancies

vacancy_matcher_agent = LlmAgent(
    name="vacancy_matcher",
    model="gemini-2.5-flash",
    generate_content_config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0)
    ),
    description=(
        "Uses the parsed_resume from session state to score all job vacancies. "
        "Returns sorted match results with skill gaps highlighted."
    ),
    instruction="""You are an expert technical recruiter with 10 years of experience
matching engineers to the right roles.

The user message contains the candidate resume as JSON.
Use the load_all_vacancies tool to get all available job vacancies.
Score each vacancy against the resume provided in the user message.

For EACH vacancy, produce a MatchResult with:
- **vacancyId**: The vacancy's id field
- **overallScore**: 0-100 integer. Be honest and calibrated:
  - 85-100: Excellent match, candidate exceeds requirements
  - 70-84: Strong match, meets most requirements
  - 50-69: Good match with some gaps
  - 30-49: Stretch role, significant gaps
  - 0-29: Poor match, major misalignment
- **breakdown**:
  - skillsMatch (0-100): How many required skills the candidate has
  - experienceMatch (0-100): Years of experience vs required
  - techStackMatch (0-100): Core tech stack overlap
- **matchedSkills**: Skills present in BOTH the resume and vacancy requirements
- **missingSkills**: Required/must-have skills ABSENT from the resume
- **niceToHaveGaps**: Optional skills the candidate lacks
- **recommendation**: "strong" (>75), "good" (55-75), "stretch" (35-55), "mismatch" (<35)
- **strengthSummary**: 1-2 sentences on why the candidate is strong for this role
- **gapSummary**: 1-2 sentences on the key gaps to address

Return ONLY a valid JSON object with a "results" array sorted by overallScore descending.
Do not call any other tools. Do not try to save or store anything — just return the JSON.
""",
    tools=[load_all_vacancies],
    output_key="match_results",
)

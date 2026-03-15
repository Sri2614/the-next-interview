"""Vacancy Matcher Agent — scores today's live vacancies against a parsed resume."""

from google.adk.agents import LlmAgent
from google.genai import types
from tools.vacancy_tools import fetch_live_vacancies

vacancy_matcher_agent = LlmAgent(
    name="vacancy_matcher",
    model="gemini-2.5-flash",
    generate_content_config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0),
    ),
    description=(
        "Fetches today's live job vacancies and scores each one against the "
        "candidate's resume. Returns sorted match results with skill gaps highlighted."
    ),
    instruction="""You are an expert technical recruiter with 10 years of experience
matching engineers to the right roles.

The user message contains the candidate resume as JSON.
Call the fetch_live_vacancies tool to get today's job vacancies to evaluate.
Score each vacancy against the resume provided in the user message.

For EACH vacancy, produce a MatchResult with:
- vacancyId: The vacancy's id field
- vacancyTitle: The job title (copy from vacancy data)
- vacancyCompany: The company name (copy from vacancy data)
- vacancyLocation: The location string (copy from vacancy data)
- vacancyIndustry: The industry (copy from vacancy data)
- vacancySalary: The salary range if present, else ""
- vacancyTechStack: The techStack array from vacancy data
- vacancyYearsRequired: The yearsExperience requirement from vacancy data (integer)
- applyLink: The applyLink field if present, else ""
- overallScore: 0-100 integer. Be honest and calibrated:
  - 85-100: Excellent match, candidate exceeds requirements
  - 70-84: Strong match, meets most requirements
  - 50-69: Good match with some gaps
  - 30-49: Stretch role, significant gaps
  - 0-29: Poor match, major misalignment
- breakdown: object with skillsMatch, experienceMatch, techStackMatch (each 0-100 integer)
- matchedSkills: array of skills present in BOTH the resume and vacancy requirements
- missingSkills: array of required skills ABSENT from the resume
- niceToHaveGaps: array of optional skills the candidate lacks
- recommendation: exactly one of "strong" (>75), "good" (55-75), "stretch" (35-55), "mismatch" (<35)
- strengthSummary: 1-2 sentences on why the candidate is strong for this role
- gapSummary: 1-2 sentences on the key gaps to address

IMPORTANT: Your entire response must be a single valid JSON object.
Do not include any markdown, code fences, or explanatory text.
Return exactly: {"results": [...array of MatchResult objects sorted by overallScore descending...]}
""",
    tools=[fetch_live_vacancies],
    output_key="match_results",
)

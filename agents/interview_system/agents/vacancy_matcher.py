"""Vacancy Matcher Agent — scores today's live vacancies against a parsed resume."""

from google.adk.agents import LlmAgent
from google.genai import types
from tools.vacancy_tools import fetch_live_vacancies

# Strict output schema — guarantees the JSON shape so frontend never fails to parse
_breakdown_schema = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "skillsMatch":     types.Schema(type=types.Type.INTEGER),
        "experienceMatch": types.Schema(type=types.Type.INTEGER),
        "techStackMatch":  types.Schema(type=types.Type.INTEGER),
    },
    required=["skillsMatch", "experienceMatch", "techStackMatch"],
)

_result_schema = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "vacancyId":           types.Schema(type=types.Type.STRING),
        "vacancyTitle":        types.Schema(type=types.Type.STRING),
        "vacancyCompany":      types.Schema(type=types.Type.STRING),
        "vacancyLocation":     types.Schema(type=types.Type.STRING),
        "vacancyIndustry":     types.Schema(type=types.Type.STRING),
        "vacancySalary":       types.Schema(type=types.Type.STRING),
        "vacancyTechStack":    types.Schema(type=types.Type.ARRAY,  items=types.Schema(type=types.Type.STRING)),
        "vacancyYearsRequired":types.Schema(type=types.Type.INTEGER),
        "applyLink":           types.Schema(type=types.Type.STRING),
        "overallScore":        types.Schema(type=types.Type.INTEGER),
        "breakdown":           _breakdown_schema,
        "matchedSkills":       types.Schema(type=types.Type.ARRAY,  items=types.Schema(type=types.Type.STRING)),
        "missingSkills":       types.Schema(type=types.Type.ARRAY,  items=types.Schema(type=types.Type.STRING)),
        "niceToHaveGaps":      types.Schema(type=types.Type.ARRAY,  items=types.Schema(type=types.Type.STRING)),
        "recommendation":      types.Schema(type=types.Type.STRING, enum=["strong", "good", "stretch", "mismatch"]),
        "strengthSummary":     types.Schema(type=types.Type.STRING),
        "gapSummary":          types.Schema(type=types.Type.STRING),
    },
    required=[
        "vacancyId", "vacancyTitle", "vacancyCompany", "overallScore",
        "breakdown", "matchedSkills", "missingSkills", "recommendation",
        "strengthSummary", "gapSummary",
    ],
)

_output_schema = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "results": types.Schema(type=types.Type.ARRAY, items=_result_schema),
    },
    required=["results"],
)

vacancy_matcher_agent = LlmAgent(
    name="vacancy_matcher",
    model="gemini-2.5-flash",
    generate_content_config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0),
        response_mime_type="application/json",
        response_schema=_output_schema,
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
- vacancyYearsRequired: The yearsExperience requirement from vacancy data
- applyLink: The applyLink field if present, else ""
- overallScore: 0-100 integer. Be honest and calibrated:
  - 85-100: Excellent match, candidate exceeds requirements
  - 70-84: Strong match, meets most requirements
  - 50-69: Good match with some gaps
  - 30-49: Stretch role, significant gaps
  - 0-29: Poor match, major misalignment
- breakdown:
  - skillsMatch (0-100): How many required skills the candidate has
  - experienceMatch (0-100): Years of experience vs required
  - techStackMatch (0-100): Core tech stack overlap
- matchedSkills: Skills present in BOTH the resume and vacancy requirements
- missingSkills: Required/must-have skills ABSENT from the resume
- niceToHaveGaps: Optional skills the candidate lacks
- recommendation: "strong" (>75), "good" (55-75), "stretch" (35-55), "mismatch" (<35)
- strengthSummary: 1-2 sentences on why the candidate is strong for this role
- gapSummary: 1-2 sentences on the key gaps to address

Return a JSON object with a "results" array sorted by overallScore descending.
""",
    tools=[fetch_live_vacancies],
    output_key="match_results",
)

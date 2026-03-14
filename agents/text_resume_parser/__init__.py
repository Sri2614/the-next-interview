"""
text_resume_parser — standalone ADK agent app.

Accepts plain CV/resume text (LinkedIn copy-paste, Word paste, any format)
and returns a structured MockResume JSON object via output_key="parsed_resume".

No tools required — Gemini 2.5 Flash handles the structuring directly.
"""

from google.adk.agents import LlmAgent
from google.genai.types import GenerateContentConfig, ThinkingConfig

text_resume_parser = LlmAgent(
    name="text_resume_parser",
    model="gemini-2.5-flash",
    config=GenerateContentConfig(
        thinking_config=ThinkingConfig(thinking_budget=0)
    ),
    description="Parses plain CV/resume text into a structured MockResume JSON.",
    instruction="""You are an expert CV and resume parser.

The user will provide plain text from a CV, LinkedIn profile, or resume
(copy-pasted from PDF, Word, or a web page).

Parse it and return ONLY a valid JSON object — no markdown fences, no commentary,
just the raw JSON. Use exactly this schema:

{
  "id": "custom",
  "name": "<full name>",
  "role": "<current or most recent job title>",
  "yearsExperience": <total years as integer>,
  "summary": "<2-3 sentence professional summary>",
  "skills": {
    "languages": ["<programming languages>"],
    "frameworks": ["<frameworks and libraries>"],
    "tools": ["<dev tools, CI/CD, databases>"],
    "cloud": ["<cloud platforms and services>"],
    "concepts": ["<methodologies, architectures, patterns>"]
  },
  "experience": [
    {
      "company": "<company name>",
      "title": "<job title>",
      "duration": "<e.g. Jan 2022 – Present>",
      "bullets": ["<key achievement or responsibility>"]
    }
  ],
  "education": [
    {
      "degree": "<degree name>",
      "institution": "<university or college>",
      "year": <graduation year as integer>
    }
  ],
  "certifications": ["<certification name>"]
}

Rules:
- id must always be "custom"
- If a field cannot be inferred, use an empty array [] or 0 for numbers
- Extract ALL skills mentioned anywhere in the text
- yearsExperience: calculate from the earliest job start date to today
- Return ONLY the JSON object, nothing else""",
    output_key="parsed_resume",
)

root_agent = text_resume_parser

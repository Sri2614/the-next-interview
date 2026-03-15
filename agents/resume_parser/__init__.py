"""Standalone Resume Parser Agent — parses a PDF resume via Document AI and structures it."""

from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext
from google.genai import types

from tools.document_ai_tools import parse_resume_document_ai


def parse_resume_from_state(tool_context: ToolContext) -> str:
    """Extract text from the PDF resume stored in session state using Document AI.

    Reads pdf_base64 directly from session state — Gemini never handles the raw binary.
    """
    pdf_base64: str = tool_context.state.get("pdf_base64", "")
    if not pdf_base64:
        return "Error: No PDF data found in session state. Ensure pdf_base64 is set."
    return parse_resume_document_ai(pdf_base64)


resume_parser_agent = LlmAgent(
    name="resume_parser",
    model="gemini-2.5-flash",
    generate_content_config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0)
    ),
    description=(
        "Parses a PDF resume using Google Document AI and returns a structured "
        "candidate profile JSON matching the MockResume schema."
    ),
    instruction="""You are an expert resume parser.

The PDF resume has been stored in session state. Do NOT expect base64 in the message.

Steps:
1. Call parse_resume_from_state() — it reads the PDF from session state and returns the extracted text.
2. Carefully read the extracted text and structure it as a JSON object.

Return ONLY a valid JSON object with this exact schema (no markdown, no explanation):

{
  "id": "custom",
  "name": "Full name from resume",
  "role": "Most recent job title or primary role",
  "yearsExperience": <total years as integer>,
  "summary": "2-3 sentence professional summary based on the resume",
  "skills": {
    "languages": ["programming languages listed or inferred from experience"],
    "frameworks": ["frameworks and libraries"],
    "tools": ["dev tools, CI/CD, monitoring, etc."],
    "cloud": ["cloud platforms and services"],
    "concepts": ["architectural patterns, methodologies, domain knowledge"]
  },
  "experience": [
    {
      "company": "Company name",
      "title": "Job title",
      "duration": "e.g. Jan 2022 – Present",
      "bullets": ["key achievement or responsibility", "..."]
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "University/institution name",
      "year": "Graduation year as string"
    }
  ],
  "certifications": ["certification name", "..."]
}

Rules:
- yearsExperience: Calculate TOTAL years of full-time professional experience.
  Method: for each role in the experience list, compute its actual duration in months.
  For any end date marked "Present" or "Current", use March 2026 as today's date.
  SUM all durations, then convert to years (round to nearest integer).
  DO NOT simply subtract the earliest start year from today — gaps between jobs must NOT be counted.
  DO NOT include education, student projects, or internships shorter than 3 months.
  Example: Job A Jan 2020–Dec 2021 (24 months) + Job B Mar 2022–Mar 2024 (24 months) = 48 months = 4 years.
- If a field has no data in the resume, use an empty array [] or empty string ""
- Extract ALL technical skills mentioned anywhere in the resume
- For skills.concepts include things like "microservices", "REST APIs", "agile", "TDD" etc.
- Keep bullet points concise (max 15 words each)
- Output ONLY the JSON object, nothing else
""",
    tools=[parse_resume_from_state],
    output_key="parsed_resume",
)

# ADK api_server discovers this as the root agent for the 'resume_parser' app
root_agent = resume_parser_agent

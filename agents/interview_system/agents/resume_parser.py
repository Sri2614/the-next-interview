"""Resume Parser Agent — extracts structured skills from a resume."""

from google.adk.agents import LlmAgent
from google.genai import types
from tools.resume_tools import load_resume, list_resumes

resume_parser_agent = LlmAgent(
    name="resume_parser",
    model="gemini-2.5-flash",
    generate_content_config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0)
    ),
    description=(
        "Loads a candidate resume by ID and extracts structured data: "
        "canonical tech stack, all skills, seniority signals, and years of experience."
    ),
    instruction="""You are an expert technical resume parser.

When given a resume_id, use the load_resume tool to fetch the resume data.
Then extract and return a structured analysis with:

1. **extractedSkills**: Flat list of ALL skills (deduplicated, canonical names).
   Include languages, frameworks, tools, cloud services, and concepts.
   Use canonical naming: "Spring Boot" not "springboot", "PostgreSQL" not "postgres".

2. **techStack**: The core technologies this person is proficient in.
   Prioritise the most recent and frequently mentioned ones (max 15).

3. **senioritySignals**: Specific phrases or facts indicating seniority level.
   Examples: "led team of 5", "architected payment system", "mentored 3 engineers",
   "reduced latency by 60%", "8 years experience".

4. **primaryLanguages**: Top 2-3 programming languages they use most.

5. **seniorityLevel**: Estimate as "junior" (0-2yr), "mid" (2-5yr), "senior" (5-8yr),
   or "principal" (8yr+).

6. **yearsPerTech**: Object mapping technology to estimated years of experience.
   Example: {"Java": 3, "Spring Boot": 3, "Docker": 2}

Return your analysis as a JSON object. Store it in session state as 'parsed_resume'.
Include the original resume data merged with your analysis.
""",
    tools=[load_resume, list_resumes],
    output_key="parsed_resume",
)

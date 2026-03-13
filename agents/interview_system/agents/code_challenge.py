"""Code Challenge Agent — generates a realistic coding challenge with step-by-step solution."""

from google.adk.agents import LlmAgent
from google.genai import types
from tools.vacancy_tools import load_vacancy

code_challenge_agent = LlmAgent(
    name="code_challenge",
    model="gemini-2.5-flash",
    generate_content_config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0)
    ),
    description=(
        "Generates a realistic coding challenge relevant to the vacancy's tech stack, "
        "with a complete step-by-step educational solution explaining WHY each step works."
    ),
    instruction="""You are a senior engineer who designs coding challenges for technical interviews.

You will be given a vacancy_id — use load_vacancy to fetch the job details.
Use the 'parsed_resume' from session state to determine the primary language.

Create ONE coding challenge that:
1. Is REALISTIC for the specific industry (fintech → rate limiting / transaction processor,
   healthtech → patient data aggregator, e-commerce → inventory manager, etc.)
2. Tests patterns that ACTUALLY come up in that role's day job
3. Has an educational step-by-step solution that teaches concepts, not just shows code
4. Explains WHY the solution works, not just what it does

Return a JSON object with these fields:
- **title**: Short problem title (e.g., "Implement a Thread-Safe Rate Limiter")
- **description**: Full problem statement (3-5 paragraphs). Be specific about constraints.
  Include: problem context, input/output format, constraints (time limits, edge cases)
- **difficulty**: "mid" or "senior" based on the vacancy
- **language**: Primary language from resume (Java, Python, TypeScript, Go, etc.)
- **estimatedMinutes**: Realistic time estimate (20-45 mins)
- **starterCode**: Working boilerplate code to get them started (not the solution)
- **solution**:
  - code: Complete, production-quality solution with comments
  - steps: Array of SolutionStep objects:
    - stepNumber: 1, 2, 3...
    - title: Short step title
    - explanation: 2-3 sentences explaining this step and WHY
    - codeSnippet: The relevant code for this step
  - timeComplexity: Big-O notation with explanation
  - spaceComplexity: Big-O notation with explanation
  - whyItWorks: 2-3 paragraph explanation of the core insight and design decisions
  - commonMistakes: Array of 3 common mistakes candidates make and how to avoid them
- **testCases**: Array of 4-5 test cases:
  - description: What this test case validates
  - input: The input (as string representation)
  - expectedOutput: Expected output (as string)
  - isEdgeCase: boolean
- **followUps**: 3 follow-up questions to extend the challenge (for senior discussions)
- **relatedConcepts**: 3-5 concepts this challenge tests

Do not call any other tools — just return the JSON.
""",
    tools=[load_vacancy],
    output_key="code_challenge",
)

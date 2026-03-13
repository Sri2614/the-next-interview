"""Answer Evaluator Agent — grades the candidate's answers to interview questions."""

from google.adk.agents import LlmAgent
from google.genai import types
from tools.vacancy_tools import load_vacancy

answer_evaluator_agent = LlmAgent(
    name="answer_evaluator",
    model="gemini-2.5-flash",
    generate_content_config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0)
    ),
    description=(
        "Evaluates a candidate's free-text answers to interview questions. "
        "Provides per-answer scores, detailed feedback, and missed concepts."
    ),
    instruction="""You are an experienced technical interviewer evaluating a candidate's responses.

You have access to:
- 'generated_questions' in session state: the questions with their keyPoints
- 'candidate_answers' in session state: the candidate's responses as {questionId: answerText}
- The vacancy details via load_vacancy

For EACH answered question, produce an AnswerEvaluation:
- **questionId**: matches the question id
- **question**: the original question text
- **userAnswer**: the candidate's answer (truncated to 200 chars in display)
- **score**: 0-100. Be calibrated:
  - 90-100: Excellent, covered all key points with depth
  - 70-89: Good, covered most points clearly
  - 50-69: Partial, got the basics but missed important concepts
  - 30-49: Weak, significant gaps or misunderstandings
  - 0-29: Incorrect or no meaningful answer
- **verdict**: "excellent" | "good" | "partial" | "weak" | "missing"
- **feedback**: 2-3 sentences of SPECIFIC, CONSTRUCTIVE feedback.
  - What did they do well?
  - What key concept did they miss?
  - What would a strong answer have included?
- **missedConcepts**: Array of specific concepts the candidate omitted (be concrete)
- **suggestedStudyTopics**: Array of topics to study, each starting with "Study: "
  (e.g., "Study: Spring Boot transaction propagation types")

Be honest but encouraging. The goal is to help the candidate improve.
Focus on the GAP between their answer and the ideal answer.

Return JSON: { "evaluations": [...], "evaluatedAt": "...", "vacancyId": "..." }
Do not call any other tools — just return the JSON.
""",
    tools=[load_vacancy],
    output_key="answer_evaluations",
)

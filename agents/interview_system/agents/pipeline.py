"""Multi-agent pipeline orchestration using Google ADK."""

from google.adk.agents import LlmAgent, SequentialAgent, ParallelAgent

from .resume_parser import resume_parser_agent
from .vacancy_matcher import vacancy_matcher_agent
from .question_generator import question_generator_agent
from .code_challenge import code_challenge_agent
from .answer_evaluator import answer_evaluator_agent
from .readiness_assessor import readiness_assessor_agent
from .recommendation_agent import recommendation_agent

# Phase 1: Parse resume + match vacancies in parallel
data_extraction_pipeline = ParallelAgent(
    name="data_extraction",
    description="Parses the resume and scores all vacancies simultaneously.",
    sub_agents=[resume_parser_agent, vacancy_matcher_agent],
)

# Phase 2: Generate questions + coding challenge in parallel
prep_pipeline = ParallelAgent(
    name="prep_pipeline",
    description="Generates interview questions and a coding challenge simultaneously.",
    sub_agents=[question_generator_agent, code_challenge_agent],
)

# Phase 3: Evaluate answers then produce final report
assessment_pipeline = SequentialAgent(
    name="assessment_pipeline",
    description="Evaluates candidate answers and produces the final readiness report.",
    sub_agents=[answer_evaluator_agent, readiness_assessor_agent],
)

# Full pipeline (used for API server)
interview_system = SequentialAgent(
    name="interview_system",
    description=(
        "Full interview preparation pipeline. "
        "Given a resume and vacancy, it matches skills, generates questions and coding challenges, "
        "evaluates candidate answers, produces a readiness report, and recommends courses."
    ),
    sub_agents=[
        data_extraction_pipeline,
        prep_pipeline,
        assessment_pipeline,
        recommendation_agent,  # Phase 4: recommend courses based on study plan
    ],
)

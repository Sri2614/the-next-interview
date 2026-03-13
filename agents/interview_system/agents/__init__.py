"""The Next Interview — Google ADK multi-agent system."""

from .pipeline import (
    interview_system,
    data_extraction_pipeline,
    prep_pipeline,
    assessment_pipeline,
)
from .resume_parser import resume_parser_agent
from .vacancy_matcher import vacancy_matcher_agent
from .question_generator import question_generator_agent
from .code_challenge import code_challenge_agent
from .answer_evaluator import answer_evaluator_agent
from .readiness_assessor import readiness_assessor_agent
from .recommendation_agent import recommendation_agent

# ADK api_server expects a module-level 'root_agent'
root_agent = interview_system

__all__ = [
    "root_agent",
    "interview_system",
    "data_extraction_pipeline",
    "prep_pipeline",
    "assessment_pipeline",
    "resume_parser_agent",
    "vacancy_matcher_agent",
    "question_generator_agent",
    "code_challenge_agent",
    "answer_evaluator_agent",
    "readiness_assessor_agent",
    "recommendation_agent",
]

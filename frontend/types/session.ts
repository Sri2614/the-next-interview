import type { MatchResult } from './vacancy'

export type DifficultyLevel = 'junior' | 'mid' | 'senior'

export interface GeneratedQuestion {
  id: string
  question: string
  difficulty: DifficultyLevel
  focusArea: string
  hint?: string
  keyPoints?: string[]
  modelAnswer?: string
}

export interface SolutionStep {
  stepNumber: number
  title: string
  explanation: string
  codeSnippet?: string
}

export interface TestCase {
  description: string
  input: string
  expectedOutput: string
  isEdgeCase: boolean
}

export interface CodeChallenge {
  title: string
  description: string
  difficulty: DifficultyLevel
  language: string
  estimatedMinutes: number
  starterCode: string | { python: string; javascript: string; java: string }
  solution: {
    code: string
    steps: SolutionStep[]
    timeComplexity: string
    spaceComplexity: string
    whyItWorks: string
    commonMistakes: string[]
  }
  testCases: TestCase[]
  followUps: string[]
  relatedConcepts: string[]
}

export interface ATSAnalysis {
  atsScore: number
  verdict: 'excellent' | 'good' | 'needs_work' | 'poor'
  verdictSummary: string
  keywordsFound: string[]
  keywordsMissing: string[]
  skillsToAdd: string[]
  phrasesToUse: string[]
  formattingTips: string[]
  tailoredSummary: string
}

export interface PrepSession {
  sessionId: string
  resumeId: string
  vacancyId: string
  matchResult: MatchResult
  createdAt: string
  generatedQuestions?: GeneratedQuestion[]
  questionsGeneratedAt?: string
  codeChallenge?: CodeChallenge
  challengeGeneratedAt?: string
  atsAnalysis?: ATSAnalysis
  atsAnalysedAt?: string
}

export interface QuestionAnswer {
  questionId: string
  question: string
  difficulty: DifficultyLevel
  focusArea: string
  userAnswer: string
}

export interface AnswerEvaluation {
  questionId: string
  question: string
  userAnswer: string
  score: number
  verdict: 'excellent' | 'good' | 'partial' | 'weak' | 'missing'
  feedback: string
  missedConcepts: string[]
  suggestedStudyTopics: string[]
}

export interface StudyItem {
  topic: string
  priority: 'high' | 'medium' | 'low'
  reason: string
  estimatedHours: number
}

export interface ReadinessReport {
  overallScore: number
  verdict: 'ready' | 'almost_ready' | 'needs_work' | 'not_ready'
  verdictLabel: string
  verdictExplanation: string
  categoryScores: {
    technical: number
    communication: number
    problemSolving: number
  }
  strengths: string[]
  weaknesses: string[]
  studyPlan: StudyItem[]
  encouragement: string
  estimatedPrepTime: string
}

export interface CourseResource {
  title: string
  provider: string
  url: string
  duration: string
  why: string
}

export interface CourseRecommendation {
  topic: string
  priority: 'high' | 'medium' | 'low'
  courses: CourseResource[]
}

export interface RecommendationReport {
  recommendations: CourseRecommendation[]
}

export interface AssessmentSession {
  sessionId: string
  prepSessionId: string
  resumeId: string
  vacancyId: string
  startedAt: string
  completedAt?: string
  answers: QuestionAnswer[]
  evaluations?: AnswerEvaluation[]
  report?: ReadinessReport
  recommendations?: RecommendationReport
  attemptNumber?: number
  previousScore?: number
}

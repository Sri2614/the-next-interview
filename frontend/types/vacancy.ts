export interface VacancyRequirements {
  mustHave: string[]
  niceToHave: string[]
  yearsExperience: number
  education?: string
}

export interface Vacancy {
  id: string
  title: string
  company: string
  industry: string
  location: string
  salaryRange: string
  type: string
  description: string
  requirements: VacancyRequirements
  techStack: string[]
  responsibilities: string[]
  interviewProcess: string[]
  postedDate: string
}

export interface MatchBreakdown {
  skillsMatch: number
  experienceMatch: number
  techStackMatch: number
}

export type MatchRecommendation = 'strong' | 'good' | 'stretch' | 'mismatch'

export interface MatchResult {
  vacancyId: string
  overallScore: number
  breakdown: MatchBreakdown
  matchedSkills: string[]
  missingSkills: string[]
  niceToHaveGaps: string[]
  recommendation: MatchRecommendation
  strengthSummary: string
  gapSummary: string
  // Vacancy metadata — populated by the agent for live/real jobs
  // so the UI can render a card without needing to look up a local JSON file.
  vacancyTitle?: string
  vacancyCompany?: string
  vacancyLocation?: string
  vacancyIndustry?: string
  vacancySalary?: string
  vacancyTechStack?: string[]
  vacancyYearsRequired?: number
  applyLink?: string
}

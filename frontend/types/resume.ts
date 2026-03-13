export interface WorkExperience {
  company: string
  title: string
  duration: string
  bullets: string[]
}

export interface Education {
  degree: string
  institution: string
  year: number
}

export interface MockResume {
  id: string
  name: string
  role: string
  yearsExperience: number
  summary: string
  skills: {
    languages: string[]
    frameworks: string[]
    tools: string[]
    cloud: string[]
    concepts: string[]
  }
  experience: WorkExperience[]
  education: Education[]
  certifications: string[]
}

export interface ParsedResume extends MockResume {
  extractedSkills: string[]
  techStack: string[]
  senioritySignals: string[]
  primaryLanguages: string[]
  seniorityLevel: 'junior' | 'mid' | 'senior' | 'principal'
  yearsPerTech: Record<string, number>
}

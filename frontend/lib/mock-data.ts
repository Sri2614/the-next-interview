/**
 * Loads mock resume and vacancy data from JSON files.
 * Uses fs on the server side (Server Components / API routes).
 */

import fs from 'fs'
import path from 'path'
import type { MockResume } from '@/types/resume'
import type { Vacancy } from '@/types/vacancy'

const DATA_DIR = path.join(process.cwd(), '..', 'data')

export function getAllResumes(): MockResume[] {
  const resumeDir = path.join(DATA_DIR, 'resumes')
  const files = fs.readdirSync(resumeDir).filter(f => f.endsWith('.json'))
  return files.map(f => JSON.parse(fs.readFileSync(path.join(resumeDir, f), 'utf-8')) as MockResume)
}

export function getResumeById(id: string): MockResume | null {
  const filePath = path.join(DATA_DIR, 'resumes', `${id}.json`)
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as MockResume
}

export function getAllVacancies(): Vacancy[] {
  const vacancyDir = path.join(DATA_DIR, 'vacancies')
  const files = fs.readdirSync(vacancyDir).filter(f => f.endsWith('.json'))
  return files.map(f => JSON.parse(fs.readFileSync(path.join(vacancyDir, f), 'utf-8')) as Vacancy)
}

export function getVacancyById(id: string): Vacancy | null {
  const filePath = path.join(DATA_DIR, 'vacancies', `${id}.json`)
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Vacancy
}

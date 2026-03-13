import { getAllResumes } from '@/lib/mock-data'
import ResumeSelector from '@/components/ResumeSelector'

export default function ResumePage() {
  const resumes = getAllResumes()

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Step 1 of 4</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Choose Your Resume</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Select a profile to see how you match against 20+ vacancies.
          Realistic mock resumes — pick the one closest to your experience.
        </p>
      </div>
      <ResumeSelector resumes={resumes} />
    </div>
  )
}

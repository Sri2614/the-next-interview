import { getAllResumes } from '@/lib/mock-data'
import StepProgress from '@/components/StepProgress'
import ResumeTabs from '@/components/ResumeTabs'
import ContinueFlowBanner from '@/components/ContinueFlowBanner'

export default function ResumePage() {
  const resumes = getAllResumes()

  return (
    <div className="space-y-8">
      <StepProgress currentStep={1} />

      {/* Continue where you left off (client-side) */}
      <ContinueFlowBanner />

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Step 1 of 5</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Your Resume</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Upload a PDF, paste CV text, or choose a demo profile to match against live job vacancies.
        </p>
      </div>

      <ResumeTabs resumes={resumes} />
    </div>
  )
}

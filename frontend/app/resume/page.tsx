import { getAllResumes } from '@/lib/mock-data'
import ResumeSelector from '@/components/ResumeSelector'
import ResumeUpload from '@/components/ResumeUpload'
import StepProgress from '@/components/StepProgress'

export default function ResumePage() {
  const resumes = getAllResumes()

  return (
    <div className="space-y-8">
      <StepProgress currentStep={1} />

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Step 1 of 5</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Your Resume</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Upload your own resume or choose a demo profile to see how you match against 23 vacancies.
        </p>
      </div>

      {/* Upload section */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Upload Your Resume
        </h2>
        <ResumeUpload />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs font-medium px-2" style={{ color: 'var(--text-muted)' }}>or use a demo profile</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Mock profiles */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Demo Profiles
        </h2>
        <ResumeSelector resumes={resumes} />
      </div>
    </div>
  )
}

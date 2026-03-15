'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { MockResume } from '@/types/resume'
import { saveCustomResume } from '@/lib/session'
import { saveResumeToFirestore } from '@/lib/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { collectSSEEvents } from '@/lib/adk-client'
import { ADK_BASE } from '@/lib/constants'

type UploadState = 'idle' | 'reading' | 'parsing' | 'done' | 'error'

interface EditableFields {
  name: string
  role: string
  yearsExperience: number
  summary: string
}

const PDF_PARSE_STEPS = [
  { label: 'Extracting text with Document AI', sub: 'Processing PDF layout and structure…' },
  { label: 'Identifying your skills',          sub: 'Languages, frameworks, tools, cloud…' },
  { label: 'Analysing your experience',        sub: 'Roles, timelines, accomplishments…' },
  { label: 'Structuring your profile',         sub: 'Building your interview-ready profile…' },
]

export default function ResumeUpload() {
  const router = useRouter()
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [parsedResume, setParsedResume] = useState<MockResume | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [parseStep, setParseStep] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [editFields, setEditFields] = useState<EditableFields | null>(null)
  const [showFullDetails, setShowFullDetails] = useState(false)

  // Advance through progress steps while parsing
  useEffect(() => {
    if (state !== 'parsing') {
      setParseStep(0)
      return
    }
    const id = setInterval(() => {
      setParseStep(prev => (prev < PDF_PARSE_STEPS.length - 1 ? prev + 1 : prev))
    }, 2800)
    return () => clearInterval(id)
  }, [state])

  async function handleFile(file: File) {
    if (!file.name.endsWith('.pdf')) {
      setError('Only PDF files are supported')
      return
    }

    const MAX_MB = 10
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_MB} MB.`)
      return
    }

    setState('reading')
    setError(null)
    setParseStep(0)

    try {
      // Step 1: Read file as base64
      const base64 = await fileToBase64(file)

      setState('parsing')

      // Step 2: Call resume_parser ADK agent
      const APP = 'resume_parser'
      const userId = 'user-1'
      const sessionId = `resume-parse-${crypto.randomUUID()}`

      await fetch(`${ADK_BASE}/apps/${APP}/users/${userId}/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_base64: base64 }),
      })

      const events = await collectSSEEvents(`${ADK_BASE}/run_sse`, {
        appName: APP,
        userId,
        sessionId,
        newMessage: {
          parts: [{ text: 'Parse the resume PDF.' }],
          role: 'user',
        },
      })

      const parserEvent = [...events].reverse().find(
        (e: { author?: string }) => e.author === 'resume_parser'
      )

      let resume: MockResume | null = null

      const rawData = parserEvent?.actions?.stateDelta?.parsed_resume
      if (rawData !== undefined && rawData !== null) {
        if (typeof rawData === 'object' && 'name' in rawData) {
          resume = rawData as MockResume
        } else {
          const rawStr = typeof rawData === 'string' ? rawData : JSON.stringify(rawData)
          try {
            const parsed = JSON.parse(rawStr)
            if (parsed?.name) resume = parsed
          } catch {
            const m = rawStr.match(/\{[\s\S]*"name"[\s\S]*\}/)
            if (m) { try { resume = JSON.parse(m[0]) } catch { /* ignore */ } }
          }
        }
      }

      if (!resume) {
        const text: string =
          parserEvent?.content?.parts?.findLast((p: { text?: string }) => p.text)?.text ?? ''
        if (text) {
          try {
            const parsed = JSON.parse(text)
            if (parsed?.name) resume = parsed
          } catch {
            const m = text.match(/\{[\s\S]*"name"[\s\S]*\}/)
            if (m) { try { resume = JSON.parse(m[0]) } catch { /* ignore */ } }
          }
        }
      }

      if (!resume?.name) throw new Error('Could not parse resume — please try again')

      resume.id = 'custom'
      saveCustomResume(resume)
      // Save to Firestore if signed in (non-blocking)
      if (user) saveResumeToFirestore(user.uid, resume)
      setParsedResume(resume)
      setEditFields({ name: resume.name, role: resume.role, yearsExperience: resume.yearsExperience, summary: resume.summary ?? '' })
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume')
      setState('error')
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const isLoading = state === 'reading' || state === 'parsing'

  function saveEdits() {
    if (!parsedResume || !editFields) return
    const updated: MockResume = { ...parsedResume, ...editFields }
    saveCustomResume(updated)
    setParsedResume(updated)
    setEditMode(false)
  }

  // ── Success — full review card ─────────────────────────────────────────────
  if (state === 'done' && parsedResume && editFields) {
    const allSkills = [
      ...parsedResume.skills.languages,
      ...parsedResume.skills.frameworks,
      ...parsedResume.skills.tools,
      ...parsedResume.skills.cloud,
      ...parsedResume.skills.concepts,
    ]

    return (
      <div className="space-y-4">
        {/* Header bar */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderLeft: '3px solid var(--accent)' }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0" style={{ background: 'var(--accent-soft)' }}>✅</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Resume parsed — please review before matching</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Document AI + Gemini 2.5 Flash · Check for any OCR errors below</div>
          </div>
        </div>

        {/* Profile summary — editable */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>📋 Profile Summary</h3>
            <button
              onClick={() => setEditMode(v => !v)}
              className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
              style={{ background: editMode ? 'var(--accent-soft)' : 'var(--bg-base)', color: editMode ? 'var(--accent)' : 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {editMode ? '✕ Cancel' : '✏️ Edit'}
            </button>
          </div>

          {editMode ? (
            <div className="space-y-3">
              {[
                { label: 'Full Name', key: 'name' as const, type: 'text' },
                { label: 'Primary Role / Title', key: 'role' as const, type: 'text' },
                { label: 'Years of Experience', key: 'yearsExperience' as const, type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input
                    type={type}
                    value={editFields[key]}
                    onChange={e => setEditFields(prev => prev ? { ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value } : prev)}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Summary</label>
                <textarea
                  rows={3}
                  value={editFields.summary}
                  onChange={e => setEditFields(prev => prev ? { ...prev, summary: e.target.value } : prev)}
                  className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <button
                onClick={saveEdits}
                className="w-full py-2 rounded-xl text-sm text-white font-semibold"
                style={{ background: 'var(--accent)' }}
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{parsedResume.name}</span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{parsedResume.role}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  {parsedResume.yearsExperience} yrs exp
                </span>
              </div>
              {parsedResume.summary && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{parsedResume.summary}</p>
              )}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>🛠 Skills Detected ({allSkills.length})</h3>
          {allSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {allSkills.map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--error)' }}>⚠️ No skills detected — your PDF may have unusual formatting. Try the &quot;Paste CV Text&quot; tab instead.</p>
          )}
        </div>

        {/* Experience + Education — collapsible */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowFullDetails(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
            style={{ background: 'var(--bg-card)' }}
          >
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {showFullDetails ? '▲' : '▼'} Experience &amp; Education ({parsedResume.experience?.length ?? 0} roles)
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>verify OCR accuracy</span>
          </button>
          {showFullDetails && (
            <div className="p-5 space-y-5" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
              {/* Experience */}
              {parsedResume.experience?.length > 0 ? (
                <div className="space-y-4">
                  {parsedResume.experience.map((exp, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{exp.title}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{exp.company} · {exp.duration}</p>
                        </div>
                      </div>
                      {exp.bullets?.length > 0 && (
                        <ul className="space-y-1 ml-3">
                          {exp.bullets.slice(0, 3).map((b, bi) => (
                            <li key={bi} className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                              <span style={{ color: 'var(--text-muted)' }}>•</span>{b}
                            </li>
                          ))}
                          {exp.bullets.length > 3 && (
                            <li className="text-xs" style={{ color: 'var(--text-muted)' }}>+ {exp.bullets.length - 3} more…</li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--error)' }}>⚠️ No experience entries detected.</p>
              )}

              {/* Education */}
              {parsedResume.education?.length > 0 && (
                <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Education</p>
                  {parsedResume.education.map((edu, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{edu.degree}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{edu.institution} · {edu.year}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Something look wrong hint */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Something look off?</span>
          <button
            onClick={() => setEditMode(true)}
            className="text-xs underline"
            style={{ color: 'var(--accent)' }}
          >
            Edit the key fields above
          </button>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
          <button
            onClick={() => { setState('idle'); setParsedResume(null); setEditMode(false) }}
            className="text-xs underline"
            style={{ color: 'var(--text-muted)' }}
          >
            re-upload
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/match/custom')}
          className="w-full py-3 rounded-xl text-white font-semibold transition-colors"
          style={{ background: 'var(--accent)' }}
        >
          Looks good — Find Live Matches →
        </button>
      </div>
    )
  }

  // ── Parsing progress ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin flex-shrink-0"
            style={{ borderColor: 'var(--accent-border)', borderTopColor: 'var(--accent)' }}
          />
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {state === 'reading' ? 'Reading your PDF…' : 'Parsing with AI…'}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {state === 'reading' ? 'Preparing file for Document AI' : 'This usually takes 10–20 seconds'}
            </div>
          </div>
        </div>

        {/* Step list — only visible during parsing */}
        {state === 'parsing' && (
          <div className="space-y-3">
            {PDF_PARSE_STEPS.map((step, i) => {
              const isDone    = i < parseStep
              const isCurrent = i === parseStep
              return (
                <div key={i} className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center">
                    {isDone ? (
                      <svg viewBox="0 0 16 16" className="w-5 h-5" fill="none">
                        <circle cx="8" cy="8" r="7" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.2"/>
                        <path d="M5 8l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : isCurrent ? (
                      <div
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'var(--accent-border)', borderTopColor: 'var(--accent)' }}
                      />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)' }}
                      />
                    )}
                  </div>
                  {/* Labels */}
                  <div>
                    <div
                      className="text-sm font-medium leading-tight"
                      style={{ color: isDone ? 'var(--text-secondary)' : isCurrent ? 'var(--text-primary)' : 'var(--text-muted)' }}
                    >
                      {step.label}
                    </div>
                    {isCurrent && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {step.sub}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Disclaimer */}
        {state === 'parsing' && (
          <div
            className="rounded-lg px-3 py-2 text-xs"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            🔒 Your PDF is processed in-memory and never stored on our servers.
          </div>
        )}
      </div>
    )
  }

  // ── Idle / error drop zone ─────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="rounded-2xl p-8 text-center cursor-pointer transition-all"
        style={{
          background: isDragging ? 'var(--accent-soft)' : 'var(--bg-card)',
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <div className="space-y-2">
          <div className="text-3xl">📄</div>
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Drop your resume here
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            or <span style={{ color: 'var(--accent)' }}>click to browse</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            PDF only · Max 10 MB · Parsed by Google Document AI
          </div>
        </div>
      </div>

      {(state === 'error' || error) && (
        <div
          className="rounded-xl px-4 py-3 space-y-1.5"
          style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <div className="font-medium text-sm">⚠️ {error}</div>
          <div className="text-xs opacity-80">
            Make sure your PDF is not password-protected and contains selectable text (not a scanned image). If the problem persists, try the &quot;Paste CV Text&quot; tab instead.
          </div>
        </div>
      )}
    </div>
  )
}

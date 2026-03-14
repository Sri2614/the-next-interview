'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveCustomResume } from '@/lib/session'
import { collectSSEEvents } from '@/lib/adk-client'
import { ADK_BASE } from '@/lib/constants'
import type { MockResume } from '@/types/resume'

type ParseState = 'idle' | 'parsing' | 'done' | 'error'

const TEXT_PARSE_STEPS = [
  { label: 'Analysing your text',        sub: 'Reading through your CV content…' },
  { label: 'Identifying your skills',    sub: 'Languages, frameworks, tools, cloud…' },
  { label: 'Analysing your experience',  sub: 'Roles, timelines, accomplishments…' },
  { label: 'Structuring your profile',   sub: 'Building your interview-ready profile…' },
]

export default function TextResumeInput() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [state, setState] = useState<ParseState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [parsedResume, setParsedResume] = useState<MockResume | null>(null)
  const [parseStep, setParseStep] = useState(0)

  const charCount = text.length
  const isEmpty = charCount === 0

  // Advance through progress steps while parsing
  useEffect(() => {
    if (state !== 'parsing') {
      setParseStep(0)
      return
    }
    const id = setInterval(() => {
      setParseStep(prev => (prev < TEXT_PARSE_STEPS.length - 1 ? prev + 1 : prev))
    }, 2500)
    return () => clearInterval(id)
  }, [state])

  async function handleParse() {
    if (isEmpty) return

    setState('parsing')
    setError(null)
    setParseStep(0)

    const APP = 'text_resume_parser'
    const userId = 'user-1'
    const sessionId = `text-parse-${crypto.randomUUID()}`

    try {
      await fetch(`${ADK_BASE}/apps/${APP}/users/${userId}/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const events = await collectSSEEvents(`${ADK_BASE}/run_sse`, {
        appName: APP,
        userId,
        sessionId,
        newMessage: {
          parts: [{ text }],
          role: 'user',
        },
      })

      const parserEvent = [...events].reverse().find(
        (e) => e.author === 'text_resume_parser'
      )

      let resume: MockResume | null = null

      // Triple-fallback: stateDelta → parsed JSON string → regex extract
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
        const textContent: string =
          parserEvent?.content?.parts?.findLast?.((p: { text?: string }) => p.text)?.text ?? ''
        if (textContent) {
          try {
            const parsed = JSON.parse(textContent)
            if (parsed?.name) resume = parsed
          } catch {
            const m = textContent.match(/\{[\s\S]*"name"[\s\S]*\}/)
            if (m) { try { resume = JSON.parse(m[0]) } catch { /* ignore */ } }
          }
        }
      }

      if (!resume?.name) throw new Error('Could not parse your CV — please check your text and try again')

      resume.id = 'custom'
      saveCustomResume(resume)
      setParsedResume(resume)
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume text')
      setState('error')
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (state === 'done' && parsedResume) {
    const allSkills = [
      ...parsedResume.skills.languages,
      ...parsedResume.skills.frameworks,
      ...parsedResume.skills.tools,
    ].slice(0, 10)

    return (
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderLeft: '3px solid var(--accent)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'var(--accent-soft)' }}
          >
            ✅
          </div>
          <div>
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Resume parsed successfully</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Powered by Gemini 2.5 Flash</div>
          </div>
        </div>

        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-base)' }}>
          <div>
            <div className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{parsedResume.name}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {parsedResume.role} · {parsedResume.yearsExperience}yr experience
            </div>
          </div>
          {allSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allSkills.map(s => (
                <span
                  key={s}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/match/custom?autostart=true')}
            className="flex-1 py-3 rounded-xl text-white font-semibold transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            Find Live Matches →
          </button>
          <button
            onClick={() => { setState('idle'); setParsedResume(null); setText('') }}
            className="px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // ── Parsing progress ───────────────────────────────────────────────────────
  if (state === 'parsing') {
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
              Gemini is reading your CV…
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              This usually takes 10–20 seconds
            </div>
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-3">
          {TEXT_PARSE_STEPS.map((step, i) => {
            const isDone    = i < parseStep
            const isCurrent = i === parseStep
            return (
              <div key={i} className="flex items-start gap-3">
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

        {/* Privacy note */}
        <div
          className="rounded-lg px-3 py-2 text-xs"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          🔒 Your text is sent directly to the AI — it&apos;s never stored on our servers.
        </div>
      </div>
    )
  }

  // ── Input state ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Tip */}
      <div
        className="rounded-xl px-4 py-3 text-sm"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
      >
        💡 <strong>Tip:</strong> On LinkedIn go to your profile → <em>More</em> → <em>Save to PDF</em>, open it, then Ctrl+A → Copy and paste here.
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your LinkedIn profile, CV, or resume text here…"
          rows={10}
          className="w-full rounded-2xl px-5 py-4 text-sm resize-y outline-none transition-colors"
          style={{
            minHeight: '220px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
          }}
        />
        <span
          className="absolute bottom-3 right-4 text-xs tabular-nums pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        >
          {charCount.toLocaleString()} characters
        </span>
      </div>

      {/* Error */}
      {(state === 'error' || error) && (
        <div
          className="rounded-xl px-4 py-3 space-y-1.5"
          style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <div className="font-medium text-sm">⚠️ {error}</div>
          <div className="text-xs opacity-80">
            Try pasting more of your CV text, or make sure it includes your name, role, and skills.
            You can also try the &quot;Upload PDF&quot; tab instead.
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleParse}
        disabled={isEmpty}
        className="w-full py-3.5 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
        style={{ background: 'var(--accent)' }}
      >
        Parse with AI →
      </button>
    </div>
  )
}

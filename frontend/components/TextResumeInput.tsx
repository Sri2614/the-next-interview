'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveCustomResume } from '@/lib/session'
import { collectSSEEvents } from '@/lib/adk-client'
import type { MockResume } from '@/types/resume'

type ParseState = 'idle' | 'parsing' | 'done' | 'error'

export default function TextResumeInput() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [state, setState] = useState<ParseState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [parsedResume, setParsedResume] = useState<MockResume | null>(null)

  const charCount = text.length
  const isEmpty = charCount === 0

  async function handleParse() {
    if (isEmpty) return

    setState('parsing')
    setError(null)

    const ADK_URL = process.env.NEXT_PUBLIC_ADK_URL || 'https://the-next-interview-agents-379802788252.us-central1.run.app'
    const APP = 'text_resume_parser'
    const userId = 'user-1'
    const sessionId = `text-parse-${Date.now()}`

    try {
      // Create session
      await fetch(`${ADK_URL}/apps/${APP}/users/${userId}/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      // Call agent via SSE
      const events = await collectSSEEvents(`${ADK_URL}/run_sse`, {
        appName: APP,
        userId,
        sessionId,
        newMessage: {
          parts: [{ text }],
          role: 'user',
        },
      })

      // Find the parser event
      const parserEvent = [...events].reverse().find(
        (e) => e.author === 'text_resume_parser'
      )

      let resume: MockResume | null = null

      // Parse stateDelta.parsed_resume (triple-fallback pattern)
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

      // Fallback: content.parts text
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

      if (!resume?.name) throw new Error('Could not parse resume — please check your text and try again')

      // Ensure id is 'custom'
      resume.id = 'custom'

      saveCustomResume(resume)
      setParsedResume(resume)
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume text')
      setState('error')
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
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
            Match Against 23 Vacancies →
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

  // ── Input state ───────────────────────────────────────────────────────────
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
          disabled={state === 'parsing'}
          rows={10}
          className="w-full rounded-2xl px-5 py-4 text-sm resize-y outline-none transition-colors disabled:opacity-60"
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
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleParse}
        disabled={isEmpty || state === 'parsing'}
        className="w-full py-3.5 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
        style={{ background: 'var(--accent)' }}
      >
        {state === 'parsing' ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"
            />
            Parsing with AI…
          </span>
        ) : (
          'Parse with AI →'
        )}
      </button>
    </div>
  )
}

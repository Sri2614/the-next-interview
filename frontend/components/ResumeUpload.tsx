'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { MockResume } from '@/types/resume'
import { saveCustomResume } from '@/lib/session'
import { collectSSEEvents } from '@/lib/adk-client'

type UploadState = 'idle' | 'reading' | 'parsing' | 'done' | 'error'

export default function ResumeUpload() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [parsedResume, setParsedResume] = useState<MockResume | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.pdf')) {
      setError('Only PDF files are supported')
      return
    }

    // 10 MB limit (base64 encoding adds ~33% overhead, Document AI limit is 20 MB)
    const MAX_MB = 10
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_MB} MB.`)
      return
    }

    setState('reading')
    setError(null)

    try {
      // Step 1: Read file as base64
      const base64 = await fileToBase64(file)

      setState('parsing')

      // Step 2: Call resume_parser ADK agent
      const ADK_URL = process.env.NEXT_PUBLIC_ADK_URL || 'https://the-next-interview-agents-379802788252.us-central1.run.app'
      const APP = 'resume_parser'
      const userId = 'user-1'
      const sessionId = `resume-parse-${Date.now()}`

      // Create session — store base64 in state so agent tool can read it directly
      // (never pass large binary strings through LLM message text)
      await fetch(`${ADK_URL}/apps/${APP}/users/${userId}/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_base64: base64 }),
      })

      // Send simple trigger message — agent reads PDF from session state
      const events = await collectSSEEvents(`${ADK_URL}/run_sse`, {
        appName: APP,
        userId,
        sessionId,
        newMessage: {
          parts: [{ text: 'Parse the resume PDF.' }],
          role: 'user',
        },
      })

      // Find the resume_parser event
      const parserEvent = [...events].reverse().find(
        (e: { author?: string }) => e.author === 'resume_parser'
      )

      let resume: MockResume | null = null

      // Parse stateDelta.parsed_resume
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

      // Fallback to content.parts text
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

      // Ensure id is 'custom'
      resume.id = 'custom'

      saveCustomResume(resume)
      setParsedResume(resume)
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
        // Remove the data:application/pdf;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
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
        {/* Success header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'var(--accent-soft)' }}
          >
            ✅
          </div>
          <div>
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Resume parsed successfully</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Powered by Google Document AI + Gemini</div>
          </div>
        </div>

        {/* Parsed profile preview */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-base)' }}>
          <div>
            <div className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{parsedResume.name}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {parsedResume.role} · {parsedResume.yearsExperience}yr experience
            </div>
          </div>
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
            onClick={() => { setState('idle'); setParsedResume(null) }}
            className="px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            Re-upload
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
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

        {isLoading ? (
          <div className="space-y-3">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin mx-auto"
              style={{ borderColor: 'var(--accent-border)', borderTopColor: 'var(--accent)' }}
            />
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {state === 'reading' ? 'Reading PDF…' : 'Parsing with Document AI + Gemini…'}
            </div>
          </div>
        ) : (
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
        )}
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
    </div>
  )
}

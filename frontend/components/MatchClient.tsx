'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { MockResume } from '@/types/resume'
import type { Vacancy, MatchResult } from '@/types/vacancy'
import type { PrepSession } from '@/types/session'
import { savePrepSession, saveMatchCache, getMatchCache } from '@/lib/session'
import { collectSSEEvents } from '@/lib/adk-client'

const PROGRESS_STEPS = [
  'Connecting to AI agents…',
  'Loading job vacancies…',
  'Reading your profile…',
  'Scoring skills match…',
  'Evaluating experience fit…',
  'Checking tech stack overlap…',
  'Identifying skill gaps…',
  'Ranking results by score…',
  'Almost there…',
]

const RECOMMENDATION_STYLE = {
  strong:   { cssVar: 'var(--score-excellent)', label: 'Strong Match'  },
  good:     { cssVar: 'var(--score-good)',      label: 'Good Match'    },
  stretch:  { cssVar: 'var(--score-stretch)',   label: 'Stretch Role'  },
  mismatch: { cssVar: 'var(--score-mismatch)',  label: 'Poor Match'    },
}

interface Props {
  resume: MockResume
  vacancies: Vacancy[]
  autoStart?: boolean
}

export default function MatchClient({ resume, vacancies, autoStart = false }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [matchResults, setMatchResults] = useState<MatchResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'strong' | 'good' | 'stretch'>('all')
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStarted = useRef(false)

  // Auto-start matching when navigating from resume upload
  useEffect(() => {
    if (autoStart && !autoStarted.current && !matchResults) {
      autoStarted.current = true
      runMatching()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  // Cycle through progress messages while loading
  useEffect(() => {
    if (loading) {
      setProgressStep(0)
      progressInterval.current = setInterval(() => {
        setProgressStep(s => Math.min(s + 1, PROGRESS_STEPS.length - 1))
      }, 5000)
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
    return () => { if (progressInterval.current) clearInterval(progressInterval.current) }
  }, [loading])

  async function runMatching() {
    // Return cached results immediately if available
    const cached = getMatchCache(resume.id)
    if (cached) {
      setMatchResults(cached)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userId = 'user-1'
      const sessionId = `match-${resume.id}-${Date.now()}`
      const ADK_URL = process.env.NEXT_PUBLIC_ADK_URL || 'https://the-next-interview-agents-379802788252.us-central1.run.app'
      const APP = 'vacancy_matcher'

      // Create session
      await fetch(`${ADK_URL}/apps/${APP}/users/${userId}/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      // Send resume JSON in the message — agent reads it directly, no session state needed
      const resumeJson = JSON.stringify({
        id: resume.id,
        name: resume.name,
        role: resume.role,
        yearsExperience: resume.yearsExperience,
        skills: resume.skills,
        experience: resume.experience,
      })

      const events = await collectSSEEvents(`${ADK_URL}/run_sse`, {
        appName: APP,
        userId,
        sessionId,
        newMessage: {
          parts: [{ text: `Match this resume against all vacancies:\n${resumeJson}` }],
          role: 'user',
        },
      })

      // Find the LAST vacancy_matcher event (earlier ones are function calls with no text)
      let results: MatchResult[] = []
      const matcherEvent = [...events].reverse().find(
        (e: { author?: string }) => e.author === 'vacancy_matcher'
      )

      // --- Robust parsing: stateDelta can be a string OR already-parsed object ---
      const rawData = matcherEvent?.actions?.stateDelta?.match_results

      if (rawData !== undefined && rawData !== null) {
        if (typeof rawData === 'object' && Array.isArray(rawData.results)) {
          // Already a parsed JS object with results array
          results = rawData.results
        } else {
          // It's a string — try direct JSON.parse first, then regex fallback
          const rawStr = typeof rawData === 'string' ? rawData : JSON.stringify(rawData)
          try {
            const parsed = JSON.parse(rawStr)
            results = parsed.results ?? []
          } catch {
            const m = rawStr.match(/\{[\s\S]*"results"[\s\S]*\}/)
            if (m) { try { results = JSON.parse(m[0]).results ?? [] } catch { /* ignore */ } }
          }
        }
      }

      // Fallback: try reading from content.parts text
      if (results.length === 0) {
        const textFallback: string =
          matcherEvent?.content?.parts?.findLast((p: { text?: string }) => p.text)?.text ?? ''
        if (textFallback) {
          try {
            const parsed = JSON.parse(textFallback)
            results = parsed.results ?? []
          } catch {
            const m = textFallback.match(/\{[\s\S]*"results"[\s\S]*\}/)
            if (m) { try { results = JSON.parse(m[0]).results ?? [] } catch { /* ignore */ } }
          }
        }
      }

      // Sort by score descending and cache
      results.sort((a, b) => b.overallScore - a.overallScore)
      if (results.length === 0) throw new Error('No match results returned — please try again')
      saveMatchCache(resume.id, results)
      setMatchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to AI agents')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectVacancy(vacancy: Vacancy, match: MatchResult) {
    const session: PrepSession = {
      sessionId: `prep-${Date.now()}`,
      resumeId: resume.id,
      vacancyId: vacancy.id,
      matchResult: match,
      createdAt: new Date().toISOString(),
    }
    savePrepSession(session)
    router.push(`/prep/${vacancy.id}`)
  }

  const filteredResults = matchResults?.filter(r => {
    if (selectedFilter === 'all') return true
    return r.recommendation === selectedFilter
  })

  if (!matchResults) {
    return (
      <div className="space-y-6">
        {/* Resume summary card */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Your Profile</h3>
          <div className="flex flex-wrap gap-1.5">
            {[...resume.skills.languages, ...resume.skills.frameworks, ...resume.skills.tools].slice(0, 12).map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Loading skeleton cards */}
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-2" style={{ color: 'var(--text-secondary)' }}>
              <span className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
                style={{ borderColor: 'var(--accent-border)', borderTopColor: 'var(--accent)' }} />
              <span className="text-sm font-medium transition-all duration-500">
                {PROGRESS_STEPS[progressStep]}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-5 space-y-3 animate-pulse"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', animationDelay: `${i * 0.1}s` }}>
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 rounded w-3/4" style={{ background: 'var(--border)' }} />
                      <div className="h-3 rounded w-1/2" style={{ background: 'var(--border)' }} />
                    </div>
                    <div className="h-8 w-14 rounded" style={{ background: 'var(--border)' }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[0,1,2].map(j => (
                      <div key={j} className="h-10 rounded-lg" style={{ background: 'var(--bg-base)' }} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[0,1,2,3].map(j => (
                      <div key={j} className="h-5 w-16 rounded-full" style={{ background: 'var(--border)' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              ⚡ First analysis takes 30–60s · Results are cached for 24h
            </p>
          </div>
        )}

        {!loading && (
          <div className="text-center py-16 space-y-5">
            <div className="text-6xl">🤖</div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Ready to find your matches?</h2>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                Our AI will score {vacancies.length} vacancies against your profile.
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Takes ~30–60s · Cached for 24h after first run
              </p>
            </div>
            {error && (
              <div className="max-w-md mx-auto rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </div>
            )}
            <button
              onClick={runMatching}
              disabled={loading}
              className="px-10 py-4 rounded-xl text-white font-semibold text-lg transition-all disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {`Match Against ${vacancies.length} Vacancies →`}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'strong', 'good', 'stretch'] as const).map(f => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className="px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              style={selectedFilter === f
                ? { background: 'var(--accent)', color: 'white' }
                : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {f === 'all' ? `All (${matchResults.length})` : (
                <>{RECOMMENDATION_STYLE[f].label} ({matchResults.filter(r => r.recommendation === f).length})</>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sorted by match score ↓</p>
      </div>

      {/* Vacancy cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredResults?.map(match => {
          const vacancy = vacancies.find(v => v.id === match.vacancyId)
          if (!vacancy) return null
          const style = RECOMMENDATION_STYLE[match.recommendation] ?? RECOMMENDATION_STYLE.stretch

          return (
            <div
              key={match.vacancyId}
              className="rounded-2xl p-5 space-y-4 transition-all hover:scale-[1.01]"
              style={{ background: 'var(--bg-card)', border: `1px solid var(--border)`, borderLeft: `3px solid ${style.cssVar}` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{vacancy.title}</h3>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{vacancy.company} · {vacancy.location}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold" style={{ color: style.cssVar }}>{match.overallScore}%</div>
                  <div className="text-xs font-medium" style={{ color: style.cssVar }}>{style.label}</div>
                </div>
              </div>

              {/* Salary + industry */}
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>💰 {vacancy.salaryRange}</span>
                <span>🏢 {vacancy.industry}</span>
                <span>📅 {vacancy.requirements.yearsExperience}+ yrs required</span>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Skills', value: match.breakdown.skillsMatch },
                  { label: 'Experience', value: match.breakdown.experienceMatch },
                  { label: 'Tech Stack', value: match.breakdown.techStackMatch },
                ].map(s => (
                  <div key={s.label} className="rounded-lg p-2" style={{ background: 'var(--bg-base)' }}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.value}%</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tech chips */}
              <div className="flex flex-wrap gap-1.5">
                {vacancy.techStack.slice(0, 7).map(tech => {
                  const isMissing = match.missingSkills.includes(tech)
                  return (
                    <span
                      key={tech}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={isMissing
                        ? { background: 'rgba(239,68,68,0.10)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)' }
                        : { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                      }
                    >
                      {isMissing ? '✕ ' : '✓ '}{tech}
                    </span>
                  )
                })}
              </div>

              {/* Gap summary */}
              {match.missingSkills.length > 0 && (
                <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(217,119,6,0.08)', color: 'var(--warning)', border: '1px solid rgba(217,119,6,0.20)' }}>
                  Gap: {match.gapSummary}
                </p>
              )}

              <button
                onClick={() => handleSelectVacancy(vacancy, match)}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-colors"
                style={{ background: 'var(--accent)' }}
              >
                Prep for This Role →
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

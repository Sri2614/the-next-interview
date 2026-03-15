'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { PROBLEMS, type Problem } from '@/data/problems'

type Difficulty = 'all' | 'easy' | 'medium' | 'hard' | 'expert'
type Progress = Record<string, 'solved' | 'attempted'>

const DIFF_CONFIG = {
  easy:   { label: 'Easy',   color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.25)'  },
  medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.25)'  },
  hard:   { label: 'Hard',   color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
  expert: { label: 'Expert', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)' },
}

const CATEGORIES = ['All', 'Arrays', 'Strings', 'Trees', 'Graphs', 'Dynamic Programming', 'Hashing', 'Design', 'Sorting', 'Stack']

function StatusIcon({ status }: { status?: 'solved' | 'attempted' }) {
  if (status === 'solved')   return <span className="text-base">✅</span>
  if (status === 'attempted') return <span className="text-base">🟡</span>
  return <span className="text-base opacity-30">⚪</span>
}

function DiffBadge({ difficulty }: { difficulty: Problem['difficulty'] }) {
  const cfg = DIFF_CONFIG[difficulty]
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}

export default function PracticePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('all')
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [progress, setProgress] = useState<Progress>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tni_practice_progress')
      if (raw) setProgress(JSON.parse(raw))
    } catch {}
  }, [])

  const counts = useMemo(() => ({
    easy:   PROBLEMS.filter(p => p.difficulty === 'easy').length,
    medium: PROBLEMS.filter(p => p.difficulty === 'medium').length,
    hard:   PROBLEMS.filter(p => p.difficulty === 'hard').length,
    expert: PROBLEMS.filter(p => p.difficulty === 'expert').length,
    solved: Object.values(progress).filter(v => v === 'solved').length,
  }), [progress])

  const filtered = useMemo(() => {
    return PROBLEMS.filter(p => {
      if (difficulty !== 'all' && p.difficulty !== difficulty) return false
      if (category !== 'All' && !p.category.toLowerCase().includes(category.toLowerCase()) && !p.tags.some(t => t.toLowerCase().includes(category.toLowerCase()))) return false
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
      return true
    })
  }, [difficulty, category, search])

  const solvedPct = Math.round((counts.solved / PROBLEMS.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:opacity-80 transition-opacity">Home</Link>
          <span>→</span>
          <span style={{ color: 'var(--text-secondary)' }}>Practice</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Practice Library
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {PROBLEMS.length} curated problems · Monaco editor · Live code execution
            </p>
          </div>
          {/* Progress ring summary */}
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Progress</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {counts.solved} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/ {PROBLEMS.length}</span>
              </p>
            </div>
            {/* Mini progress bar */}
            <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${solvedPct}%`, background: 'var(--accent)' }}
              />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{solvedPct}%</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {(['easy', 'medium', 'hard', 'expert'] as const).map(d => {
          const cfg = DIFF_CONFIG[d]
          const solvedCount = PROBLEMS.filter(p => p.difficulty === d && progress[p.id] === 'solved').length
          return (
            <div
              key={d}
              className="p-3 rounded-xl text-center cursor-pointer transition-all hover:scale-105"
              style={{
                background: difficulty === d ? cfg.bg : 'var(--bg-card)',
                border: `1px solid ${difficulty === d ? cfg.border : 'var(--border)'}`,
              }}
              onClick={() => setDifficulty(difficulty === d ? 'all' : d)}
            >
              <p className="text-xl font-bold" style={{ color: cfg.color }}>{counts[d]}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{cfg.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{solvedCount} solved</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search problems…"
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />

        {/* Difficulty pills */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'easy', 'medium', 'hard', 'expert'] as const).map(d => {
            const cfg = d !== 'all' ? DIFF_CONFIG[d] : null
            const isActive = difficulty === d
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: isActive ? (cfg?.bg ?? 'var(--accent-soft)') : 'var(--bg-card)',
                  color: isActive ? (cfg?.color ?? 'var(--accent)') : 'var(--text-muted)',
                  border: `1px solid ${isActive ? (cfg?.border ?? 'var(--accent-border)') : 'var(--border)'}`,
                }}
              >
                {d === 'all' ? `All (${PROBLEMS.length})` : `${DIFF_CONFIG[d].label} (${counts[d]})`}
              </button>
            )
          })}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1 rounded-full text-xs transition-all"
              style={{
                background: category === cat ? 'var(--accent-soft)' : 'var(--bg-card)',
                color: category === cat ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${category === cat ? 'var(--accent-border)' : 'var(--border)'}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Problem count */}
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Showing {filtered.length} problem{filtered.length !== 1 ? 's' : ''}
        {difficulty !== 'all' || category !== 'All' || search ? ' (filtered)' : ''}
      </p>

      {/* Problem list */}
      <div className="space-y-2">
        {filtered.map((problem) => {
          const status = progress[problem.id]
          return (
            <Link
              key={problem.id}
              href={`/practice/${problem.id}`}
              className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01] group"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {/* Number */}
              <span className="text-xs font-mono w-6 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {PROBLEMS.indexOf(problem) + 1}
              </span>

              {/* Status icon */}
              <StatusIcon status={status} />

              {/* Title + tags */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-medium text-sm group-hover:opacity-90 transition-opacity"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {problem.title}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {problem.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Difficulty + category */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <DiffBadge difficulty={problem.difficulty} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{problem.category}</span>
              </div>

              {/* Arrow */}
              <span className="opacity-0 group-hover:opacity-50 transition-opacity text-sm" style={{ color: 'var(--text-muted)' }}>→</span>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No problems found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}

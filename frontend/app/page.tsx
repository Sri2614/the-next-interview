import Link from 'next/link'

const FEATURES = [
  { icon: '📄', title: 'Resume Matching', description: 'AI scores 20+ vacancies against your profile with skill gap breakdown and recommendation strength.' },
  { icon: '🎯', title: 'Tailored Questions', description: '15 interview questions crafted for your specific role, probing your exact skill gaps at 3 difficulty levels.' },
  { icon: '💻', title: 'Coding Challenges', description: 'Realistic coding tasks from your target industry with full step-by-step solutions and complexity analysis.' },
  { icon: '📊', title: 'Readiness Score', description: 'Answer questions, get AI feedback on every response, and receive an honest "Ready / Not Ready" verdict.' },
]

const AGENTS = [
  { n: 1, name: 'Resume Parser',      desc: 'Extracts skills & experience',   color: '#34d399' },
  { n: 2, name: 'Vacancy Matcher',    desc: 'Scores 20+ roles',               color: '#60a5fa' },
  { n: 3, name: 'Question Generator', desc: '15 tailored questions',           color: '#8b5cf6' },
  { n: 4, name: 'Code Challenge',     desc: 'Coding task + full solution',     color: '#f59e0b' },
  { n: 5, name: 'Answer Evaluator',   desc: 'Grades your responses',           color: '#f87171' },
  { n: 6, name: 'Readiness Assessor', desc: 'Final readiness report',          color: '#34d399' },
]

export default function HomePage() {
  return (
    <div className="space-y-24">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="text-center pt-16 space-y-7 relative">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium tracking-wide"
          style={{
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)',
          }}
        >
          ⚡ Powered by Google ADK + Gemini 2.5
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-bold tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Stop guessing.<br />
          <span className="gradient-text">Know</span>{' '}
          <span style={{ color: 'var(--text-primary)' }}>you&apos;re ready.</span>
        </h1>

        <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
          Match your resume to real vacancies, practice with AI-generated questions tailored to your gaps,
          and get an honest readiness verdict before your interview.
        </p>

        <div className="flex items-center justify-center gap-4 pt-1">
          <Link
            href="/resume"
            className="btn-accent px-8 py-3 rounded-xl text-white font-semibold text-base"
          >
            Start Preparing →
          </Link>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Takes ~2 minutes</span>
        </div>

        {/* Shine divider */}
        <div className="shine-divider max-w-xs mx-auto mt-10" />
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-center mb-10" style={{ color: 'var(--text-muted)' }}>
          Everything you need
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="card-hover rounded-2xl p-6 space-y-3"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Agent pipeline ───────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-8"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Architecture
          </p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            6-Agent AI Pipeline
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Built with Google ADK · Orchestrated by Gemini 2.5</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AGENTS.map(a => (
            <div
              key={a.name}
              className="rounded-xl p-4 text-center space-y-2.5"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mx-auto"
                style={{ background: `${a.color}18`, color: a.color, border: `1px solid ${a.color}30` }}
              >
                {a.n}
              </div>
              <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{a.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="text-center pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--text-muted)' }}>
          Get started
        </p>
        <h2
          className="text-3xl font-bold mb-4"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Ready to prepare smarter?
        </h2>
        <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Select a resume and get your first AI readiness score in minutes.
        </p>
        <Link
          href="/resume"
          className="btn-accent px-10 py-3.5 rounded-xl text-white font-semibold inline-block"
        >
          Choose Your Resume →
        </Link>
      </section>

    </div>
  )
}

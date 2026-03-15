'use client'

import { useAuth } from '@/contexts/AuthContext'

interface AuthGateProps {
  children: React.ReactNode
  feature?: string
  description?: string
}

export default function AuthGate({
  children,
  feature = 'Interview Prep',
  description = 'Personalised AI questions, live code execution, and your progress saved across all your devices.',
}: AuthGateProps) {
  const { user, loading, signInWithGoogle } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)' }} />
      </div>
    )
  }

  if (user) return <>{children}</>

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Lock icon + glow */}
      <div className="relative mb-8">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.08))',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 0 40px rgba(139,92,246,0.15)',
          }}
        >
          🔒
        </div>
        <div
          className="absolute -inset-4 rounded-3xl opacity-20 blur-xl"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent)' }}
        />
      </div>

      <h2 className="text-2xl font-bold text-center mb-3" style={{ color: 'var(--text-primary)' }}>
        Sign in to access {feature}
      </h2>
      <p className="text-center max-w-md mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>

      {/* Benefits list */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 w-full max-w-xl">
        {[
          { icon: '🎯', title: 'Personalized Questions', desc: 'AI tailors 15 questions to your exact skill gaps' },
          { icon: '💻', title: 'Live Code Execution', desc: 'Write and run code against real test cases' },
          { icon: '📊', title: 'Progress Tracking', desc: 'Your prep history saved and synced across devices' },
        ].map((b) => (
          <div
            key={b.title}
            className="p-4 rounded-xl text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="text-2xl mb-2">{b.icon}</div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{b.title}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-3 px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:scale-105 hover:shadow-lg"
        style={{
          background: 'white',
          color: '#1f1f1f',
          boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
        }}
      >
        {/* Google SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        Free forever · No credit card required
      </p>
    </div>
  )
}

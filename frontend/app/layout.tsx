import type { Metadata } from 'next'
import Link from 'next/link'
import { ThemeProvider, ThemeToggle } from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Next Interview',
  description: 'AI-powered interview preparation — match vacancies, practice questions, know when you\'re ready.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash: apply saved theme before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('tni-theme');if(t)document.documentElement.setAttribute('data-theme',t);})()` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <ThemeProvider>
          <nav
            className="sticky top-0 z-50"
            style={{
              background: 'var(--nav-bg)',
              borderBottom: '1px solid var(--border)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2.5 font-semibold text-base tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    boxShadow: '0 0 12px rgba(139,92,246,0.35)',
                  }}
                >
                  ⚡
                </span>
                <span>The Next Interview</span>
              </Link>

              <div className="flex items-center gap-4 text-sm">
                <Link href="/resume" className="nav-link">Resumes</Link>
                <ThemeToggle />
                <Link
                  href="/resume"
                  className="btn-accent px-4 py-1.5 rounded-lg text-white text-sm font-medium"
                >
                  Start Prep →
                </Link>
              </div>
            </div>
          </nav>
          <main className="max-w-6xl mx-auto px-4 py-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}

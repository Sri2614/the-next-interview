'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Custom fallback UI. Defaults to a generic error card with a retry button. */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary — catches render-time exceptions in child components
 * and shows a recoverable error card instead of a white screen crash.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <PrepClient vacancy={vacancy} />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to console so devs can see it; replace with Sentry/Datadog when ready
    console.error('[ErrorBoundary] Render error:', error.message, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          className="rounded-2xl p-8 text-center space-y-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-4xl">⚠️</div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Something went wrong
            </p>
            <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
              {this.state.error?.message ?? 'An unexpected error occurred while rendering this section.'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            ↻ Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

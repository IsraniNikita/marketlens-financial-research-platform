'use client'

import { Component, useState, useCallback } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  reset() {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-panel border border-border rounded-xl">
          <div className="w-12 h-12 rounded-full bg-negative/10 text-negative flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-muted text-sm mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.reset}
            className="px-4 py-2 rounded bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Lightweight error boundary hook wrapper for functional components.
 * Catches render-phase errors in the wrapped subtree.
 */
export function withErrorBoundary(Component) {
  return function WithErrorBoundary(props) {
    const [hasError, setHasError] = useState(false)
    const [error, setError] = useState(null)

    const reset = useCallback(() => {
      setHasError(false)
      setError(null)
    }, [])

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-panel border border-border rounded-xl">
          <div className="w-12 h-12 rounded-full bg-negative/10 text-negative flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-muted text-sm mb-6 max-w-md">{error?.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={reset}
            className="px-4 py-2 rounded bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }

    return (
      <ErrorBoundary reset={reset}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

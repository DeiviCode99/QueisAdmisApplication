import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-red-50 p-4 rounded-[14px] mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="bg-white p-3 rounded-[10px] shadow-[inset_2px_2px_6px_rgba(239,68,68,0.04)]">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
          </div>
          <h2 className="text-lg font-heading font-semibold text-brand-800 mb-2">Algo salió mal</h2>
          <p className="text-sm text-brand-500 mb-6 max-w-md">
            Ocurrió un error inesperado. Intenta de nuevo o recarga la página.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="clay-btn px-4 py-2 bg-gradient-to-b from-brand-400 to-brand-500 text-white font-medium"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="clay-btn-secondary px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

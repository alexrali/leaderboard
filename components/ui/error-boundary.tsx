"use client"

import { Component, type ReactNode, type ErrorInfo } from "react"
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional section title shown in the fallback UI. */
  title?: string
  /** Custom fallback UI. If provided, the default fallback is not used. */
  fallback?: ReactNode
  /** Additional CSS class for the fallback container. */
  className?: string
  /** Callback fired when an error is caught. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React error boundary that catches rendering errors in child components
 * and displays a fallback UI instead of crashing the whole page.
 *
 * Wraps individual page sections so one failing widget does not
 * break the entire dashboard.
 *
 * @example
 * <ErrorBoundary title="Sales Chart">
 *   <SalesChart data={data} />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          data-slot="error-boundary"
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border p-8 text-center",
            this.props.className
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <AlertTriangleIcon className="size-5" />
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <p className="text-sm font-medium">
              {this.props.title
                ? `Error en ${this.props.title}`
                : "Algo sali\u00f3 mal"}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              No se pudo cargar esta secci\u00f3n. Intenta recargar.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
          >
            <RotateCcwIcon className="size-3.5" />
            Reintentar
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }
export type { ErrorBoundaryProps }

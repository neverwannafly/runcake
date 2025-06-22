import React, { Suspense, lazy } from 'react'

// Enhanced loading component with skeleton
export const PageLoader = ({ minimal = false }) => {
  if (minimal) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-6 p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
          <p className="text-sm text-gray-500">Please wait while we load the page</p>
        </div>
        {/* Skeleton loader */}
        <div className="w-full max-w-md space-y-3">
          <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
          <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  )
}

// Error boundary for lazy loaded components
export class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We encountered an error while loading this page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Enhanced lazy wrapper with error boundary
export const LazyWrapper = ({ children, minimal = false }) => (
  <LazyErrorBoundary>
    <Suspense fallback={<PageLoader minimal={minimal} />}>
      {children}
    </Suspense>
  </LazyErrorBoundary>
)

// Preload function for critical routes
export const preloadRoute = (importFunction) => {
  const componentImport = importFunction()
  return componentImport
}

// Lazy load with retry mechanism
export const lazyWithRetry = (importFunction, name) => {
  return lazy(() => 
    importFunction().catch(error => {
      console.error(`Failed to load ${name}:`, error)
      // Retry once after a delay
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(importFunction())
        }, 1000)
      })
    })
  )
}

// Preload critical components on app start
export const preloadCriticalComponents = () => {
  // Preload the most commonly used pages
  const criticalImports = [
    () => import('../pages/ScriptsPage'),
    () => import('../pages/LoginPage'),
    () => import('../pages/ScriptViewPage'),
  ]

  // Start preloading after a short delay to not block initial render
  setTimeout(() => {
    criticalImports.forEach(importFn => {
      importFn().catch(error => {
        console.warn('Failed to preload component:', error)
      })
    })
  }, 2000)
} 
// Performance monitoring utilities

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = new Map()
  }

  // Start timing a lazy load operation
  startTiming(key) {
    this.metrics.set(key, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    })
  }

  // End timing and calculate duration
  endTiming(key) {
    const metric = this.metrics.get(key)
    if (metric) {
      metric.endTime = performance.now()
      metric.duration = metric.endTime - metric.startTime
      
      // Log slow loading components (> 1 second)
      if (metric.duration > 1000) {
        console.warn(`Slow lazy load detected for ${key}: ${metric.duration.toFixed(2)}ms`)
      }
    }
    return metric
  }

  // Get performance metrics
  getMetrics() {
    return Array.from(this.metrics.entries()).map(([key, metric]) => ({
      component: key,
      ...metric
    }))
  }

  // Get average load time
  getAverageLoadTime() {
    const metrics = this.getMetrics().filter(m => m.duration !== null)
    if (metrics.length === 0) return 0
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / metrics.length
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear()
  }

  // Monitor bundle size impact
  monitorBundleSize() {
    if ('connection' in navigator) {
      const connection = navigator.connection
      console.log('Network info:', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      })
    }
  }

  // Report performance to console (dev mode)
  reportPerformance() {
    if (process.env.NODE_ENV === 'development') {
      const metrics = this.getMetrics()
      const avgTime = this.getAverageLoadTime()
      
      console.group('🚀 Lazy Loading Performance Report')
      console.log('Average load time:', avgTime.toFixed(2) + 'ms')
      console.log('Total components loaded:', metrics.length)
      console.table(metrics)
      console.groupEnd()
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Enhanced lazy loading with performance monitoring
export const withPerformanceMonitoring = (importFunction, componentName) => {
  return () => {
    performanceMonitor.startTiming(componentName)
    
    return importFunction()
      .then(module => {
        performanceMonitor.endTiming(componentName)
        return module
      })
      .catch(error => {
        performanceMonitor.endTiming(componentName)
        throw error
      })
  }
}

// Web Vitals monitoring
export const monitorWebVitals = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Monitor Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      console.log('LCP:', lastEntry.startTime)
      
      // Report slow LCP
      if (lastEntry.startTime > 2500) {
        console.warn('Slow LCP detected:', lastEntry.startTime + 'ms')
      }
    })
    
    observer.observe({ type: 'largest-contentful-paint', buffered: true })

    // Monitor First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        console.log('FID:', entry.processingStart - entry.startTime)
      })
    })
    
    fidObserver.observe({ type: 'first-input', buffered: true })

    // Monitor Cumulative Layout Shift (CLS)
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      console.log('CLS:', clsValue)
    })
    
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  }
}

// Resource loading monitoring
export const monitorResourceLoading = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource')
      const jsResources = resources.filter(r => r.name.includes('.js'))
      const cssResources = resources.filter(r => r.name.includes('.css'))
      
      console.group('📦 Resource Loading Report')
      console.log('Total JS files:', jsResources.length)
      console.log('Total CSS files:', cssResources.length)
      console.log('Largest JS file:', Math.max(...jsResources.map(r => r.transferSize || 0)) + ' bytes')
      console.groupEnd()
    })
  }
}

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'development') {
    monitorWebVitals()
    monitorResourceLoading()
    performanceMonitor.monitorBundleSize()
    
    // Report performance after 10 seconds
    setTimeout(() => {
      performanceMonitor.reportPerformance()
    }, 10000)
  }
} 
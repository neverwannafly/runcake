import { useState, useEffect, useRef } from 'react'

// Hook for lazy loading components when they come into view
export const useLazyLoad = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const elementRef = useRef(null)

  const defaultOptions = {
    root: null,
    rootMargin: '100px', // Start loading 100px before element is visible
    threshold: 0.1,
    ...options
  }

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true)
          setHasLoaded(true)
          // Once loaded, we can disconnect the observer
          observer.disconnect()
        }
      },
      defaultOptions
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [hasLoaded])

  return [elementRef, isIntersecting || hasLoaded]
}

// Hook for lazy loading images
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [imageRef, isVisible] = useLazyLoad()

  useEffect(() => {
    if (isVisible && src) {
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
      }
      img.src = src
    }
  }, [isVisible, src])

  return [imageRef, imageSrc]
}

// Component wrapper for lazy loading
export const LazyComponent = ({ 
  children, 
  fallback = <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
  ...options 
}) => {
  const [ref, isVisible] = useLazyLoad(options)

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  )
}

// Hook for lazy loading data/API calls
export const useLazyData = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ref, isVisible] = useLazyLoad()

  useEffect(() => {
    if (isVisible && !data && !loading) {
      setLoading(true)
      setError(null)
      
      fetchFunction()
        .then(result => {
          setData(result)
          setError(null)
        })
        .catch(err => {
          setError(err)
          console.error('Lazy data loading error:', err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isVisible, ...dependencies])

  return [ref, { data, loading, error }]
} 
// Hook pour récupérer des données en temps réel (polling)
import { useState, useEffect, useCallback } from 'react'

export function usePolling(fetchFn, fallback, interval = 15000) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    try {
      const result = await fetchFn()
      setData(result)
      setError(null)
    } catch (e) {
      setError(e)
      if (!data) setData(fallback)
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, interval)
    return () => clearInterval(id)
  }, [fetch, interval])

  return { data: data ?? fallback, loading, error, refetch: fetch }
}
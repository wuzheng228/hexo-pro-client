import { useCallback, useEffect, useState } from 'react'
import service from '@/utils/api'

type FirstUseResult = {
  isFirstUse: boolean | null
  loading: boolean
  error: unknown
  refresh: () => Promise<void>
}

export function useFirstUse(): FirstUseResult {
  const [isFirstUse, setIsFirstUse] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await service.get('/hexopro/api/settings/check-first-use')
      if (res?.data?.code === 0) {
        setIsFirstUse(!!res.data.data?.isFirstUse)
        return
      }
      setIsFirstUse(null)
      setError(new Error(res?.data?.msg || 'check-first-use failed'))
    } catch (e) {
      setIsFirstUse(null)
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { isFirstUse, loading, error, refresh }
}


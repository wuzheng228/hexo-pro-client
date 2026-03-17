import { useCallback, useEffect, useState } from 'react'
import { getLinkRedirectSettings, updateLinkRedirectSettings } from '@/utils/desktopUtils'

type LinkRedirectState = {
  enabled: boolean
  domain: string
  setEnabled: (enabled: boolean) => void
  setDomain: (domain: string) => void
  persist: (next?: { enabled?: boolean; domain?: string }) => void
}

export function useLinkRedirectSettingsState(): LinkRedirectState {
  const [enabled, setEnabled] = useState(false)
  const [domain, setDomain] = useState('http://localhost:4000')

  useEffect(() => {
    const settings = getLinkRedirectSettings()
    setEnabled(!!settings.enabled)
    setDomain(settings.domain || 'http://localhost:4000')
  }, [])

  const persist = useCallback(
    (next?: { enabled?: boolean; domain?: string }) => {
      const finalEnabled = next?.enabled ?? enabled
      const finalDomain = next?.domain ?? domain
      updateLinkRedirectSettings(finalEnabled, finalDomain)
    },
    [domain, enabled],
  )

  return { enabled, domain, setEnabled, setDomain, persist }
}


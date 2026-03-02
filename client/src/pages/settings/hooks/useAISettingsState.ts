import { useCallback, useEffect, useRef, useState } from 'react'
import { AISettings, getAISettings, saveAISettings } from '@/utils/aiSettings'

type UseAISettingsStateResult = {
  aiSettings: AISettings
  loading: boolean
  updateAISetting: <K extends keyof AISettings>(key: K, value: AISettings[K]) => void
}

/**
 * 从后端获取/保存 AI 配置，保存时去抖避免频繁请求
 */
export function useAISettingsState(onSaved?: () => void): UseAISettingsStateResult {
  const [aiSettings, setAiSettings] = useState<AISettings>({
    url: '',
    apiKey: '',
    model: '',
    enableThinking: false,
    maxTokens: 4000,
    temperature: 0.7,
    topP: 0.9,
    systemPrompt: '',
  })
  const [loading, setLoading] = useState(true)
  const saveTimerRef = useRef<number | null>(null)
  const pendingRef = useRef<AISettings | null>(null)

  useEffect(() => {
    let cancelled = false
    getAISettings()
      .then((data) => {
        if (!cancelled) {
          setAiSettings(data)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    const toSave = pendingRef.current
    pendingRef.current = null
    if (toSave) {
      saveAISettings(toSave)
        .then(() => onSaved?.())
        .catch((err) => console.error('保存 AI 设置失败:', err))
    }
  }, [onSaved])

  useEffect(() => () => flushSave(), [flushSave])

  const updateAISetting = useCallback(
    <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
      setAiSettings((prev) => {
        const next = { ...prev, [key]: value }
        pendingRef.current = next
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = window.setTimeout(flushSave, 600)
        return next
      })
    },
    [flushSave],
  )

  return { aiSettings, loading, updateAISetting }
}

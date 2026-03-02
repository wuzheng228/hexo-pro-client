import service from './api'

/** 默认系统提示词（与后端一致，用于恢复默认） */
export const DEFAULT_SYSTEM_PROMPT = `你是一位专业的 Hexo 博客创作助手。你的任务是帮助用户撰写、润色和优化博客文章。

请遵循以下原则：
1. 使用清晰、专业的写作风格
2. 根据用户需求提供结构化的内容建议
3. 支持 Markdown 格式输出
4. 若用户提供上下文（如标题、大纲），请围绕其展开
5. 回复简洁实用，避免冗长开场白`

export interface AISettings {
  url: string
  apiKey: string
  model: string
  enableThinking: boolean
  maxTokens: number
  temperature: number
  topP: number
  systemPrompt: string
}

const DEFAULT_AI_SETTINGS: AISettings = {
  url: '',
  apiKey: '',
  model: '',
  enableThinking: false,
  maxTokens: 4000,
  temperature: 0.7,
  topP: 0.9,
  systemPrompt: '',
}

/**
 * 从后端获取 AI 配置
 */
export async function getAISettings(): Promise<AISettings> {
  try {
    const res = await service.get('/hexopro/api/ai/settings')
    const data = res?.data?.data
    if (data && res?.data?.code === 0) {
      return {
        ...DEFAULT_AI_SETTINGS,
        ...data,
      }
    }
  } catch (error) {
    console.error('Failed to fetch AI settings:', error)
  }
  return DEFAULT_AI_SETTINGS
}

/**
 * 保存 AI 配置到后端
 */
export async function saveAISettings(settings: Partial<AISettings>): Promise<void> {
  const res = await service.post('/hexopro/api/ai/settings/save', settings)
  if (res?.data?.code !== 0) {
    throw new Error(res?.data?.msg || '保存 AI 设置失败')
  }
}

/**
 * 检查 AI 是否已配置（需异步获取）
 */
export async function isAISConfigured(): Promise<boolean> {
  const settings = await getAISettings()
  return !!(settings.url && settings.apiKey && settings.model)
}

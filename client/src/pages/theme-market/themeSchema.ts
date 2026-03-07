import { get, set } from 'lodash'

/**
 * 通用 YAML 配置 Schema 生成工具
 * 支持自动推导 + YAML 注释元数据
 */

export type FieldType = 'input' | 'textarea' | 'switch' | 'number' | 'select' | 'color' | 'collapse'

export interface SchemaMetadata {
  type?: FieldType
  label?: string
  placeholder?: string
  description?: string
  options?: { value: string | number | boolean; label: string }[]
  hidden?: boolean
  [key: string]: unknown
}

export interface SchemaField {
  key: string
  type: FieldType
  label: string
  placeholder?: string
  description?: string
  options?: { value: string | number | boolean; label: string }[]
  default?: unknown
}

export interface SchemaGroup {
  key: string
  label: string
  fields: SchemaField[]
}

/**
 * 从值推断字段类型
 */
function inferFieldType(value: unknown): FieldType {
  if (typeof value === 'boolean') return 'switch'
  if (typeof value === 'number') return 'number'

  if (typeof value === 'string') {
    // 颜色值
    if (/^#[0-9a-f]{3,8}$/i.test(value)) return 'color'
    // URL
    if (/^https?:\/\/.+/i.test(value)) return 'input'
    // 邮箱
    if (/.+@.+\..+/.test(value)) return 'input'
    // 长文本
    if (value.includes('\n')) return 'textarea'
    if (value.length > 100) return 'textarea'
    return 'input'
  }

  if (Array.isArray(value)) return 'textarea'

  if (typeof value === 'object' && value !== null) return 'collapse'

  return 'input'
}

/**
 * 将 key 转换为用户友好的标签
 * avatar.img -> Avatar Image
 * enable_theme_color -> Enable Theme Color
 */
export function keyToLabel(key: string): string {
  return key
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * 解析 YAML 注释中的 schema 元数据
 * 格式: # schema: {type: "input", label: "Avatar URL", placeholder: "https://..."}
 */
export function extractSchemaMetadata(yamlContent: string, key: string): SchemaMetadata | null {
  try {
    const lines = yamlContent.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // 查找是否在当前行或下一行有 schema 元数据
      const schemaMatch = line.match(/#\s*schema:\s*({.*?})\s*$/)
      if (schemaMatch) {
        const jsonStr = schemaMatch[1]
        // 检查这是否是针对当前 key 的
        if (i + 1 < lines.length && lines[i + 1].includes(key)) {
          return JSON.parse(jsonStr)
        }
      }
      // 也检查同一行的 key
      if (line.includes(key)) {
        const schemaMatch = line.match(/#\s*schema:\s*({.*?})\s*$/)
        if (schemaMatch) {
          return JSON.parse(schemaMatch[1])
        }
      }
    }
  } catch {
    // ignore parse error
  }
  return null
}

/**
 * 从 YAML 对象生成 schema
 * @param config - 解析后的 YAML 对象
 * @param yamlContent - 原始 YAML 内容（用于提取注释元数据）
 * @param options - 配置选项
 */
export function generateSchemaFromYaml(
  config: Record<string, unknown>,
  yamlContent?: string,
  options?: {
    maxDepth?: number
    maxFieldsPerGroup?: number
  }
): SchemaGroup[] {
  const maxDepth = options?.maxDepth ?? 3
  const maxFieldsPerGroup = options?.maxFieldsPerGroup ?? 20

  const schema: SchemaGroup[] = []
  const visitedKeys = new Set<string>()

  function isComplexObject(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.keys(value as Record<string, unknown>).length > 0
    )
  }

  function processObject(obj: Record<string, unknown>, prefix = '', depth = 0): SchemaField[] {
    if (depth > maxDepth) return []

    const fields: SchemaField[] = []

    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key

      // 跳过已处理过的键
      if (visitedKeys.has(fullKey)) return
      visitedKeys.add(fullKey)

      // 嵌套对象
      if (isComplexObject(value)) {
        // 递归处理嵌套对象
        const nestedFields = processObject(value as Record<string, unknown>, fullKey, depth + 1)
        fields.push(...nestedFields)
      } else {
        // 获取注释元数据（可选）
        const metadata = yamlContent ? extractSchemaMetadata(yamlContent, key) : null

        const field: SchemaField = {
          key: fullKey,
          type: metadata?.type ?? inferFieldType(value),
          label: metadata?.label ?? keyToLabel(key),
          placeholder: metadata?.placeholder,
          description: metadata?.description,
          default: value,
        }

        // 处理 select 选项
        if (metadata?.options) {
          field.options = metadata.options
        }

        // 隐藏字段
        if (metadata?.hidden) {
          return
        }

        fields.push(field)
      }
    })

    return fields
  }

  // 处理顶级对象
  const allFields = processObject(config)

  // 按首层 key 分组
  const groupMap = new Map<string, SchemaField[]>()

  allFields.forEach((field) => {
    const groupKey = field.key.split('.')[0]
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, [])
    }
    groupMap.get(groupKey)!.push(field)
  })

  // 构建 schema
  groupMap.forEach((fields, groupKey) => {
    // 限制每组字段数量
    const displayFields = fields.slice(0, maxFieldsPerGroup)

    schema.push({
      key: groupKey,
      label: keyToLabel(groupKey),
      fields: displayFields,
    })
  })

  return schema
}

/**
 * 提取嵌套值，支持社交链接等特殊格式
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const val = get(obj, path)
  if (val === undefined || val === null) return ''

  // 社交链接特殊处理（对象转为多行文本）
  if (typeof val === 'object' && !Array.isArray(val) && path.includes('social')) {
    return Object.entries(val as Record<string, string>)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
  }

  return val
}

/**
 * 设置嵌套值
 */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  if (path.includes('social') && typeof value === 'string') {
    const social: Record<string, string> = {}
    value.split('\n').forEach((line) => {
      const match = line.match(/^([^:]+):\s*(.+)$/)
      if (match) {
        const [, name, rest] = match
        if (name) social[name.trim()] = rest.trim()
      }
    })
    set(obj, path, Object.keys(social).length > 0 ? social : undefined)
  } else {
    set(obj, path, value === '' ? undefined : value)
  }
}

/**
 * 合并两个 schema（用于覆盖）
 */
export function mergeSchemas(autoSchema: SchemaGroup[], customSchema: SchemaGroup[]): SchemaGroup[] {
  const customMap = new Map(customSchema.map((g) => [g.key, g]))

  return autoSchema.map((group) => {
    const custom = customMap.get(group.key)
    return custom ? custom : group
  })
}

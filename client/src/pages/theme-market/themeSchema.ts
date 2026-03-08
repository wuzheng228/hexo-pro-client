import { get, set } from 'lodash'

/**
 * 通用 YAML 配置 Schema 生成工具
 * 支持自动推导 + YAML 注释元数据
 */

export type FieldType = 'input' | 'textarea' | 'switch' | 'number' | 'select' | 'color' | 'collapse'

const FIELD_TYPE_MAP: Record<string, FieldType> = {
  input: 'input',
  textarea: 'textarea',
  switch: 'switch',
  number: 'number',
  select: 'select',
  color: 'color',
  collapse: 'collapse',
  url: 'input',
  email: 'input',
  text: 'input',
  string: 'input',
  boolean: 'switch',
  object: 'collapse',
}

function normalizeFieldType(type: string | undefined): FieldType | undefined {
  if (!type) return undefined
  return FIELD_TYPE_MAP[type.toLowerCase()] ?? 'input'
}

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
 * 格式: # schema: {"type": "input", "label": "Avatar URL", "placeholder": "https://..."}
 *
 * @param yamlContent - 原始 YAML 内容
 * @param fullKey - 完整的路径 key（如 "site_info.title"）
 */
export function extractSchemaMetadata(yamlContent: string, fullKey: string): SchemaMetadata | null {
  try {
    const lines = yamlContent.split('\n')
    const leafKey = fullKey.includes('.') ? fullKey.split('.').pop()! : fullKey

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // 查找 schema 注释行
      const schemaMatch = line.match(/#\s*schema:\s*(\{.*\})\s*$/)
      if (!schemaMatch) continue

      const jsonStr = schemaMatch[1]

      // 检查下一行是否是该字段的定义行
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const keyMatch = nextLine.match(/^\s*([\w.-]+)\s*:/)
        if (keyMatch && keyMatch[1] === leafKey) {
          const parsed = JSON.parse(jsonStr)
          if (parsed.type) {
            parsed.type = normalizeFieldType(parsed.type)
          }
          return parsed
        }
      }
    }
  } catch {
    // ignore parse error
  }
  return null
}

/**
 * Schema JSON 格式：{ "path.to.key": { type, label, placeholder?, description?, options? } }
 */
export type SchemaJson = Record<string, SchemaMetadata>

/**
 * 从 schema JSON 中获取指定 key 的元数据
 */
export function getSchemaMetadataFromJson(schemaJson: SchemaJson | null | undefined, fullKey: string): SchemaMetadata | null {
  if (!schemaJson || typeof schemaJson !== 'object') return null
  return schemaJson[fullKey] ?? null
}

/**
 * 规范化 options 格式（支持字符串数组或 {value, label}[]）
 */
function normalizeOptions(opts: unknown): { value: string | number | boolean; label: string }[] | undefined {
  if (!Array.isArray(opts)) return undefined
  return opts.map((o) => {
    if (typeof o === 'object' && o !== null && 'value' in o && 'label' in o) {
      return o as { value: string | number | boolean; label: string }
    }
    const v = String(o)
    return { value: v, label: v }
  })
}

/**
 * 从 YAML 对象生成 schema
 * @param config - 解析后的 YAML 对象
 * @param yamlContent - 原始 YAML 内容（用于提取注释元数据，兼容旧版）
 * @param options - 配置选项，schemaJson 为独立 schema 文件（优先使用）
 */
export function generateSchemaFromYaml(
  config: Record<string, unknown>,
  yamlContent?: string,
  options?: {
    maxDepth?: number
    maxFieldsPerGroup?: number
    schemaJson?: SchemaJson | null
  }
): SchemaGroup[] {
  const maxDepth = options?.maxDepth ?? 3
  const maxFieldsPerGroup = options?.maxFieldsPerGroup ?? 20
  const schemaJson = options?.schemaJson

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

      if (visitedKeys.has(fullKey)) return
      visitedKeys.add(fullKey)

      if (isComplexObject(value)) {
        const nestedFields = processObject(value as Record<string, unknown>, fullKey, depth + 1)
        fields.push(...nestedFields)
      } else {
        // 优先从 schemaJson 获取，其次从 YAML 注释
        const metadata =
          getSchemaMetadataFromJson(schemaJson, fullKey) ??
          (yamlContent ? extractSchemaMetadata(yamlContent, fullKey) : null)

        const field: SchemaField = {
          key: fullKey,
          type: normalizeFieldType(metadata?.type) ?? inferFieldType(value),
          label: metadata?.label ?? keyToLabel(key),
          placeholder: metadata?.placeholder,
          description: metadata?.description,
          default: value,
        }

        if (metadata?.options) {
          field.options = normalizeOptions(metadata.options) ?? (metadata.options as SchemaField['options'])
        }

        if (metadata?.hidden) {
          return
        }

        fields.push(field)
      }
    })

    return fields
  }

  const allFields = processObject(config)

  const groupMap = new Map<string, SchemaField[]>()
  allFields.forEach((field) => {
    const groupKey = field.key.split('.')[0]
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, [])
    }
    groupMap.get(groupKey)!.push(field)
  })

  groupMap.forEach((fields, groupKey) => {
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

/**
 * 在原始 YAML 中原地替换叶子字段的值，保留所有注释和格式
 * 这比 yaml.dump() 好得多，因为 dump 会丢掉所有注释
 */
export function updateYamlValues(
  originalYaml: string,
  changes: Record<string, unknown>
): string {
  let result = originalYaml
  const lines = result.split('\n')

  for (const [dotPath, newValue] of Object.entries(changes)) {
    const parts = dotPath.split('.')
    const leafKey = parts[parts.length - 1]

    // 在 YAML 中查找该 key 并替换其值
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // 匹配 "  key: value" 或 "key: value" 格式
      const match = line.match(new RegExp(`^(\\s*${escapeRegex(leafKey)}\\s*:\\s*)(.*)$`))
      if (!match) continue

      // 验证路径正确：检查父级缩进
      if (parts.length > 1 && !verifyYamlPath(lines, i, parts)) continue

      // 格式化新值
      const formattedValue = formatYamlValue(newValue)
      lines[i] = match[1] + formattedValue
      break
    }
  }

  return lines.join('\n')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatYamlValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') {
    if (value === '') return "''"
    if (/[:#{}[\],&*?|>!%@`]/.test(value) || value.includes('\n')) {
      return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    }
    return value
  }
  return String(value)
}

/**
 * 验证在 YAML 中某行是否属于指定的嵌套路径
 */
function verifyYamlPath(lines: string[], lineIdx: number, parts: string[]): boolean {
  if (parts.length <= 1) return true

  const targetIndent = (lines[lineIdx].match(/^\s*/) || [''])[0].length

  // 向上查找父级 key
  for (let depth = parts.length - 2; depth >= 0; depth--) {
    const parentKey = parts[depth]
    let found = false

    for (let j = lineIdx - 1; j >= 0; j--) {
      const prevLine = lines[j]
      const prevIndent = (prevLine.match(/^\s*/) || [''])[0].length

      // 找到缩进更小的行（父级）
      if (prevIndent < targetIndent) {
        const parentMatch = prevLine.match(/^\s*([\w.-]+)\s*:/)
        if (parentMatch && parentMatch[1] === parentKey) {
          found = true
          break
        }
        break
      }
    }

    if (!found) return false
  }

  return true
}

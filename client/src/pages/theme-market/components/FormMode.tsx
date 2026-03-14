import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState, forwardRef } from 'react'
import { Alert, Button, Card, Collapse, Empty, Form, Input, InputNumber, Segmented, Select, Space, Switch, Tag, Typography } from 'antd'
import { get } from 'lodash'
import yaml from 'js-yaml'
import useLocale from '@/hooks/useLocale'
import type { CommentedTemplateBlock, SchemaField, SchemaJson } from '../themeSchema'
import {
  buildWorkingYaml,
  extractCommentedTemplateBlocks,
  generateSchemaFromYaml,
  getNestedValue,
  updateYamlValues,
} from '../themeSchema'
import styles from '../style.module.less'

const { Text } = Typography
const { TextArea } = Input

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStructuredValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((item) => typeof item === 'object' && item !== null)
  }
  return isPlainObject(value)
}

function buildEmptyValueFromSample(sample: unknown): unknown {
  if (Array.isArray(sample)) return []
  if (isPlainObject(sample)) {
    return Object.fromEntries(
      Object.entries(sample).map(([key, value]) => [key, buildEmptyValueFromSample(value)])
    )
  }
  if (typeof sample === 'boolean') return false
  if (typeof sample === 'number') return 0
  return ''
}

interface StructuredValueEditorProps {
  value?: unknown
  onChange?: (value: unknown) => void
  sample?: unknown
  disabled?: boolean
}

const StructuredValueEditor: React.FC<StructuredValueEditorProps> = ({
  value,
  onChange,
  sample,
  disabled,
}) => {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const currentValue = value ?? sample
  const effectiveSample = currentValue ?? sample

  if (Array.isArray(currentValue) || Array.isArray(effectiveSample)) {
    const listValue = Array.isArray(currentValue) ? currentValue : []
    const arraySample = Array.isArray(effectiveSample) ? effectiveSample : []
    const itemSample = listValue[0] ?? arraySample[0] ?? {}
    const getItemTitle = (item: unknown, index: number): string => {
      if (isPlainObject(item) && typeof item.title === 'string' && item.title.trim() !== '') {
        return item.title
      }
      return `Item ${index + 1}`
    }

    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {listValue.map((item, index) => (
          <Card
            key={index}
            size="small"
            title={getItemTitle(item, index)}
            extra={(
              <Button
                danger
                size="small"
                disabled={disabled}
                onClick={() => onChange?.(listValue.filter((_, itemIndex) => itemIndex !== index))}
              >
                删除
              </Button>
            )}
          >
            <StructuredValueEditor
              value={item}
              sample={itemSample}
              disabled={disabled}
              onChange={(nextItem) => {
                const nextList = [...listValue]
                nextList[index] = nextItem
                onChange?.(nextList)
              }}
            />
          </Card>
        ))}
        <Button
          type="dashed"
          disabled={disabled}
          onClick={() => {
            const nextItem = buildEmptyValueFromSample(itemSample)
            onChange?.([...listValue, nextItem])
          }}
        >
          添加项
        </Button>
      </Space>
    )
  }

  if (isPlainObject(currentValue) || isPlainObject(effectiveSample)) {
    const objectValue = isPlainObject(currentValue) ? currentValue : {}
    const objectSample = isPlainObject(effectiveSample) ? effectiveSample : {}
    // 只显示当前值中的键，模板(sample)中的键不再自动显示为禁用项
    const objectKeys = Object.keys(objectValue)
    const addObjectKey = () => {
      const trimmedKey = newKey.trim()
      if (!trimmedKey || objectKeys.includes(trimmedKey)) return
      // 根据输入的值类型推断：如果是数字就用数字，布尔就用布尔，否则用字符串
      let parsedValue: unknown = newValue.trim()
      if (parsedValue === 'true') parsedValue = true
      else if (parsedValue === 'false') parsedValue = false
      else if (!Number.isNaN(Number(parsedValue)) && parsedValue !== '') parsedValue = Number(parsedValue)
      onChange?.({
        ...objectValue,
        [trimmedKey]: parsedValue,
      })
      setNewKey('')
      setNewValue('')
    }

    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {objectKeys.map((key) => {
          const childValue = objectValue[key]
          const childSample = objectSample[key]

          if (isStructuredValue(childValue ?? childSample)) {
            return (
              <Card
                key={key}
                size="small"
                title={key}
                extra={(
                  <Button
                    danger
                    size="small"
                    disabled={disabled}
                    onClick={() => {
                      const nextObject = { ...objectValue }
                      delete nextObject[key]
                      onChange?.(nextObject)
                    }}
                  >
                    删除
                  </Button>
                )}
              >
                <StructuredValueEditor
                  value={childValue}
                  sample={childSample}
                  disabled={disabled}
                  onChange={(nextValue) => {
                    onChange?.({
                      ...objectValue,
                      [key]: nextValue,
                    })
                  }}
                />
              </Card>
            )
          }

          if (typeof (childValue ?? childSample) === 'boolean') {
            return (
              <div key={key}>
                <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>{key}</Text>
                  <Button
                    danger
                    size="small"
                    disabled={disabled}
                    onClick={() => {
                      const nextObject = { ...objectValue }
                      delete nextObject[key]
                      onChange?.(nextObject)
                    }}
                  >
                    删除
                  </Button>
                </Space>
                <Switch
                  checked={Boolean(childValue)}
                  disabled={disabled}
                  onChange={(checked) => {
                    onChange?.({
                      ...objectValue,
                      [key]: checked,
                    })
                  }}
                />
              </div>
            )
          }

          if (typeof (childValue ?? childSample) === 'number') {
            return (
              <div key={key}>
                <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>{key}</Text>
                  <Button
                    danger
                    size="small"
                    disabled={disabled}
                    onClick={() => {
                      const nextObject = { ...objectValue }
                      delete nextObject[key]
                      onChange?.(nextObject)
                    }}
                  >
                    删除
                  </Button>
                </Space>
                <InputNumber
                  style={{ width: '100%' }}
                  disabled={disabled}
                  value={typeof childValue === 'number' ? childValue : undefined}
                  onChange={(nextValue) => {
                    onChange?.({
                      ...objectValue,
                      [key]: nextValue ?? 0,
                    })
                  }}
                />
              </div>
            )
          }

          return (
            <div key={key}>
              <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>{key}</Text>
                <Button
                  danger
                  size="small"
                  disabled={disabled}
                  onClick={() => {
                    const nextObject = { ...objectValue }
                    delete nextObject[key]
                    onChange?.(nextObject)
                  }}
                >
                  删除
                </Button>
              </Space>
              <Input
                disabled={disabled}
                value={typeof childValue === 'string' ? childValue : String(childValue ?? '')}
                onChange={(event) => {
                  onChange?.({
                    ...objectValue,
                    [key]: event.target.value,
                  })
                }}
              />
            </div>
          )
        })}
        <Card size="small" title="添加新项">
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Input
              value={newKey}
              disabled={disabled}
              placeholder="键名（如：首页）"
              onChange={(event) => setNewKey(event.target.value)}
              onPressEnter={addObjectKey}
            />
            <Input
              value={newValue}
              disabled={disabled}
              placeholder="值（如：/ || fas fa-home）"
              onChange={(event) => setNewValue(event.target.value)}
              onPressEnter={addObjectKey}
            />
            <Button
              type="dashed"
              block
              disabled={disabled || !newKey.trim() || objectKeys.includes(newKey.trim())}
              onClick={addObjectKey}
            >
              添加
            </Button>
          </Space>
        </Card>
      </Space>
    )
  }

  return (
    <TextArea
      rows={6}
      disabled={disabled}
      value={typeof currentValue === 'string' ? currentValue : String(currentValue ?? '')}
      onChange={(event) => onChange?.(event.target.value)}
    />
  )
}

interface FormModeProps {
  initialYaml: string
  onSave: (yamlContent: string) => Promise<void>
  saving: boolean
  onClose?: () => void
  /** 独立的 schema JSON，优先于 YAML 注释 */
  schemaJson?: SchemaJson | null
}

export interface FormModeRef {
  save: () => Promise<void>
}

type ViewMode = 'enabled' | 'disabled' | 'all'

const FormMode = forwardRef<FormModeRef, FormModeProps>(({
  initialYaml,
  onSave,
  saving,
  onClose,
  schemaJson,
}, ref) => {
  const t = useLocale()
  const [form] = Form.useForm()
  const [pendingTemplatePaths, setPendingTemplatePaths] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('enabled')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeGroupKeys, setActiveGroupKeys] = useState<string[]>([])
  const templateBlocks = useMemo(
    () => extractCommentedTemplateBlocks(initialYaml, schemaJson),
    [initialYaml, schemaJson]
  )
  const workingYaml = useMemo(
    () => buildWorkingYaml(initialYaml, templateBlocks, pendingTemplatePaths),
    [initialYaml, pendingTemplatePaths, templateBlocks]
  )

  // 基于工作态 YAML 生成 schema；待启用模板会立即出现在可编辑字段中
  const { schema, parseError } = useMemo(() => {
    try {
      const config = yaml.load(workingYaml) as Record<string, unknown>
      if (config && typeof config === 'object') {
        return {
          schema: generateSchemaFromYaml(config, workingYaml, { schemaJson }),
          parseError: '',
        }
      }
    } catch {
      // handled below
    }
    try {
      yaml.load(workingYaml)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { schema: [], parseError: message }
    }
    return { schema: [], parseError: '' }
  }, [schemaJson, workingYaml])

  // 从配置转换为表单值
  const configToFormValues = useCallback((config: Record<string, unknown>, formSchema: typeof schema) => {
    const values: Record<string, unknown> = {}
    formSchema.forEach((group) => {
      group.fields.forEach((field) => {
        const rawVal = get(config, field.key)
        let val = rawVal
        if (val === undefined || val === null) val = field.default ?? ''

        if (isStructuredValue(val)) {
          values[field.key] = val
          return
        }

        val = getNestedValue(config, field.key)
        if (val === undefined || val === null) val = field.default ?? ''
        if (field.type === 'select' && field.options && val !== '' && val !== false) {
          val = String(val)
        }
        values[field.key] = val
      })
    })
    return values
  }, [])

  useEffect(() => {
    try {
      const config = yaml.load(workingYaml) as Record<string, unknown>
      if (config && typeof config === 'object' && schema.length > 0) {
        const values = configToFormValues(config, schema)
        const currentValues = form.getFieldsValue(true)
        form.setFieldsValue({
          ...values,
          ...currentValues,
        })
      }
    } catch {
      // ignore parse error
    }
  }, [configToFormValues, form, schema, workingYaml])

  useEffect(() => {
    setPendingTemplatePaths([])
  }, [initialYaml, schemaJson, templateBlocks.length])

  const normalizedSearchKeyword = useMemo(() => searchKeyword.trim().toLowerCase(), [searchKeyword])

  const matchesSearch = useCallback((...values: Array<string | undefined>) => {
    if (!normalizedSearchKeyword) return true
    return values.some((value) => (value || '').toLowerCase().includes(normalizedSearchKeyword))
  }, [normalizedSearchKeyword])

  const filteredSchema = useMemo(() => {
    if (viewMode === 'disabled') return []

    return schema
      .map((group) => {
        if (matchesSearch(group.key, group.label)) {
          return group
        }

        const fields = group.fields.filter((field) => (
          matchesSearch(field.key, field.label, field.description, group.key, group.label)
        ))

        if (fields.length === 0) return null
        return { ...group, fields }
      })
      .filter((group): group is NonNullable<typeof group> => Boolean(group))
  }, [matchesSearch, schema, viewMode])

  const filteredTemplateBlocks = useMemo(() => {
    if (viewMode === 'enabled') return []

    return templateBlocks.filter((block) => (
      matchesSearch(block.path, block.key, block.label, block.description, block.preview)
    ))
  }, [matchesSearch, templateBlocks, viewMode])

  const groupedTemplateBlocks = useMemo(() => {
    const groupMap = new Map<string, CommentedTemplateBlock[]>()

    filteredTemplateBlocks.forEach((block) => {
      const groupKey = block.path.split('.')[0]
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, [])
      }
      groupMap.get(groupKey)!.push(block)
    })

    return Array.from(groupMap.entries()).map(([key, blocks]) => ({
      key,
      label: t[key] || key,
      blocks,
    }))
  }, [filteredTemplateBlocks, t])

  useEffect(() => {
    if (filteredSchema.length === 0) {
      setActiveGroupKeys([])
      return
    }

    if (normalizedSearchKeyword) {
      setActiveGroupKeys(filteredSchema.map((group) => group.key))
      return
    }

    setActiveGroupKeys((prev) => {
      const validKeys = prev.filter((key) => filteredSchema.some((group) => group.key === key))
      if (validKeys.length > 0) return validKeys
      return [filteredSchema[0].key]
    })
  }, [filteredSchema, normalizedSearchKeyword])

  const normalizeFieldValue = useCallback((field: SchemaField, rawValue: unknown, oldValue: unknown): unknown => {
    let finalVal = rawValue

    if (field.type === 'select' && typeof rawValue === 'string') {
      if (rawValue === 'false') return false
      if (!Number.isNaN(Number(rawValue))) return Number(rawValue)
      return rawValue
    }

    const shouldParseYamlText =
      typeof rawValue === 'string' &&
      (Array.isArray(oldValue) ||
        (!!oldValue && typeof oldValue === 'object') ||
        Array.isArray(field.default) ||
        (!!field.default && typeof field.default === 'object'))

    if (shouldParseYamlText) {
      const trimmed = rawValue.trim()
      if (trimmed === '') return undefined
      try {
        return yaml.load(trimmed)
      } catch {
        return rawValue
      }
    }

    return finalVal
  }, [])

  const stringifyComparableValue = useCallback((value: unknown): string => {
    if (value && typeof value === 'object') {
      try {
        return yaml.dump(value, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          quotingType: '"',
        }).trim()
      } catch {
        return JSON.stringify(value)
      }
    }
    return String(value)
  }, [])

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields()
      const baseConfig = yaml.load(workingYaml) as Record<string, unknown>

      // 收集变更的字段
      const changes: Record<string, unknown> = {}
      schema.forEach((group) => {
        group.fields.forEach((field) => {
          const newVal = values[field.key]
          if (newVal === undefined) return
          const oldVal = get(baseConfig || {}, field.key)
          const finalVal = normalizeFieldValue(field, newVal, oldVal)
          if (stringifyComparableValue(finalVal) !== stringifyComparableValue(oldVal)) {
            changes[field.key] = finalVal
          }
        })
      })

      // 基于工作态 YAML 保存，允许用户在启用模板后立即编辑其中字段
      const yamlContent = updateYamlValues(workingYaml, changes)
      await onSave(yamlContent)
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        // validation error, form will show
      }
    }
  }, [form, normalizeFieldValue, onSave, schema, stringifyComparableValue, workingYaml])

  useImperativeHandle(ref, () => ({
    save: handleSave,
  }), [handleSave])

  const toggleTemplateBlock = useCallback((path: string) => {
    setPendingTemplatePaths((prev) => (
      prev.includes(path) ? prev.filter((item) => item !== path) : [...prev, path]
    ))
  }, [])

  const renderTemplateBlock = (block: CommentedTemplateBlock) => {
    const pending = pendingTemplatePaths.includes(block.path)
    const label = t[block.label] || block.label
    const description = block.description ? (t[block.description] || block.description) : undefined

    return (
      <Card
        key={block.path}
        size="small"
        className={styles.templateBlockCard}
        title={
          <Space size={8}>
            <Text strong>{label}</Text>
            <Tag color={pending ? 'gold' : 'default'}>
              {pending ? (t['theme.config.templatePending'] || '保存后启用') : (t['theme.config.templateAvailable'] || '可启用')}
            </Tag>
          </Space>
        }
        extra={
          <Button type={pending ? 'default' : 'primary'} size="small" onClick={() => toggleTemplateBlock(block.path)}>
            {pending ? (t['universal.cancel'] || '取消') : (t['theme.config.enableTemplate'] || '启用')}
          </Button>
        }
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text type="secondary">{block.path}</Text>
          {description ? <Text type="secondary">{description}</Text> : null}
          <pre className={styles.templateBlockPreview}>{block.preview}</pre>
        </Space>
      </Card>
    )
  }

  const renderField = (field: SchemaField) => {
    const label = t[field.label] || field.label
    const placeholder = field.placeholder ? (t[field.placeholder] || field.placeholder) : undefined
    const description = field.description ? (t[field.description] || field.description) : undefined
    const structuredDefault = field.default

    if (isStructuredValue(structuredDefault)) {
      return (
        <Form.Item key={field.key} name={field.key} label={label} help={description}>
          <StructuredValueEditor sample={structuredDefault} disabled={saving} />
        </Form.Item>
      )
    }

    switch (field.type) {
      case 'switch':
        return (
          <Form.Item
            key={field.key}
            name={field.key}
            label={label}
            valuePropName="checked"
            help={description}
          >
            <Switch />
          </Form.Item>
        )
      case 'number':
        return (
          <Form.Item key={field.key} name={field.key} label={label} help={description}>
            <InputNumber style={{ width: '100%' }} placeholder={placeholder} />
          </Form.Item>
        )
      case 'select':
        return (
          <Form.Item key={field.key} name={field.key} label={label} help={description}>
            <Select
              placeholder={placeholder}
              allowClear
              options={field.options?.map((o) => ({
                value: o.value,
                label: t[String(o.label)] || String(o.label),
              }))}
            />
          </Form.Item>
        )
      case 'textarea':
        return (
          <Form.Item key={field.key} name={field.key} label={label} help={description}>
            <TextArea
              rows={typeof field.default === 'object' && field.default !== null ? 10 : 4}
              placeholder={placeholder}
            />
          </Form.Item>
        )
      case 'color':
        return (
          <Form.Item key={field.key} name={field.key} label={label} help={description}>
            <Input placeholder={placeholder} type="text" maxLength={7} />
          </Form.Item>
        )
      default:
        return (
          <Form.Item key={field.key} name={field.key} label={label} help={description}>
            <Input placeholder={placeholder} />
          </Form.Item>
        )
    }
  }

  const showEnabledSection = viewMode !== 'disabled'
  const showDisabledSection = viewMode !== 'enabled'
  const hasVisibleContent = filteredSchema.length > 0 || groupedTemplateBlocks.length > 0

  if (schema.length === 0 && templateBlocks.length === 0) {
    return (
      <div className={styles.formMode} style={{ padding: 40, textAlign: 'center' }}>
        {parseError ? (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16, textAlign: 'left' }}
            message={t['theme.config.parseError'] || 'YAML 解析失败'}
            description={parseError}
          />
        ) : null}
        <Empty description={t['theme.config.noFields'] || '无可编辑字段'} />
      </div>
    )
  }

  return (
    <div className={styles.formMode}>
      <div className={styles.formModeToolbar}>
        <Segmented
          value={viewMode}
          onChange={(value) => setViewMode(value as ViewMode)}
          options={[
            { label: t['theme.config.enabledView'] || '已启用', value: 'enabled' },
            { label: t['theme.config.disabledView'] || '未启用', value: 'disabled' },
            { label: t['theme.config.allView'] || '全部', value: 'all' },
          ]}
        />
        <Input.Search
          allowClear
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder={t['theme.config.searchPlaceholder'] || '搜索分组、字段或配置路径'}
          className={styles.formModeSearch}
        />
      </div>

      {showDisabledSection && groupedTemplateBlocks.length > 0 ? (
        <div className={styles.templateBlockSection}>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={t['theme.config.templateTitle'] || '可从注释中启用的配置'}
            description={t['theme.config.templateDescription'] || '这些配置当前仍是注释状态，可在表单模式中直接启用，保存后会自动取消注释。'}
          />
          <Collapse
            className={styles.templateBlockCollapse}
            items={groupedTemplateBlocks.map((group) => ({
              key: group.key,
              label: (
                <Space size={8}>
                  <Text strong>{group.label}</Text>
                  <Tag>{group.blocks.length}</Tag>
                </Space>
              ),
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {group.blocks.map((block) => renderTemplateBlock(block))}
                </Space>
              ),
            }))}
          />
        </div>
      ) : null}

      {showEnabledSection && filteredSchema.length > 0 ? (
        <Form form={form} layout="vertical" preserve={false}>
          <Collapse
            activeKey={activeGroupKeys}
            onChange={(keys) => {
              const keyList = Array.isArray(keys) ? keys : [keys]
              setActiveGroupKeys(keyList.map(String))
            }}
            items={filteredSchema.map((group) => ({
              key: group.key,
              label: (
                <Space size={8}>
                  <Text strong>{t[group.label] || group.label}</Text>
                  <Tag>{group.fields.length}</Tag>
                </Space>
              ),
              children: (
                <div style={{ padding: '8px 0' }}>
                  {group.fields.map((field) => renderField(field))}
                </div>
              ),
            }))}
          />
        </Form>
      ) : null}

      {!hasVisibleContent ? (
        <div className={styles.formModeEmpty}>
          <Empty description={t['theme.config.noSearchResult'] || '没有匹配的配置'} />
        </div>
      ) : null}
    </div>
  )
})

FormMode.displayName = 'FormMode'

export default FormMode

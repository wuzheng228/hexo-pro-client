import React, { useCallback, useImperativeHandle, useMemo, forwardRef } from 'react'
import { Collapse, Form, Input, Select, Switch, Typography, InputNumber, Empty, Alert } from 'antd'
import yaml from 'js-yaml'
import useLocale from '@/hooks/useLocale'
import type { SchemaField, SchemaJson } from '../themeSchema'
import { generateSchemaFromYaml, getNestedValue, setNestedValue, updateYamlValues } from '../themeSchema'
import styles from '../style.module.less'

const { Text } = Typography
const { TextArea } = Input

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

const FormMode = forwardRef<FormModeRef, FormModeProps>(({
  initialYaml,
  onSave,
  saving,
  onClose,
  schemaJson,
}, ref) => {
  const t = useLocale()
  const [form] = Form.useForm()

  // 生成 schema，优先使用 schemaJson，其次 YAML 注释
  const { schema, parseError } = useMemo(() => {
    try {
      const config = yaml.load(initialYaml) as Record<string, unknown>
      if (config && typeof config === 'object') {
        return {
          schema: generateSchemaFromYaml(config, initialYaml, { schemaJson }),
          parseError: '',
        }
      }
    } catch {
      // handled below
    }
    try {
      yaml.load(initialYaml)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { schema: [], parseError: message }
    }
    return { schema: [], parseError: '' }
  }, [initialYaml, schemaJson])

  // 从配置转换为表单值
  const configToFormValues = useCallback((config: Record<string, unknown>, formSchema: typeof schema) => {
    const values: Record<string, unknown> = {}
    formSchema.forEach((group) => {
      group.fields.forEach((field) => {
        let val = getNestedValue(config, field.key)
        if (val === undefined || val === null) val = field.default ?? ''
        if (field.type === 'select' && field.options && val !== '' && val !== false) {
          val = String(val)
        }
        values[field.key] = val
      })
    })
    return values
  }, [])

  // 从表单值转换为配置
  const formValuesToConfig = useCallback((values: Record<string, unknown>, baseConfig: Record<string, unknown>, formSchema: typeof schema) => {
    const config = JSON.parse(JSON.stringify(baseConfig)) as Record<string, unknown>
    formSchema.forEach((group) => {
      group.fields.forEach((field) => {
        const val = values[field.key]
        if (val === undefined) return
        let finalVal = val
        // 特殊处理 select 字段的类型转换
        if (field.type === 'select' && typeof val === 'string') {
          if (val === 'false') {
            finalVal = false
          } else if (!Number.isNaN(Number(val))) {
            finalVal = Number(val)
          }
        }
        setNestedValue(config, field.key, finalVal)
      })
    })
    return config
  }, [])

  // 从 YAML 加载表单值
  useMemo(() => {
    try {
      const config = yaml.load(initialYaml) as Record<string, unknown>
      if (config && typeof config === 'object' && schema.length > 0) {
        const values = configToFormValues(config, schema)
        form.setFieldsValue(values)
      }
    } catch {
      // ignore parse error
    }
  }, [initialYaml, schema, form, configToFormValues])

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields()
      const baseConfig = yaml.load(initialYaml) as Record<string, unknown>

      // 收集变更的字段
      const changes: Record<string, unknown> = {}
      schema.forEach((group) => {
        group.fields.forEach((field) => {
          const newVal = values[field.key]
          if (newVal === undefined) return
          let finalVal = newVal
          if (field.type === 'select' && typeof newVal === 'string') {
            if (newVal === 'false') finalVal = false
            else if (!Number.isNaN(Number(newVal))) finalVal = Number(newVal)
          }
          const oldVal = getNestedValue(baseConfig || {}, field.key)
          if (String(finalVal) !== String(oldVal)) {
            changes[field.key] = finalVal
          }
        })
      })

      // 原地替换保留注释，而非 yaml.dump
      const yamlContent = updateYamlValues(initialYaml, changes)
      await onSave(yamlContent)
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        // validation error, form will show
      }
    }
  }, [form, initialYaml, schema, onSave])

  useImperativeHandle(ref, () => ({
    save: handleSave,
  }), [handleSave])

  const renderField = (field: SchemaField) => {
    const label = t[field.label] || field.label
    const placeholder = field.placeholder ? (t[field.placeholder] || field.placeholder) : undefined
    const description = field.description ? (t[field.description] || field.description) : undefined

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
            <TextArea rows={4} placeholder={placeholder} />
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

  if (schema.length === 0) {
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
      <Form form={form} layout="vertical" preserve={false}>
        <Collapse
          defaultActiveKey={schema.map((g) => g.key)}
          items={schema.map((group) => ({
            key: group.key,
            label: <Text strong>{t[group.label] || group.label}</Text>,
            children: (
              <div style={{ padding: '8px 0' }}>
                {group.fields.map((field) => renderField(field))}
              </div>
            ),
          }))}
        />
      </Form>
    </div>
  )
})

FormMode.displayName = 'FormMode'

export default FormMode

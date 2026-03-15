import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, message, Segmented, Spin, Space } from 'antd'
import { SaveOutlined, CloseOutlined } from '@ant-design/icons'
import service from '@/utils/api'
import useLocale from '@/hooks/useLocale'
import type { SchemaJson } from '../themeSchema'
import YamlEditor from '@/pages/content/yaml/components/YamlEditor'
import FormMode, { type FormModeRef } from './FormMode'
import styles from '../style.module.less'

interface ThemeConfigPanelProps {
  themeId: string
  themeName?: string
  onClose?: () => void
}

const ThemeConfigPanel: React.FC<ThemeConfigPanelProps> = ({
  themeId,
  onClose,
}) => {
  const t = useLocale()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [schemaJson, setSchemaJson] = useState<SchemaJson | null>(null)
  const [activeTab, setActiveTab] = useState<'raw' | 'form'>('raw')
  const formModeRef = useRef<FormModeRef>(null)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const [configRes, schemaRes] = await Promise.all([
        service.get('/hexopro/api/theme/config', { params: { themeId } }),
        service.get('/hexopro/api/theme/schema', { params: { themeId } }),
      ])
      const content = configRes.data?.content ?? ''
      setEditContent(content)
      if (schemaRes.data?.hasSchema && schemaRes.data?.schema) {
        setSchemaJson(schemaRes.data.schema)
      } else {
        setSchemaJson(null)
      }
    } catch (err) {
      message.error(t['theme.config.fetchFailed'] || '获取配置失败')
    } finally {
      setLoading(false)
    }
  }, [themeId, t])

  useEffect(() => {
    void fetchConfig()
  }, [fetchConfig])

  const handleSave = useCallback(async (content?: string) => {
    setSaving(true)
    try {
      const toSave = content ?? editContent
      await service.post('/hexopro/api/theme/config/save', {
        themeId,
        content: toSave,
      })
      message.success(t['theme.config.saveSuccess'] || '配置已保存')
      if (content) setEditContent(content)
    } catch {
      message.error(t['theme.config.saveFailed'] || '保存配置失败')
    } finally {
      setSaving(false)
    }
  }, [themeId, editContent, t])

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={styles.drawerConfigPanel}>
      {/* 固定顶部操作栏 */}
      <div className={styles.drawerHeader}>
        <Space style={{ width: '100%' }}>
          <Segmented
            value={activeTab}
            onChange={(val) => setActiveTab((val as 'raw' | 'form') ?? 'raw')}
            options={[
              {
                label: t['theme.config.formMode'] || '表单模式',
                value: 'form',
              },
              {
                label: t['theme.config.rawMode'] || 'Raw 模式',
                value: 'raw',
              },
            ]}
            style={{ flex: 1 }}
          />
        </Space>
      </div>

      {/* 内容区域 */}
      <div className={styles.drawerContent}>
        {activeTab === 'raw' ? (
          <div>
            <YamlEditor
              id={`theme-config-${themeId}`}
              initialValue={editContent}
              height="calc(100vh - 180px)"
              onChange={setEditContent}
            />
          </div>
        ) : (
          <FormMode
            ref={formModeRef}
            initialYaml={editContent}
            onSave={handleSave}
            saving={saving}
            onClose={onClose}
            schemaJson={schemaJson}
          />
        )}
      </div>

      {/* 固定底部操作栏 */}
      <div className={styles.drawerFooter}>
        <Space>
          <Button onClick={onClose} icon={<CloseOutlined />}>
            {t['universal.close'] || '关闭'}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={async () => {
              if (activeTab === 'form') {
                setSaving(true)
                try {
                  await formModeRef.current?.save()
                } finally {
                  setSaving(false)
                }
              } else {
                void handleSave()
              }
            }}
          >
            {t['universal.save'] || '保存'}
          </Button>
        </Space>
      </div>

    </div>
  )
}

export default ThemeConfigPanel

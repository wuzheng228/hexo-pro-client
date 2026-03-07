import React, { useCallback, useEffect, useState } from 'react'
import { Button, message, Segmented, Spin, Space } from 'antd'
import { SaveOutlined, CloseOutlined } from '@ant-design/icons'
import service from '@/utils/api'
import useLocale from '@/hooks/useLocale'
import YamlEditor from '@/pages/content/yaml/components/YamlEditor'
import FormMode from './FormMode'
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
  const [activeTab, setActiveTab] = useState('raw')

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await service.get('/hexopro/api/theme/config', {
        params: { themeId },
      })
      const content = res.data?.content ?? ''
      setEditContent(content)
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
        <Segmented
          value={activeTab}
          onChange={(val) => setActiveTab(String(val))}
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
          block
        />
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
            initialYaml={editContent}
            onSave={handleSave}
            saving={saving}
            onClose={onClose}
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
            onClick={() => handleSave()}
          >
            {t['universal.save'] || '保存'}
          </Button>
        </Space>
      </div>
    </div>
  )
}

export default ThemeConfigPanel

import React, { useCallback, useEffect, useState } from 'react'
import { Button, message, Spin, Tabs } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import service from '@/utils/api'
import useLocale from '@/hooks/useLocale'
import YamlEditor from '@/pages/content/yaml/components/YamlEditor'
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

  const handleSave = async () => {
    setSaving(true)
    try {
      await service.post('/hexopro/api/theme/config/save', {
        themeId,
        content: editContent,
      })
      message.success(t['theme.config.saveSuccess'] || '配置已保存')
    } catch (err) {
      message.error(t['theme.config.saveFailed'] || '保存配置失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={styles.configPanel}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'raw',
            label: t['theme.config.rawMode'] || 'Raw 模式',
            children: (
              <div>
                <div className={styles.rawEditor}>
                  <YamlEditor
                    id={`theme-config-${themeId}`}
                    initialValue={editContent}
                    height="500px"
                    onChange={setEditContent}
                  />
                </div>
                <div className={styles.rawActions}>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={handleSave}
                  >
                    {t['universal.save'] || '保存'}
                  </Button>
                  {onClose && (
                    <Button onClick={onClose}>
                      {t['universal.close'] || '关闭'}
                    </Button>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'form',
            label: t['theme.config.formMode'] || '表单模式',
            children: (
              <div style={{ padding: '20px 0' }}>
                <p style={{ color: 'rgba(0,0,0,0.45)' }}>
                  {t['theme.config.formModeComing'] ||
                    '表单模式正在开发中，请先使用 Raw 模式编辑配置。'}
                </p>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

export default ThemeConfigPanel

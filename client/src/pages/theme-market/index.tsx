import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  message,
  Row,
  Spin,
  Typography,
} from 'antd'
import {
  DownloadOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import service from '@/utils/api'
import useLocale from '@/hooks/useLocale'
import ThemeConfigPanel from './components/ThemeConfigPanel'
import styles from './style.module.less'

const { Title, Text } = Typography

interface BuiltinTheme {
  id: string
  name: string
  description: string
  author: string
  themeDir: string
}

interface ThemeStatus {
  installed: boolean
  isCurrent?: boolean
}

const ThemeMarketPage: React.FC = () => {
  const t = useLocale()
  const [themes, setThemes] = useState<BuiltinTheme[]>([])
  const [statusMap, setStatusMap] = useState<Record<string, ThemeStatus>>({})
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<string | null>(null)
  const [configModal, setConfigModal] = useState<{
    visible: boolean
    themeId: string
    themeName: string
  }>({ visible: false, themeId: '', themeName: '' })

  const fetchThemes = useCallback(async () => {
    try {
      const res = await service.get('/hexopro/api/theme/list')
      setThemes(res.data || [])
    } catch (err) {
      message.error(t['theme.list.fetchFailed'] || '获取主题列表失败')
    }
  }, [t])

  const fetchInstalledStatus = useCallback(async () => {
    if (themes.length === 0) return
    const map: Record<string, ThemeStatus> = {}
    await Promise.all(
      themes.map(async (theme) => {
        try {
          const res = await service.get('/hexopro/api/theme/installed', {
            params: { themeId: theme.id },
          })
          map[theme.id] = res.data || { installed: false }
        } catch {
          map[theme.id] = { installed: false }
        }
      })
    )
    setStatusMap(map)
  }, [themes])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchThemes()
      setLoading(false)
    }
    void load()
  }, [fetchThemes])

  useEffect(() => {
    if (themes.length > 0) {
      void fetchInstalledStatus()
    }
  }, [themes, fetchInstalledStatus])

  const handleInstall = async (themeId: string) => {
    setInstalling(themeId)
    try {
      await service.post('/hexopro/api/theme/install', { themeId })
      message.success(t['theme.install.success'] || '主题安装完成')
      await fetchInstalledStatus()
    } catch {
      message.error(t['theme.install.failed'] || '安装失败')
    } finally {
      setInstalling(null)
    }
  }

  const openConfig = (theme: BuiltinTheme) => {
    setConfigModal({
      visible: true,
      themeId: theme.id,
      themeName: theme.name,
    })
  }

  const closeConfig = () => {
    setConfigModal({
      visible: false,
      themeId: '',
      themeName: '',
    })
  }

  return (
    <div className={styles.container}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={4}>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            {t['theme.market.title'] || '主题市场'}
          </Title>
          <Text type="secondary">
            {t['theme.market.desc'] ||
              '一键安装 Hexo 主题，可视化配置主题参数'}
          </Text>
        </Col>
      </Row>

      <Divider />

      <Spin spinning={loading}>
        <div className={styles.themeGrid}>
          {themes.map((theme) => {
            const status = statusMap[theme.id] || { installed: false, isCurrent: false }
            const isInstalling = installing === theme.id

            return (
              <Card key={theme.id} className={styles.themeCard} hoverable>
                <div className={styles.themePreview}>
                  {theme.name}
                </div>
                <div className={styles.themeInfo}>
                  <div className={styles.themeName}>{theme.name}</div>
                  <div className={styles.themeDesc}>{theme.description}</div>
                  <div className={styles.themeAuthor}>
                    {t['theme.author'] || '作者'}: {theme.author}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {!status.installed ? (
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      loading={isInstalling}
                      onClick={() => handleInstall(theme.id)}
                    >
                      {t['theme.install'] || '一键安装'}
                    </Button>
                  ) : (
                    <>
                      {status.isCurrent && (
                        <Button disabled>
                          {t['theme.current'] || '当前使用'}
                        </Button>
                      )}
                      <Button
                        icon={<SettingOutlined />}
                        onClick={() => openConfig(theme)}
                      >
                        {t['theme.config'] || '配置'}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </Spin>

      <Drawer
        title={`${t['theme.config'] || '配置'} - ${configModal.themeName}`}
        placement="right"
        onClose={closeConfig}
        open={configModal.visible}
        width={700}
        destroyOnClose
        bodyStyle={{ padding: 0 }}
      >
        {configModal.visible && (
          <ThemeConfigPanel
            themeId={configModal.themeId}
            themeName={configModal.themeName}
            onClose={closeConfig}
          />
        )}
      </Drawer>
    </div>
  )
}

export default ThemeMarketPage

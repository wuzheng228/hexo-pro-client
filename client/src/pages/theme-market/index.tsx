import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Typography,
} from 'antd'
import {
  DownloadOutlined,
  SettingOutlined,
  AppstoreOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import service from '@/utils/api'
import useLocale from '@/hooks/useLocale'
import ThemeConfigPanel from './components/ThemeConfigPanel'
import styles from './style.module.less'

// 检查是否为桌面环境
function isDesktopEnvironment(): boolean {
  return typeof window !== 'undefined' &&
    typeof (window as any).electronAPI === 'object' &&
    (window as any).electronAPI !== null
}

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
    configType: 'theme' | 'global'
    themeId: string
    title: string
  }>({ visible: false, configType: 'theme', themeId: '', title: '' })

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

  // 处理主题切换
  const handleSwitchTheme = async (themeId: string) => {
    setInstalling(themeId) // 使用 loading 状态
    try {
      const res = await service.post('/hexopro/api/theme/switch', { themeId })
      const data = res.data

      if (data?.success) {
        message.success(t['theme.switch.success'] || '主题切换成功')

        // 如果需要重启
        if (data?.needRestart) {
          if (isDesktopEnvironment()) {
            // 桌面端：显示重启中提示，然后调用重启 API
            message.loading({
              content: t['theme.switch.needRestart'] || '主题已切换，正在重启服务器...',
              key: 'theme-restart',
              duration: 0,
            })

            try {
              // 调用桌面端重启 API
              await service.post('/hexopro/api/desktop/restart')
              message.success({
                content: t['theme.restart.success'] || '服务器重启成功',
                key: 'theme-restart',
                duration: 2,
              })
              // 刷新状态
              await fetchInstalledStatus()
            } catch (restartError) {
              message.error({
                content: t['theme.restart.failed'] || '服务器重启失败',
                key: 'theme-restart',
                duration: 2,
              })
            }
          } else {
            // 插件端：提示用户手动重启
            Modal.info({
              title: t['theme.switch.success'] || '主题切换成功',
              content: t['theme.switch.needRestartManual'] || '主题已切换，请手动重启服务器以生效',
              okText: t['universal.confirm'] || '确定',
              onOk: () => {
                // 刷新状态
                fetchInstalledStatus()
              },
            })
          }
        } else {
          // 不需要重启，直接刷新状态
          await fetchInstalledStatus()
        }
      } else {
        message.error(data?.message || t['theme.switch.failed'] || '切换失败')
      }
    } catch (error) {
      message.error(t['theme.switch.failed'] || '切换失败')
    } finally {
      setInstalling(null)
    }
  }

  const openConfig = (theme: BuiltinTheme) => {
    setConfigModal({
      visible: true,
      configType: 'theme',
      themeId: theme.id,
      title: theme.name,
    })
  }

  const openGlobalConfig = () => {
    setConfigModal({
      visible: true,
      configType: 'global',
      themeId: '',
      title: t['theme.globalConfig'] || '全局配置',
    })
  }

  const closeConfig = () => {
    setConfigModal({
      visible: false,
      configType: 'theme',
      themeId: '',
      title: '',
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
          <div style={{ marginTop: 12 }}>
            <Space>
              <Button icon={<SettingOutlined />} onClick={openGlobalConfig}>
                {t['theme.globalConfig'] || '全局配置 _config.yml'}
              </Button>
            </Space>
          </div>
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
                <div className={styles.themeActions}>
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
                      {status.isCurrent ? (
                        <Button disabled>
                          {t['theme.current'] || '当前使用'}
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          icon={<SwapOutlined />}
                          loading={isInstalling}
                          onClick={() => handleSwitchTheme(theme.id)}
                        >
                          {t['theme.switch'] || '切换主题'}
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
        title={configModal.configType === 'global'
          ? (t['theme.globalConfig'] || '全局配置 _config.yml')
          : `${t['theme.config'] || '配置'} - ${configModal.title}`}
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
            configType={configModal.configType}
            onClose={closeConfig}
          />
        )}
      </Drawer>
    </div>
  )
}

export default ThemeMarketPage

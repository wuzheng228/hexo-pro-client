import React, { useCallback, useContext, useEffect } from 'react'
import { Spin, Tabs, message } from 'antd'
import { EditOutlined, LinkOutlined, PictureOutlined, RocketOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons'
import styles from './style/index.module.less'
import useLocale from '../../hooks/useLocale'
import { GlobalContext } from '@/context'
import { useFirstUse } from './hooks/useFirstUse'
import AccountSettingsCard from './components/AccountSettingsCard'
import LinkRedirectSettingsCard from './components/LinkRedirectSettingsCard'
import EditorSettingsCard from './components/EditorSettingsCard'
import DisplaySettingsCard from './components/DisplaySettingsCard'
import DeploySettingsCard from './components/DeploySettingsCard'
import AISettingsCard from './components/AISettingsCard'

const SettingsPage: React.FC = () => {
  const t = useLocale()
  const { theme } = useContext(GlobalContext)
  // 跳过设置直接进入
  const skipSettings = useCallback(() => {
    // 设置一个标记，表示用户选择了跳过设置
    localStorage.setItem('hexoProSkipSettings', 'true')
    message.success(t['settings.skipSetupMessage'])
    window.location.href = '/pro'
  }, [t])

  const { isFirstUse, loading, error } = useFirstUse()

  useEffect(() => {
    if (!error) return
    console.error('检查系统状态失败:', error)
    message.error(t['settings.checkSystemStatusFailed'])
  }, [error, t])

  return (
    <div className={styles.container} data-theme={theme}>
      <Spin spinning={loading}>
        {isFirstUse == null ? null : isFirstUse ? (
          <AccountSettingsCard isFirstUse showWelcomeAlert onSkipSettings={skipSettings} />
        ) : (
          <Tabs
            className={styles.settingsTabs}
            defaultActiveKey="account"
            animated={{ inkBar: false, tabPane: false }}
            items={[
              {
                key: 'account',
                label: (
                  <span className={styles.tabLabel}>
                    <UserOutlined className={styles.tabIcon} />
                    {t['settings.title']}
                  </span>
                ),
                children: <AccountSettingsCard isFirstUse={false} showTitle={false} showWelcomeAlert={false} onSkipSettings={skipSettings} />,
              },
              {
                key: 'link',
                label: (
                  <span className={styles.tabLabel}>
                    <LinkOutlined className={styles.tabIcon} />
                    {t['settings.linkRedirectTitle']}
                  </span>
                ),
                children: <LinkRedirectSettingsCard />,
              },
              {
                key: 'editor',
                label: (
                  <span className={styles.tabLabel}>
                    <EditOutlined className={styles.tabIcon} />
                    {t['settings.editorTitle']}
                  </span>
                ),
                children: <EditorSettingsCard />,
              },
              {
                key: 'display',
                label: (
                  <span className={styles.tabLabel}>
                    <PictureOutlined className={styles.tabIcon} />
                    {t['settings.displayTitle']}
                  </span>
                ),
                children: <DisplaySettingsCard />,
              },
              {
                key: 'deploy',
                label: (
                  <span className={styles.tabLabel}>
                    <RocketOutlined className={styles.tabIcon} />
                    {t['settings.deployTitle']}
                  </span>
                ),
                children: <DeploySettingsCard />,
              },
              {
                key: 'ai',
                label: (
                  <span className={styles.tabLabel}>
                    <ThunderboltOutlined className={styles.tabIcon} />
                    {t['ai.config']}
                  </span>
                ),
                children: <AISettingsCard />,
              },
            ]}
          />
        )}
      </Spin>
    </div>
  )
}

export default SettingsPage

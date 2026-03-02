import React, { useCallback } from 'react'
import { Card, Divider, Switch, Typography, message } from 'antd'
import { RocketOutlined } from '@ant-design/icons'
import useLocale from '../../../hooks/useLocale'
import { useLocalStorageState } from '../hooks/useLocalStorageState'

const { Text } = Typography

const DeploySettingsCard: React.FC = () => {
  const t = useLocale()
  const [skipGenerateEnabled, setSkipGenerateEnabled] = useLocalStorageState<boolean>('hexoProSkipGenerate', false, {
    serialize: (v) => v.toString(),
    deserialize: (raw) => raw === 'true',
  })

  const onChange = useCallback(
    (checked: boolean) => {
      setSkipGenerateEnabled(checked)
      message.success(checked ? t['settings.skipGenerateEnabled'] : t['settings.skipGenerateDisabled'])
    },
    [setSkipGenerateEnabled, t],
  )

  return (
    <Card>
      <Divider orientation="left">
        <RocketOutlined /> {t['settings.deployTitle']}
      </Divider>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <Text strong>{t['settings.skipGenerate']}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t['settings.skipGenerateDescription']}
            </Text>
          </div>
          <Switch
            checked={skipGenerateEnabled}
            onChange={onChange}
            checkedChildren={t['settings.enabled']}
            unCheckedChildren={t['settings.disabled']}
          />
        </div>
      </div>

      <div style={{ padding: '12px 16px', backgroundColor: '#f6f8fa', borderRadius: '6px', border: '1px solid #e1e4e8' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {t['settings.skipGenerateHelp']}
        </Text>
      </div>
    </Card>
  )
}

export default DeploySettingsCard


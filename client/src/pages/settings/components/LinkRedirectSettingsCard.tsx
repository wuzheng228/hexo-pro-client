import React, { useCallback } from 'react'
import { Card, Divider, Input, Switch, Typography, message } from 'antd'
import { GlobalOutlined, LinkOutlined } from '@ant-design/icons'
import useLocale from '../../../hooks/useLocale'
import { useLinkRedirectSettingsState } from '../hooks/useLinkRedirectSettingsState'

const { Text } = Typography

const LinkRedirectSettingsCard: React.FC = () => {
  const t = useLocale()
  const { enabled, domain, setEnabled, setDomain, persist } = useLinkRedirectSettingsState()

  const handleToggle = useCallback(
    (checked: boolean) => {
      setEnabled(checked)
      persist({ enabled: checked })
      message.success(checked ? t['settings.linkRedirectEnabled'] : t['settings.linkRedirectDisabled'])
    },
    [persist, setEnabled, t],
  )

  const handleDomainBlur = useCallback(() => {
    try {
      // eslint-disable-next-line no-new
      new URL(domain)
      persist({ domain })
      message.success(t['settings.customDomainSaved'])
    } catch {
      message.error(t['settings.customDomainFormatError'])
      const fallback = 'http://localhost:4000'
      setDomain(fallback)
      persist({ domain: fallback })
    }
  }, [domain, persist, setDomain, t])

  return (
    <Card>
      <Divider orientation="left">
        <LinkOutlined /> {t['settings.linkRedirectTitle']}
      </Divider>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <Text strong>{t['settings.enableLinkRedirect']}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t['settings.linkRedirectDescription']}
            </Text>
          </div>
          <Switch
            checked={enabled}
            onChange={handleToggle}
            checkedChildren={t['settings.enabled']}
            unCheckedChildren={t['settings.disabled']}
          />
        </div>
      </div>

      {enabled && (
        <div style={{ marginLeft: 16, marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>{t['settings.customDomain']}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t['settings.customDomainDescription']}
            </Text>
          </div>
          <Input
            prefix={<GlobalOutlined />}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onBlur={handleDomainBlur}
            placeholder="http://localhost:4000"
            style={{ width: '100%' }}
          />
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          padding: '12px 16px',
          backgroundColor: '#f6f8fa',
          borderRadius: '6px',
          border: '1px solid #e1e4e8',
        }}
      >
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {t['settings.linkRedirectAutoSave']}
        </Text>
      </div>
    </Card>
  )
}

export default LinkRedirectSettingsCard


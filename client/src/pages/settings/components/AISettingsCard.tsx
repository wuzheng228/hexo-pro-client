import React, { useCallback } from 'react'
import { Button, Card, Divider, Input, Spin, Switch, Typography, message } from 'antd'
import { LinkOutlined, LockOutlined, RocketOutlined } from '@ant-design/icons'
import useLocale from '../../../hooks/useLocale'
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/aiSettings'
import { useAISettingsState } from '../hooks/useAISettingsState'

const { Text } = Typography
const { TextArea } = Input

const AISettingsCard: React.FC = () => {
  const t = useLocale()
  const onSaved = useCallback(() => {
    message.success(t['settings.saveSuccess'])
  }, [t])
  const { aiSettings, loading, updateAISetting } = useAISettingsState(onSaved)

  const handleResetSystemPrompt = useCallback(() => {
    updateAISetting('systemPrompt', DEFAULT_SYSTEM_PROMPT)
  }, [updateAISetting])

  return (
    <Card>
      <Spin spinning={loading}>
      <Divider orientation="left">
        <RocketOutlined /> {t['ai.config']}
      </Divider>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong>{t['ai.configUrl']}</Text>
          <Input
            prefix={<LinkOutlined />}
            value={aiSettings.url}
            onChange={(e) => updateAISetting('url', e.target.value)}
            placeholder={t['ai.configUrlPlaceholder']}
            style={{ width: '100%', marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>{t['ai.configApiKey']}</Text>
          <Input.Password
            prefix={<LockOutlined />}
            value={aiSettings.apiKey}
            onChange={(e) => updateAISetting('apiKey', e.target.value)}
            placeholder={t['ai.configApiKeyPlaceholder']}
            style={{ width: '100%', marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>{t['ai.configModel']}</Text>
          <Input
            value={aiSettings.model}
            onChange={(e) => updateAISetting('model', e.target.value)}
            placeholder={t['ai.configModelPlaceholder']}
            style={{ width: '100%', marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text strong>{t['ai.configThinking']}</Text>
            <Switch
              checked={aiSettings.enableThinking}
              onChange={(checked) => updateAISetting('enableThinking', checked)}
              checkedChildren={t['settings.enabled']}
              unCheckedChildren={t['settings.disabled']}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>{t['ai.configMaxTokens']}</Text>
          <Input
            type="number"
            value={aiSettings.maxTokens}
            onChange={(e) => updateAISetting('maxTokens', parseInt(e.target.value, 10) || 4000)}
            style={{ width: '100%', marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>{t['ai.configTemperature']}</Text>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={aiSettings.temperature}
            onChange={(e) => updateAISetting('temperature', parseFloat(e.target.value) || 0.7)}
            style={{ width: '100%', marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>{t['ai.configTopP']}</Text>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={aiSettings.topP}
            onChange={(e) => updateAISetting('topP', parseFloat(e.target.value) || 0.9)}
            style={{ width: '100%', marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text strong>{t['ai.configSystemPrompt']}</Text>
            <Button type="link" size="small" onClick={handleResetSystemPrompt}>
              {t['ai.configSystemPromptReset']}
            </Button>
          </div>
          <TextArea
            rows={6}
            value={aiSettings.systemPrompt ?? ''}
            onChange={(e) => updateAISetting('systemPrompt', e.target.value)}
            placeholder={t['ai.configSystemPromptPlaceholder']}
            style={{ width: '100%', marginTop: 8 }}
          />
        </div>
      </div>
      </Spin>
    </Card>
  )
}

export default AISettingsCard


import React, { useCallback } from 'react'
import { Card, Divider, Select, Typography, message } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import useLocale from '../../../hooks/useLocale'
import { useLocalStorageState } from '../hooks/useLocalStorageState'

const { Option } = Select
const { Text } = Typography

const EditorSettingsCard: React.FC = () => {
  const t = useLocale()
  const [editorMode, setEditorMode] = useLocalStorageState<string>('hexoProEditorMode', 'ir', {
    serialize: (v) => v,
    deserialize: (raw) => raw,
  })

  const onChange = useCallback(
    (mode: string) => {
      setEditorMode(mode)
      message.success(t['settings.editorModeSaved'])
    },
    [setEditorMode, t],
  )

  return (
    <Card>
      <Divider orientation="left">
        <EditOutlined /> {t['settings.editorTitle']}
      </Divider>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <Text strong>{t['settings.editorMode']}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {t['settings.editorModeDescription']}
          </Text>
        </div>
        <Select style={{ width: '100%' }} value={editorMode} onChange={onChange} placeholder={t['settings.editorModeSelect']}>
          <Option value="ir">{t['settings.editorModeIR']}</Option>
          <Option value="wysiwyg">{t['settings.editorModeWYSIWYG']}</Option>
          <Option value="sv">{t['settings.editorModeSV']}</Option>
        </Select>
      </div>

      <div style={{ padding: '12px 16px', backgroundColor: '#f6f8fa', borderRadius: '6px', border: '1px solid #e1e4e8' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <span dangerouslySetInnerHTML={{ __html: t['settings.editorModeHelp'] }} />
        </Text>
      </div>
    </Card>
  )
}

export default EditorSettingsCard


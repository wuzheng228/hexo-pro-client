import React, { useCallback, useEffect, useState } from 'react'
import {
  Modal,
  Button,
  Radio,
  Progress,
  Space,
  Alert,
  Spin,
  Empty,
  Card,
  Divider,
  Tag,
  message,
  Steps,
} from 'antd'
import { ThunderboltOutlined, CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import useLocale from '@/hooks/useLocale'
import service from '@/utils/api'
import styles from '../style.module.less'

interface SchemaGeneratorModalProps {
  themeId: string
  themeName?: string
  visible: boolean
  onClose: () => void
  onApply: (yamlContent: string) => void
}

type Step = 'check' | 'language' | 'processing' | 'complete' | 'error'

interface ProcessLog {
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  timestamp: number
}

const SchemaGeneratorModal: React.FC<SchemaGeneratorModalProps> = ({
  themeId,
  themeName,
  visible,
  onClose,
  onApply,
}) => {
  const t = useLocale()
  const [step, setStep] = useState<Step>('check')
  const [language, setLanguage] = useState<'zh' | 'en' | 'fr'>('zh')
  const [progress, setProgress] = useState(0)
  const [currentChunk, setCurrentChunk] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [logs, setLogs] = useState<ProcessLog[]>([])
  const [result, setResult] = useState('')
  const [aiConfigValid, setAiConfigValid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // 检查 AI 配置
  useEffect(() => {
    if (!visible) return
    
    const checkAIConfig = async () => {
      try {
        const res = await service.get('/hexopro/api/ai/settings')
        const valid = !!res.data?.url && !!res.data?.apiKey && !!res.data?.model
        setAiConfigValid(valid)
        if (!valid) {
          addLog('error', t['theme.schema.noAIConfig'] || 'AI 配置不完整')
        }
      } catch (error) {
        addLog('error', t['theme.schema.checkConfigFailed'] || '检查配置失败')
        setAiConfigValid(false)
      }
    }
    checkAIConfig()
  }, [visible, t])

  const addLog = useCallback((type: ProcessLog['type'], message: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: Date.now() }])
  }, [])

  const handleGenerate = async () => {
    if (!aiConfigValid) {
      message.error(t['theme.schema.noAIConfig'] || 'AI 配置不完整')
      return
    }

    setStep('processing')
    setLogs([])
    setProgress(0)
    setCurrentChunk(0)
    setTotalChunks(0)
    setErrorMessage('')
    setResult('')

    const controller = new AbortController()
    setAbortController(controller)

    try {
      addLog('info', t['theme.schema.startProcessing'] || '开始处理配置文件...')

      const response = await fetch('/hexopro/api/theme/schema/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId, language }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      if (!response.body) {
        throw new Error(t['theme.schema.noResponseBody'] || '没有响应数据')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'start') {
                setTotalChunks(data.totalChunks)
                addLog('info', `${t['theme.schema.totalChunks'] || '总计'}: ${data.totalChunks}`)
              } else if (data.type === 'chunk_processing') {
                setCurrentChunk(data.current)
                const progressValue = (data.current / data.total) * 100
                setProgress(Math.min(progressValue, 95))
                addLog('info', data.status || `${t['theme.schema.processing'] || '处理'} ${data.current}/${data.total}`)
              } else if (data.type === 'chunk_result') {
                addLog('success', `${t['theme.schema.chunkComplete'] || '第 '} ${data.chunk} ${t['theme.schema.chunkComplete2'] || '段处理完成'}`)
              } else if (data.type === 'complete') {
                setResult(data.fullResult)
                setProgress(100)
                addLog('success', data.summary || t['theme.schema.generateSuccess'] || '配置优化完成')
                setStep('complete')
              } else if (data.type === 'error') {
                throw new Error(data.message || t['theme.schema.unknownError'] || '未知错误')
              }
            } catch (parseError) {
              // 忽略 JSON 解析错误
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        addLog('warning', t['theme.schema.cancelled'] || '操作已取消')
        setStep('check')
      } else {
        const msg = error instanceof Error ? error.message : String(error)
        addLog('error', `${t['theme.schema.error'] || '错误'}: ${msg}`)
        setErrorMessage(msg)
        setStep('error')
      }
    } finally {
      setAbortController(null)
    }
  }

  const handleCancel = () => {
    if (abortController) {
      abortController.abort()
    }
    setStep('check')
    setLogs([])
    onClose()
  }

  const handleApply = () => {
    onApply(result)
    message.success(t['theme.schema.applySuccess'] || '已应用配置')
    handleCancel()
  }

  const handleDownloadFile = () => {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/yaml;charset=utf-8,' + encodeURIComponent(result))
    element.setAttribute('download', `${themeId}_config.yml`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleRetry = () => {
    setStep('language')
    setErrorMessage('')
  }

  return (
    <Modal
      title={
        <span>
          <ThunderboltOutlined style={{ marginRight: 8, color: '#faad14' }} />
          {t['theme.schema.title'] || 'AI 优化配置'}
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      width={700}
      footer={
        step === 'check' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={handleCancel}>{t['universal.cancel'] || '取消'}</Button>
            <Button
              type="primary"
              onClick={() => setStep('language')}
              disabled={!aiConfigValid}
              loading={loading}
            >
              {t['universal.continue'] || '继续'}
            </Button>
          </div>
        )
      }
      destroyOnClose
    >
      {/* Step 1: 检查 AI 配置 */}
      {step === 'check' && (
        <div className={styles.schemaGeneratorStep}>
          <Alert
            message={t['theme.schema.checkAIConfig'] || '检查 AI 配置'}
            description={
              aiConfigValid
                ? t['theme.schema.aiConfigValid'] || 'AI 配置已完整'
                : t['theme.schema.aiConfigInvalid'] || 'AI 配置不完整，请先在设置中配置'
            }
            type={aiConfigValid ? 'success' : 'warning'}
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>{t['theme.schema.howItWorks'] || '工作原理'}:</strong>
              </div>
              <ul style={{ marginLeft: 16, lineHeight: 1.8 }}>
                <li>{t['theme.schema.step1'] || '1. 分析你的主题配置文件'}</li>
                <li>{t['theme.schema.step2'] || '2. 调用 AI 为每个配置字段生成 schema 元数据'}</li>
                <li>{t['theme.schema.step3'] || '3. 添加易懂的标签和说明'}</li>
                <li>{t['theme.schema.step4'] || '4. 在表单模式中显示更友好的界面'}</li>
              </ul>
            </div>
          </Card>

          {!aiConfigValid && (
            <Alert
              message={t['theme.schema.needAIConfig'] || '需要配置 AI'}
              description={
                <div>
                  {t['theme.schema.pleaseConfigAI'] || '请在'}
                  <Button type="link" size="small" style={{ padding: 0 }}>
                    {t['settings.title'] || '设置'}
                  </Button>
                  {t['theme.schema.configAIDescription'] || '中配置 API 地址、密钥和模型'}
                </div>
              }
              type="error"
              showIcon
            />
          )}
        </div>
      )}

      {/* Step 2: 选择语言 */}
      {step === 'language' && (
        <div className={styles.schemaGeneratorStep}>
          <div style={{ marginBottom: 24 }}>
            <strong>{t['theme.schema.selectLanguage'] || '选择生成语言'}</strong>
            <p style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 12, marginTop: 8 }}>
              {t['theme.schema.languageDescription'] || 'Schema 注释将使用选定的语言'}
            </p>
          </div>

          <Radio.Group
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <Card
              size="small"
              hoverable
              onClick={() => setLanguage('zh')}
              style={{ cursor: 'pointer', border: language === 'zh' ? '2px solid #1890ff' : undefined }}
            >
              <Radio value="zh">
                <strong>中文</strong>
                <span style={{ marginLeft: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                  {t['theme.schema.chinese'] || 'Simplified Chinese'}
                </span>
              </Radio>
            </Card>

            <Card
              size="small"
              hoverable
              onClick={() => setLanguage('en')}
              style={{ cursor: 'pointer', border: language === 'en' ? '2px solid #1890ff' : undefined }}
            >
              <Radio value="en">
                <strong>English</strong>
                <span style={{ marginLeft: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                  {t['theme.schema.english'] || 'English'}
                </span>
              </Radio>
            </Card>

            <Card
              size="small"
              hoverable
              onClick={() => setLanguage('fr')}
              style={{ cursor: 'pointer', border: language === 'fr' ? '2px solid #1890ff' : undefined }}
            >
              <Radio value="fr">
                <strong>Français</strong>
                <span style={{ marginLeft: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                  {t['theme.schema.french'] || 'French'}
                </span>
              </Radio>
            </Card>
          </Radio.Group>

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setStep('check')}>{t['universal.back'] || '上一步'}</Button>
            <Button type="primary" onClick={handleGenerate} loading={loading}>
              {t['theme.schema.startGenerate'] || '开始生成'}
            </Button>
          </Space>
        </div>
      )}

      {/* Step 3: 处理中 */}
      {step === 'processing' && (
        <div className={styles.schemaGeneratorStep}>
          <div style={{ marginBottom: 24 }}>
            <Progress
              type="circle"
              percent={Math.round(progress)}
              width={100}
              strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              style={{ display: 'inline-block', marginRight: 24 }}
            />
            <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {t['theme.schema.processing'] || '处理中...'}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.45)', marginTop: 4 }}>
                {totalChunks > 0
                  ? `${currentChunk}/${totalChunks} ${t['theme.schema.chunks'] || '段'}`
                  : '初始化中...'}
              </div>
            </div>
          </div>

          <div
            className={styles.schemaGeneratorLogs}
            style={{
              maxHeight: 300,
              overflowY: 'auto',
              border: '1px solid #f0f0f0',
              borderRadius: 4,
              padding: 12,
              backgroundColor: '#fafafa',
              marginBottom: 16,
              fontFamily: 'monospace',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{t['theme.schema.waitingLogs'] || '等待中...'}</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} style={{ marginBottom: 4 }}>
                  <Tag color={log.type === 'error' ? 'red' : log.type === 'success' ? 'green' : 'blue'}>
                    {log.type}
                  </Tag>
                  <span style={{ marginLeft: 8 }}>{log.message}</span>
                </div>
              ))
            )}
          </div>

          <Button
            danger
            onClick={() => {
              abortController?.abort()
              setStep('check')
            }}
            block
          >
            {t['universal.cancel'] || '取消'}
          </Button>
        </div>
      )}

      {/* Step 4: 完成 */}
      {step === 'complete' && (
        <div className={styles.schemaGeneratorStep}>
          <Alert
            message={
              <span>
                <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                {t['theme.schema.success'] || '配置优化完成!'}
              </span>
            }
            type="success"
            showIcon={false}
            style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}
          />

          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14 }}>
              <div style={{ marginBottom: 12 }}>
                <strong>{t['theme.schema.resultPreview'] || '预览（前 500 字符）'}</strong>
              </div>
              <pre
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: 12,
                  borderRadius: 4,
                  overflow: 'auto',
                  maxHeight: 200,
                  fontSize: 12,
                  margin: 0,
                }}
              >
                {result.substring(0, 500)}...
              </pre>
            </div>
          </Card>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadFile}>
              {t['theme.schema.download'] || '下载文件'}
            </Button>
            <Button onClick={() => setStep('language')}>{t['theme.schema.regenerate'] || '重新生成'}</Button>
            <Button type="primary" onClick={handleApply}>
              {t['theme.schema.apply'] || '应用到编辑器'}
            </Button>
          </Space>
        </div>
      )}

      {/* Step 5: 错误 */}
      {step === 'error' && (
        <div className={styles.schemaGeneratorStep}>
          <Alert
            message={
              <span>
                <CloseCircleOutlined style={{ marginRight: 8, color: '#f5222d' }} />
                {t['theme.schema.error'] || '处理失败'}
              </span>
            }
            description={errorMessage}
            type="error"
            showIcon={false}
            style={{ marginBottom: 16 }}
          />

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setStep('language')}>{t['universal.back'] || '返回'}</Button>
            <Button type="primary" onClick={handleRetry}>
              {t['theme.schema.retry'] || '重试'}
            </Button>
          </Space>
        </div>
      )}
    </Modal>
  )
}

export default SchemaGeneratorModal

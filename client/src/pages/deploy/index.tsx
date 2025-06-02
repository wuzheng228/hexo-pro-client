import React, { useEffect, useState, useRef } from 'react'
import { Card, Form, Input, Button, message, Divider, Alert, Spin, Typography, Space, Row, Col, Progress, Timeline } from 'antd'
import { GithubOutlined, SaveOutlined, RocketOutlined, InfoCircleOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { service } from '@/utils/api'
import useLocale from '@/hooks/useLocale'
import styles from './style.module.less'

const { Title, Paragraph, Text } = Typography

const DeployPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [deployLoading, setDeployLoading] = useState(false)
  const t = useLocale()
  const [deployStatus, setDeployStatus] = useState({
    isDeploying: false,
    progress: 0,
    stage: 'idle',
    lastDeployTime: t['deploy.status.unknownTime'],
    logs: [],
    hasDeployGit: false,
    error: null
  })
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchDeployConfig = async () => {
    try {
      setLoading(true)
      const res = await service.get('/hexopro/api/deploy/config')
      form.setFieldsValue(res.data)
      await fetchDeployStatus()
    } catch (error) {
      message.error(t['deploy.config.fetchFailed'])
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeployStatus = async () => {
    try {
      const statusRes = await service.get('/hexopro/api/deploy/status')
      
      statusRes.data.logs = statusRes.data.logs.map((item)=>t[item] || item)
      // console.log(statusRes.data)
      setDeployStatus(statusRes.data)
      return statusRes.data
    } catch (error) {
      message.error(t['deploy.status.fetchFailed'])
      console.error(error)
      return null
    }
  }

  const saveConfig = async (values) => {
    try {
      setLoading(true)
      const res = await service.post('/hexopro/api/deploy/save-config', values)
      message.success(t['deploy.config.saveSuccess'])
      form.setFieldsValue(res.data)
    } catch (error) {
      message.error(t['deploy.config.saveFailed'])
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const executeDeploy = async () => {
    try {
      setDeployLoading(true)
      const res = await service.post('/hexopro/api/deploy/execute')
      if (res.data.isDeploying) {
        message.success(t['deploy.status.deploySuccess'])
        startPolling()
      } else {
        message.success(t['deploy.status.deployCompleted'])
      }
    } catch (error) {
      message.error(t['deploy.status.deployFailed'] + (error.response?.data || error.message))
      console.error(error)
    } finally {
      setDeployLoading(false)
    }
  }

  const startPolling = () => {
    // 清除现有的轮询
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    
    // 设置新的轮询
    pollingRef.current = setInterval(async () => {
      const status = await fetchDeployStatus()
      
      // 如果部署完成或失败，停止轮询
      if (status && !status.isDeploying) {
        if (status.error) {
          message.error(t['deploy.status.deployFailed'] + status.error)
        } else if (status.stage === 'completed') {
          message.success(t['deploy.status.completedMessage'])
        }
        
        stopPolling()
      }
    }, 3000) // 每3秒轮询一次
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const getStageText = (stage) => {
    const stageMap = {
      'idle': t['deploy.status.idle'],
      'started': t['deploy.status.started'],
      'cleaning': t['deploy.status.cleaning'],
      'generating': t['deploy.status.generating'],
      'deploying': t['deploy.status.deployingStage'],
      'completed': t['deploy.status.completed'],
      'failed': t['deploy.status.failed']
    }
    return stageMap[stage] || stage
  }

  const getStageIcon = (stage) => {
    if (deployStatus.isDeploying) {
      return <LoadingOutlined style={{ color: '#1890ff' }} />
    }
    
    if (stage === 'completed') {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />
    }
    
    if (stage === 'failed') {
      return <CloseCircleOutlined style={{ color: '#f5222d' }} />
    }
    
    return <InfoCircleOutlined />
  }

  useEffect(() => {
    fetchDeployConfig()
    
    // 检查是否正在部署，如果是则开始轮询
    fetchDeployStatus().then(status => {
      if (status && status.isDeploying) {
        startPolling()
      }
    })
    
    // 组件卸载时清除轮询
    return () => {
      stopPolling()
    }
  }, [])

  const resetDeployStatus = async () => {
    try {
      setLoading(true)
      await service.post('/hexopro/api/deploy/reset-status')
      message.success(t['deploy.status.resetSuccess'])
      await fetchDeployStatus()
    } catch (error) {
      message.error(t['deploy.status.resetFailed'])
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const cleanupDeployDir = async () => {
    try {
      setLoading(true)
      const res = await service.post('/hexopro/api/deploy/cleanup')
      message.success(res.data.message)
      await fetchDeployStatus()
    } catch (error) {
      message.error(t['deploy.cleanup.failed'] || '清理部署目录失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.deployContainer}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <GithubOutlined />
                <span>{t['deploy.config.title']}</span>
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={() => form.submit()}
                loading={loading}
              >
                {t['deploy.config.save']}
              </Button>
            }
          >
            <Spin spinning={loading}>
              <Form
                form={form}
                layout="vertical"
                onFinish={saveConfig}
                initialValues={{
                  repository: '',
                  branch: 'main',
                  message: 'Site updated: {{ now("YYYY-MM-DD HH:mm:ss") }}',
                  token: ''
                }}
              >
                <Form.Item
                  label={t['deploy.config.repository']}
                  name="repository"
                  rules={[{ required: true, message: t['deploy.config.repository'] + t['settings.usernameRequired'] }]}
                  tooltip={t['deploy.config.repositoryTooltip']}
                >
                  <Input placeholder={t['deploy.config.repositoryPlaceholder']} prefix={<GithubOutlined />} />
                </Form.Item>

                <Form.Item
                  label={t['deploy.config.branch']}
                  name="branch"
                  rules={[{ required: true, message: t['deploy.config.branch'] + t['settings.usernameRequired'] }]}
                >
                  <Input placeholder={t['deploy.config.branchPlaceholder']} />
                </Form.Item>

                <Form.Item
                  label={t['deploy.config.message']}
                  name="message"
                  rules={[{ required: true, message: t['deploy.config.message'] + t['settings.usernameRequired'] }]}
                >
                  <Input placeholder={t['deploy.config.messagePlaceholder']} />
                </Form.Item>

                <Form.Item
                  label={t['deploy.config.token']}
                  name="token"
                  tooltip={t['deploy.config.tokenTooltip']}
                >
                  <Input.Password placeholder={t['deploy.config.tokenPlaceholder']} />
                </Form.Item>

                <Alert
                  message={t['deploy.config.alertTitle']}
                  description={t['deploy.config.alertDesc']}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </Form>
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <RocketOutlined />
                <span>{t['deploy.action.title']}</span>
              </Space>
            }
            extra={
              <Button 
                type="link" 
                icon={<ReloadOutlined />} 
                onClick={resetDeployStatus}
                loading={loading}
              >
                {t['deploy.action.reset']}
              </Button>
            }
          >
            <Spin spinning={loading}>
              <div className={styles.deployStatus}>
                <Paragraph>
                  <Text strong>{t['deploy.status.lastTime'] + ': '}</Text> 
                  <Text>{deployStatus.lastDeployTime}</Text>
                </Paragraph>
                
                <Paragraph>
                  <Text strong>{t['deploy.status.status'] + ': '}</Text>
                  {deployStatus.hasDeployGit ? (
                    <Text type="success">{t['deploy.status.inited']}</Text>
                  ) : (
                    <Text type="warning">{t['deploy.status.notInited']}</Text>
                  )}
                </Paragraph>

                {deployStatus.isDeploying && (
                  <>
                    <Divider />
                    <div className={styles.deployProgress}>
                      <Paragraph>
                        <Text strong>{t['deploy.status.currentStage'] + ': '}</Text>
                        <Text>{getStageText(deployStatus.stage)}</Text>
                      </Paragraph>
                      <Progress 
                        percent={deployStatus.progress} 
                        status={deployStatus.error ? "exception" : "active"} 
                      />
                    </div>
                  </>
                )}

                <Divider />

                <Button 
                  type="primary" 
                  icon={<RocketOutlined />} 
                  size="large" 
                  block
                  loading={deployLoading || deployStatus.isDeploying}
                  onClick={executeDeploy}
                  disabled={deployStatus.isDeploying}
                >
                  {deployStatus.isDeploying ? t['deploy.status.inProgress'] : t['deploy.status.deploy']}
                </Button>

                {deployStatus.hasDeployGit && (
                  <Button 
                    type="default" 
                    danger
                    size="large" 
                    block
                    style={{ marginTop: 8 }}
                    loading={loading}
                    onClick={cleanupDeployDir}
                    disabled={deployStatus.isDeploying}
                  >
                    {t['deploy.cleanup.button'] || '清理部署目录'}
                  </Button>
                )}
              </div>
            </Spin>
          </Card>

          {deployStatus.logs && deployStatus.logs.length > 0 && (
            <Card 
              title={
                <Space>
                  <InfoCircleOutlined />
                  <span>{t['deploy.log.title']}</span>
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              <div className={styles.deployLogs}>
                <Timeline style={{ padding: '10px 10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {deployStatus.logs.map((log, index) => (
                    <Timeline.Item 
                      key={index}
                      dot={index === deployStatus.logs.length - 1 ? getStageIcon(deployStatus.stage) : null}
                    >
                      <Text style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{log}</Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            </Card>
          )}

          <Card 
            title={
              <Space>
                <InfoCircleOutlined />
                <span>{t['deploy.help.title']}</span>
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            <Typography>
              <Title level={5}>{t['deploy.help.how']}</Title>
              <Paragraph>
                {t['deploy.help.step1']}
              </Paragraph>
              <Paragraph>
                {t['deploy.help.step2']}
              </Paragraph>
              <Paragraph>
                {t['deploy.help.step3']}
              </Paragraph>
              <Paragraph>
                <Text type="secondary">{t['deploy.help.note']}</Text>
              </Paragraph>
            </Typography>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DeployPage
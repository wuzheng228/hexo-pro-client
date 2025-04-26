import React, { useEffect, useState, useRef } from 'react';
import { Card, Form, Input, Button, message, Divider, Alert, Spin, Typography, Space, Row, Col, Progress, Timeline } from 'antd';
import { GithubOutlined, SaveOutlined, RocketOutlined, InfoCircleOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { service } from '@/utils/api';
import useLocale from '@/hooks/useLocale';
import styles from './style.module.less';

const { Title, Paragraph, Text } = Typography;

const DeployPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployStatus, setDeployStatus] = useState({
    isDeploying: false,
    progress: 0,
    stage: 'idle',
    lastDeployTime: '未知',
    logs: [],
    hasDeployGit: false,
    error: null
  });
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const t = useLocale();

  // 获取部署配置
  const fetchDeployConfig = async () => {
    try {
      setLoading(true);
      const res = await service.get('/hexopro/api/deploy/config');
      form.setFieldsValue(res.data);
      
      // 获取部署状态
      await fetchDeployStatus();
    } catch (error) {
      message.error('获取部署配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 获取部署状态
  const fetchDeployStatus = async () => {
    try {
      const statusRes = await service.get('/hexopro/api/deploy/status');
      setDeployStatus(statusRes.data);
      return statusRes.data;
    } catch (error) {
      console.error('获取部署状态失败', error);
      return null;
    }
  };

  // 保存配置
  const saveConfig = async (values) => {
    try {
      setLoading(true);
      const res = await service.post('/hexopro/api/deploy/save-config', values);
      message.success('配置保存成功，_config.yml 已自动更新');
      form.setFieldsValue(res.data);
    } catch (error) {
      message.error('保存配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 执行部署
  const executeDeploy = async () => {
    try {
      setDeployLoading(true);
      const res = await service.post('/hexopro/api/deploy/execute');
      
      if (res.data.isDeploying) {
        message.success('部署已开始，请等待完成');
        // 开始轮询部署状态
        startPolling();
      } else {
        message.success('部署成功');
      }
    } catch (error) {
      message.error('部署失败: ' + (error.response?.data || error.message));
      console.error(error);
    } finally {
      setDeployLoading(false);
    }
  };

  // 开始轮询部署状态
  const startPolling = () => {
    // 清除现有的轮询
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    // 设置新的轮询
    pollingRef.current = setInterval(async () => {
      const status = await fetchDeployStatus();
      
      // 如果部署完成或失败，停止轮询
      if (status && !status.isDeploying) {
        if (status.error) {
          message.error(`部署失败: ${status.error}`);
        } else if (status.stage === 'completed') {
          message.success('部署成功完成！');
        }
        
        stopPolling();
      }
    }, 3000); // 每3秒轮询一次
  };

  // 停止轮询
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // 获取部署阶段的显示文本
  const getStageText = (stage) => {
    const stageMap = {
      'idle': '空闲',
      'started': '已开始',
      'cleaning': '清理中',
      'generating': '生成静态文件',
      'deploying': '部署到 GitHub',
      'completed': '已完成',
      'failed': '失败'
    };
    return stageMap[stage] || stage;
  };

  // 获取部署阶段的图标
  const getStageIcon = (stage) => {
    if (deployStatus.isDeploying) {
      return <LoadingOutlined style={{ color: '#1890ff' }} />;
    }
    
    if (stage === 'completed') {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
    
    if (stage === 'failed') {
      return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
    }
    
    return <InfoCircleOutlined />;
  };

  useEffect(() => {
    fetchDeployConfig();
    
    // 检查是否正在部署，如果是则开始轮询
    fetchDeployStatus().then(status => {
      if (status && status.isDeploying) {
        startPolling();
      }
    });
    
    // 组件卸载时清除轮询
    return () => {
      stopPolling();
    };
  }, []);

  // 重置部署状态
  const resetDeployStatus = async () => {
    try {
      setLoading(true);
      await service.post('/hexopro/api/deploy/reset-status');
      message.success('部署状态已重置');
      await fetchDeployStatus();
    } catch (error) {
      message.error('重置部署状态失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.deployContainer}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <GithubOutlined />
                <span>GitHub 部署配置</span>
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={() => form.submit()}
                loading={loading}
              >
                保存配置
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
                  label="GitHub 仓库地址"
                  name="repository"
                  rules={[{ required: true, message: '请输入 GitHub 仓库地址' }]}
                  tooltip="格式: username/repository"
                >
                  <Input placeholder="例如: username/blog" prefix={<GithubOutlined />} />
                </Form.Item>

                <Form.Item
                  label="分支"
                  name="branch"
                  rules={[{ required: true, message: '请输入分支名称' }]}
                >
                  <Input placeholder="例如: main, master, gh-pages" />
                </Form.Item>

                <Form.Item
                  label="提交信息"
                  name="message"
                  rules={[{ required: true, message: '请输入提交信息' }]}
                >
                  <Input placeholder="提交信息模板" />
                </Form.Item>

                <Form.Item
                  label="GitHub Token (可选)"
                  name="token"
                  tooltip="用于私有仓库或需要认证的操作，请妥善保管"
                >
                  <Input.Password placeholder="如果需要认证，请输入 GitHub Token" />
                </Form.Item>

                <Alert
                  message="提示"
                  description="保存配置后，系统将自动更新 _config.yml 文件中的部署配置，无需手动修改。"
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
                <span>部署操作</span>
              </Space>
            }
            extra={
              <Button 
                type="link" 
                icon={<ReloadOutlined />} 
                onClick={resetDeployStatus}
                loading={loading}
              >
                重置状态
              </Button>
            }
          >
            <Spin spinning={loading}>
              <div className={styles.deployStatus}>
                <Paragraph>
                  <Text strong>最近部署时间: </Text> 
                  <Text>{deployStatus.lastDeployTime}</Text>
                </Paragraph>
                
                <Paragraph>
                  <Text strong>部署状态: </Text>
                  {deployStatus.hasDeployGit ? (
                    <Text type="success">已初始化</Text>
                  ) : (
                    <Text type="warning">未初始化</Text>
                  )}
                </Paragraph>

                {deployStatus.isDeploying && (
                  <>
                    <Divider />
                    <div className={styles.deployProgress}>
                      <Paragraph>
                        <Text strong>当前阶段: </Text>
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
                  {deployStatus.isDeploying ? '部署进行中...' : '执行部署'}
                </Button>
              </div>
            </Spin>
          </Card>

          {deployStatus.logs && deployStatus.logs.length > 0 && (
            <Card 
              title={
                <Space>
                  <InfoCircleOutlined />
                  <span>部署日志</span>
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              <div className={styles.deployLogs}>
                <Timeline style={{ padding: '10px 10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {deployStatus.logs.slice(-10).map((log, index) => (
                    <Timeline.Item 
                      key={index}
                      dot={index === deployStatus.logs.slice(-10).length - 1 ? getStageIcon(deployStatus.stage) : null}
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
                <span>部署帮助</span>
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            <Typography>
              <Title level={5}>如何配置 GitHub 部署?</Title>
              <Paragraph>
                1. 确保已安装 <Text code>hexo-deployer-git</Text> 插件
              </Paragraph>
              <Paragraph>
                2. 填写上方表单并保存（系统会自动更新 <Text code>_config.yml</Text>）
              </Paragraph>
              <Paragraph>
                3. 点击"执行部署"按钮
              </Paragraph>
              <Paragraph>
                <Text type="secondary">注意：如果使用 Token，系统会自动配置带认证的仓库地址</Text>
              </Paragraph>
            </Typography>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DeployPage;
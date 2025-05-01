import React, { useState, useEffect, useContext } from 'react'
import { Card, Form, Input, Button, Upload, message, Switch, Spin, Divider, Typography, Alert } from 'antd'
import { UploadOutlined, UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons'
import styles from './style/index.module.less'
import useLocale from '../../hooks/useLocale'
import service from '@/utils/api'
import { GlobalContext } from '@/context'
import { useDispatch } from 'react-redux'

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
  const t = useLocale()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [menuCollapsed, setMenuCollapsed] = useState(false)
  const { setTheme } = useContext(GlobalContext)
  const dispatch = useDispatch()
  const [isFirstUse, setIsFirstUse] = useState(false)

  // 检查是否是首次使用
  useEffect(() => {
    const checkFirstUse = async () => {
      try {
        setFetchLoading(true)
        const res = await service.get('/hexopro/api/settings/check-first-use')
        console.log(res)
        if (res.data.code === 0) {
          console.log(res)
          setIsFirstUse(res.data.data.isFirstUse)
          
          // 如果是首次使用，不需要获取设置
          if (!res.data.data.isFirstUse) {
            fetchSettings()
          } else {
            setFetchLoading(false)
          }
        } else {
          message.error(res.data.msg || '检查系统状态失败')
          setFetchLoading(false)
        }
      } catch (error) {
        console.error('检查系统状态失败:', error)
        message.error('检查系统状态失败')
        setFetchLoading(false)
      }
    }
    
    checkFirstUse()
  }, [])

  // 获取当前设置
  const fetchSettings = async () => {
    try {
      setFetchLoading(true)
      const res = await service.get('/hexopro/api/settings')
      if (res.data.code === 0) {
        const { username, avatar, menuCollapsed } = res.data.data
        form.setFieldsValue({ username })
        setAvatarUrl(avatar)
        setMenuCollapsed(menuCollapsed)
      } else {
        message.error(res.data.msg || t['settings.fetchError'])
      }
    } catch (error) {
      console.error('获取设置失败:', error)
      message.error(t['settings.fetchError'])
    } finally {
      setFetchLoading(false)
    }
  }

  // 注册新用户（首次使用）
  const onRegister = async (values: any) => {
    try {
      setLoading(true)
      const { username, password, confirmPassword } = values
      
      const res = await service.post('/hexopro/api/settings/register', {
        username,
        password,
        confirmPassword
      })
      
      if (res.data.code === 0) {
        message.success('注册成功！')
        
        // 只保存令牌
        localStorage.setItem('hexoProToken', res.data.data.token)
        
        // 更新全局状态
        dispatch({
          type: 'update-userInfo',
          payload: { 
            userInfo: { 
              username: res.data.data.username,
              avatar: res.data.data.avatar || ''
            } 
          }
        })
        
        // 刷新页面以应用新状态
        window.location.reload()
      } else {
        message.error(res.data.msg || '注册失败')
      }
    } catch (error) {
      console.error('注册失败:', error)
      message.error('注册失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存设置
  const onFinish = async (values: any) => {
    try {
      setLoading(true)
      const { username, password, confirmPassword } = values
      
      const res = await service.post('/hexopro/api/settings/update', {
        username,
        password,
        confirmPassword,
        menuCollapsed
      })
      
      if (res.data.code === 0) {
        message.success(t['settings.saveSuccess'])
        
        // 更新全局状态中的菜单折叠状态
        dispatch({
          type: 'update-menu-collapsed',
          payload: { menuCollapsed }
        })
        
        // 清除密码字段
        form.setFieldsValue({
          password: '',
          confirmPassword: ''
        })
        
        // 如果修改了密码，提示用户需要重新登录
        if (password) {
          message.info(t['settings.passwordChangedRelogin'])
          setTimeout(() => {
            // 只需要移除token
            localStorage.removeItem('hexoProToken')
            window.location.href = '/pro/login'
          }, 2000)
        }
      } else {
        message.error(res.data.msg || t['settings.saveError'])
      }
    } catch (error) {
      console.error('保存设置失败:', error)
      message.error(t['settings.saveError'])
    } finally {
      setLoading(false)
    }
  }

  // 上传前检查
  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isJpgOrPng) {
      message.error(t['settings.uploadImageTypeError'])
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error(t['settings.uploadImageSizeError'])
    }
    return isJpgOrPng && isLt2M
  }

  // 处理上传变化
  const handleUploadChange = async (info: any) => {
    if (info.file.status === 'uploading') {
      return
    }
    
    if (info.file.status === 'done') {
      try {
        // 获取文件对象
        const file = info.file.originFileObj
        
        // 创建 FileReader 读取文件为 base64
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = async () => {
          const base64Data = reader.result
          
          // 上传到服务器 - 使用与图床相同的API格式
          const res = await service.post('/hexopro/api/settings/upload-avatar', {
            data: base64Data,
            filename: file.name
          })
          
          if (res.data.code === 0) {
            setAvatarUrl(res.data.data.url)
            message.success(t['settings.uploadSuccess'])
            
            // 更新全局用户信息中的头像
            dispatch({
              type: 'update-userInfo',
              payload: { userInfo: { avatar: res.data.data.url } }
            })
          } else {
            message.error(res.data.msg || t['settings.uploadError'])
          }
        }
      } catch (error) {
        console.error('上传头像失败:', error)
        message.error(t['settings.uploadError'])
      }
    } else if (info.file.status === 'error') {
      message.error(t['settings.uploadError'])
    }
  }

  // 处理菜单折叠状态变化
  const handleMenuCollapsedChange = (checked: boolean) => {
    setMenuCollapsed(checked)
  }

  // 跳过设置直接进入
  const skipSettings = () => {
    // 设置一个标记，表示用户选择了跳过设置
    localStorage.setItem('hexoProSkipSettings', 'true');
    message.success('您可以稍后再设置账号密码');
    window.location.href = '/pro';
  }

  return (
    <div className={styles.container}>
      <Spin spinning={fetchLoading}>
        <Card className={styles.card}>
          <Title level={2}>{isFirstUse ? '初始化设置' : t['settings.title']}</Title>
          
          {isFirstUse && (
            <Alert
              message="欢迎使用 Hexo Pro"
              description='这是您首次使用系统，请设置管理员账号和密码。如果您不想现在设置，可以点击"跳过设置"按钮。"'
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
              action={
                <Button size="small" onClick={skipSettings}>
                  跳过设置
                </Button>
              }
            />
          )}
          
          <Form
            form={form}
            layout="vertical"
            onFinish={isFirstUse ? onRegister : onFinish}
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              label="确认密码"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ width: 120 }}
              >
                创建账号
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  )
}

export default SettingsPage

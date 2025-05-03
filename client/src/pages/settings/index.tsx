import React, { useState, useEffect, useContext } from 'react'
import { Card, Form, Input, Button, Upload, message, Switch, Spin, Divider, Typography, Alert, Modal, Avatar, Space, Pagination } from 'antd'
import { UploadOutlined, UserOutlined, LockOutlined, SaveOutlined, PictureOutlined } from '@ant-design/icons'
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
  // 新增状态
  const [imagePickerVisible, setImagePickerVisible] = useState(false)
  const [imageList, setImageList] = useState([])
  const [imageLoading, setImageLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [total, setTotal] = useState(0)

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
        confirmPassword,
        avatar: avatarUrl // 添加头像URL
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
        menuCollapsed,
        avatar: avatarUrl // 添加头像URL
      })
      
      if (res.data.code === 0) {
        message.success(t['settings.saveSuccess'])
        
        // 更新全局状态中的菜单折叠状态和头像
        dispatch({
          type: 'update-menu-collapsed',
          payload: { menuCollapsed }
        })
        
        // 更新用户信息（包括头像）
        dispatch({
          type: 'update-userInfo',
          payload: { 
            userInfo: { 
              username: username,
              avatar: avatarUrl
            } 
          }
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

  // 跳过设置直接进入
  const skipSettings = () => {
    // 设置一个标记，表示用户选择了跳过设置
    localStorage.setItem('hexoProSkipSettings', 'true');
    message.success('您可以稍后再设置账号密码');
    window.location.href = '/pro';
  }

  // 上传头像
  const handleAvatarUpload = async (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true)
      return
    }
    
    if (info.file.status === 'done') {
      setLoading(false)
      if (info.file.response && info.file.response.code === 0) {
        const avatarUrl = info.file.response.src
        // 拼接唯一参数，防止缓存
        const uniqueUrl = avatarUrl + (avatarUrl.includes('?') ? '&' : '?') + '_v=' + Math.random().toString(36).slice(2)
        // 延迟一点时间再设置，避免刚上传完图片还没写入磁盘
        setTimeout(() => {
          setAvatarUrl(uniqueUrl)
          message.success('头像上传成功')
        }, 400)
      } else {
        message.error('头像上传失败')
      }
    }
  }

  // 打开图片选择器
  const openImagePicker = async () => {
    setImagePickerVisible(true)
    await fetchImages(1)
  }

  // 获取图片列表
  const fetchImages = async (page) => {
    setImageLoading(true)
    try {
      const res = await service.get('/hexopro/api/images/list', {
        params: {
          page: page,
          pageSize: pageSize,
          folder: '' // 默认根目录
        }
      })
      
      // 添加时间戳到图片URL以避免缓存问题
      const timestamp = new Date().getTime()
      const images = res.data.images.map(img => ({
        ...img,
        url: `${img.url}${img.url.includes('?') ? '&' : '?'}_t=${timestamp}`
      }))
      
      setImageList(images)
      setTotal(res.data.total)
      setCurrentPage(page)
    } catch (error) {
      message.error('获取图片列表失败')
      console.error(error)
    } finally {
      setImageLoading(false)
    }
  }

  // 选择图片作为头像
  const selectImage = (imageUrl) => {
    setAvatarUrl(imageUrl)
    setImagePickerVisible(false)
    message.success('已选择图片作为头像')
  }

  // 分页变化
  const handlePageChange = (page) => {
    fetchImages(page)
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
            {/* 头像设置区域 */}
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <div style={{ marginBottom: 16 }}>
                <Avatar 
                  size={100} 
                  src={avatarUrl} 
                  icon={<UserOutlined />}
                  style={{ border: '1px solid #f0f0f0' }}
                  key={avatarUrl} // 强制刷新
                />
              </div>
              <Space>
                <Upload
                  name="data"
                  action="/hexopro/api/images/upload"
                  showUploadList={false}
                  onChange={handleAvatarUpload}
                  headers={{
                    Authorization: `Bearer ${localStorage.getItem('hexoProToken')}`
                  }}
                  data={{
                    folder: '' // 上传到根目录
                  }}
                >
                  <Button icon={<UploadOutlined />}>上传头像</Button>
                </Upload>
                <Button 
                  icon={<PictureOutlined />} 
                  onClick={openImagePicker}
                >
                  从图床选择
                </Button>
              </Space>
            </div>
            
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>
            
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { 
                  validator: (_, value) => {
                    if (isFirstUse && !value) {
                      return Promise.reject('首次使用必须设置密码')
                    }
                    if (value && value.length < 6) {
                      return Promise.reject('密码长度不能少于6位')
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>
            
            <Form.Item
              label="确认密码"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value && !getFieldValue('password')) {
                      return Promise.resolve()
                    }
                    if (!value && getFieldValue('password')) {
                      return Promise.reject('请确认密码')
                    }
                    if (value !== getFieldValue('password')) {
                      return Promise.reject('两次输入的密码不一致')
                    }
                    return Promise.resolve()
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请确认密码" />
            </Form.Item>
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
                style={{ width: '100%' }}
              >
                {isFirstUse ? '创建账号' : '保存设置'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Spin>

      {/* 图片选择器模态框 */}
      <Modal
        title="选择头像"
        open={imagePickerVisible}
        onCancel={() => setImagePickerVisible(false)}
        footer={null}
        width={800}
      >
        <Spin spinning={imageLoading}>
          {imageList.length > 0 ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                {imageList.map(image => (
                  <div 
                    key={image.path} 
                    style={{ 
                      cursor: 'pointer', 
                      border: '1px solid #f0f0f0',
                      borderRadius: '4px',
                      padding: '8px',
                      width: '120px',
                      height: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                    onClick={() => selectImage(image.url)}
                  >
                    <img 
                      src={image.url} 
                      alt={image.name} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <Pagination 
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p>暂无图片，请先上传图片到图床</p>
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  )
}

export default SettingsPage

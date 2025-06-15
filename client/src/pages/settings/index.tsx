import React, { useState, useEffect, useContext } from 'react'
import { Card, Form, Input, Button, Upload, message, Spin, Typography, Alert, Modal, Avatar, Space, Pagination, Switch, Divider, Select } from 'antd'
import { UploadOutlined, UserOutlined, LockOutlined, SaveOutlined, PictureOutlined, LinkOutlined, GlobalOutlined, EditOutlined } from '@ant-design/icons'
import styles from './style/index.module.less'
import useLocale from '../../hooks/useLocale'
import service from '@/utils/api'
import { GlobalContext } from '@/context'
import { useDispatch } from 'react-redux'
import { updateLinkRedirectSettings, getLinkRedirectSettings } from '@/utils/desktopUtils'
import defaultAvatar from '../../assets/defaultAvatar2.png'
const { Title, Text } = Typography
const { Option } = Select

const SettingsPage: React.FC = () => {
  const t = useLocale()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatar)
  const [menuCollapsed, setMenuCollapsed] = useState(false)
  const { theme, setTheme } = useContext(GlobalContext)
  const dispatch = useDispatch()
  const [isFirstUse, setIsFirstUse] = useState(false)
  
  // 链接跳转设置相关状态
  const [linkRedirectEnabled, setLinkRedirectEnabled] = useState(false)
  const [customDomain, setCustomDomain] = useState('http://localhost:4000')
  
  // 编辑器模式设置相关状态
  const [editorMode, setEditorMode] = useState('ir')
  
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
        // console.log(res)
        if (res.data.code === 0) {
          // console.log(res)
          setIsFirstUse(res.data.data.isFirstUse)
          
          // 如果是首次使用，不需要获取设置
          if (!res.data.data.isFirstUse) {
            fetchSettings()
          } else {
            setFetchLoading(false)
          }
        } else {
          message.error(res.data.msg || t['settings.checkSystemStatusFailed'])
          setFetchLoading(false)
        }
      } catch (error) {
        console.error('检查系统状态失败:', error)
        message.error(t['settings.checkSystemStatusFailed'])
        setFetchLoading(false)
      }
    }
    
    checkFirstUse()
  }, [])

  // 初始化时从localStorage读取链接跳转设置
  useEffect(() => {
    const settings = getLinkRedirectSettings()
    setLinkRedirectEnabled(settings.enabled)
    setCustomDomain(settings.domain)
  }, [])

  // 初始化时从localStorage读取编辑器模式设置
  useEffect(() => {
    const savedMode = localStorage.getItem('hexoProEditorMode')
    if (savedMode) {
      setEditorMode(savedMode)
    }
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

  // 处理链接重定向开关变化
  const handleLinkRedirectChange = (checked: boolean) => {
    setLinkRedirectEnabled(checked)
    updateLinkRedirectSettings(checked, customDomain)
    message.success(checked ? '链接重定向已启用' : '链接重定向已禁用')
  }

  // 处理自定义域名变化
  const handleCustomDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomDomain(value)
  }

  // 处理自定义域名失去焦点时保存
  const handleCustomDomainBlur = () => {
    // 验证域名格式
    try {
      new URL(customDomain)
      updateLinkRedirectSettings(linkRedirectEnabled, customDomain)
      message.success('自定义域名已保存')
    } catch (error) {
      message.error('域名格式不正确，请输入完整的URL（如：http://localhost:4000）')
      setCustomDomain('http://localhost:4000') // 重置为默认值
    }
  }

  // 处理编辑器模式变化
  const handleEditorModeChange = (mode: string) => {
    setEditorMode(mode)
    localStorage.setItem('hexoProEditorMode', mode)
    message.success('编辑器模式已保存，重新进入编辑器后生效')
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
        message.success(t['settings.registerSuccess'])
        
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
        message.error(res.data.msg || t['settings.registerFailed'])
      }
    } catch (error) {
      console.error('注册失败:', error)
      message.error(t['settings.registerFailed'])
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
        
        // 如果服务器返回了新的 token（用户名更新时），需要更新本地存储
        if (res.data.data && res.data.data.token) {
          localStorage.setItem('hexoProToken', res.data.data.token)
          console.log('[Settings]: 用户名已更新，保存新的token')
        }
        
        // 更新全局状态中的菜单折叠状态和头像
        dispatch({
          type: 'update-menu-collapsed',
          payload: { menuCollapsed }
        })
        
        // 更新用户信息（包括头像和可能的新用户名）
        const finalUsername = (res.data.data && res.data.data.username) ? res.data.data.username : username
        dispatch({
          type: 'update-userInfo',
          payload: { 
            userInfo: { 
              username: finalUsername,
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
        } else if (res.data.data && res.data.data.token) {
          // 如果只是更新了用户名（返回了新token但没有密码更新），刷新页面以确保状态同步
          message.info('用户名已更新，正在刷新页面...')
          setTimeout(() => {
            window.location.reload()
          }, 1000)
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
    localStorage.setItem('hexoProSkipSettings', 'true')
    message.success(t['settings.skipSetupMessage'])
    window.location.href = '/pro'
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
          message.success(t['settings.avatarUploadSuccess'])
        }, 400)
      } else {
        message.error(t['settings.avatarUploadFailed'])
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
      message.error(t['settings.getImageListFailed'])
      console.error(error)
    } finally {
      setImageLoading(false)
    }
  }

  // 选择图片作为头像
  const selectImage = (imageUrl) => {
    setAvatarUrl(imageUrl)
    setImagePickerVisible(false)
    message.success(t['settings.imageSelectedAsAvatar'])
  }

  // 分页变化
  const handlePageChange = (page) => {
    fetchImages(page)
  }

  return (
    <div className={styles.container} data-theme={theme}>
      <Spin spinning={fetchLoading}>
        <Card className={styles.card}>
          <Title level={2}>{isFirstUse ? t['settings.initTitle'] : t['settings.title']}</Title>
          
          {isFirstUse && (
            <Alert
              message={t['settings.welcomeTitle']}
              description={t['settings.welcomeAlertDesc']}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
              action={
                <Button size="small" onClick={skipSettings}>
                  {t['settings.skipSetupButton']}
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
                  <Button icon={<UploadOutlined />}>{t['settings.upload.avatar']}</Button>
                </Upload>
                <Button 
                  icon={<PictureOutlined />} 
                  onClick={openImagePicker}
                >
                  {t['settings.select.from.gallery']}
                </Button>
              </Space>
            </div>
            
            <Form.Item
              label={t['settings.username']}
              name="username"
              rules={[{ required: true, message: t['settings.usernameRequired'] }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>
            
            <Form.Item
              label={t['settings.password']}
              name="password"
              rules={[
                {
                  validator: (_, value) => {
                    if (isFirstUse && !value) {
                      return Promise.reject(t['settings.firstUsePasswordRequired'])
                    }
                    if (value && value.length < 6) {
                      return Promise.reject(t['settings.passwordLengthError'])
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>
            
            <Form.Item
              label={t['settings.confirmPassword']}
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value && !getFieldValue('password')) {
                      return Promise.resolve()
                    }
                    if (!value && getFieldValue('password')) {
                      return Promise.reject(t['settings.confirmPasswordRequired'])
                    }
                    if (value !== getFieldValue('password')) {
                      return Promise.reject(t['settings.passwordNotMatch'])
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
                {isFirstUse ? t['settings.createAccount'] : '保存账户设置'}
              </Button>
            </Form.Item>
          </Form>

          {/* 链接跳转设置区域 - 独立于表单，实时保存 */}
          {!isFirstUse && (
            <Card style={{ marginTop: 24 }}>
              <Divider orientation="left">
                <LinkOutlined /> 链接跳转设置
              </Divider>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <Text strong>启用链接重定向</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      开启后，预览链接将跳转到自定义域名而不是原始链接
                    </Text>
                  </div>
                  <Switch
                    checked={linkRedirectEnabled}
                    onChange={handleLinkRedirectChange}
                    checkedChildren="开启"
                    unCheckedChildren="关闭"
                  />
                </div>
              </div>
              
              {linkRedirectEnabled && (
                <div style={{ marginLeft: 16, marginTop: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>自定义域名</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      设置链接重定向的目标域名（如：http://localhost:4000）
                    </Text>
                  </div>
                  <Input
                    prefix={<GlobalOutlined />}
                    value={customDomain}
                    onChange={handleCustomDomainChange}
                    onBlur={handleCustomDomainBlur}
                    placeholder="http://localhost:4000"
                    style={{ width: '100%' }}
                  />
                </div>
              )}
              
              <div style={{ marginTop: 16, padding: '12px 16px', backgroundColor: '#f6f8fa', borderRadius: '6px', border: '1px solid #e1e4e8' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  💡 链接跳转设置会自动保存，无需点击保存按钮
                </Text>
              </div>
            </Card>
          )}

          {/* 编辑器设置区域 */}
          {!isFirstUse && (
            <Card style={{ marginTop: 24 }}>
              <Divider orientation="left">
                <EditOutlined /> 编辑器设置
              </Divider>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>编辑器模式</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    选择你喜欢的编辑器模式，设置后重新进入编辑器生效
                  </Text>
                </div>
                <Select
                  style={{ width: '100%' }}
                  value={editorMode}
                  onChange={handleEditorModeChange}
                  placeholder="选择编辑器模式"
                >
                  <Option value="ir">即时渲染模式（推荐）</Option>
                  <Option value="wysiwyg">所见即所得模式</Option>
                  <Option value="sv">分屏预览模式</Option>
                </Select>
              </div>
              
              <div style={{ padding: '12px 16px', backgroundColor: '#f6f8fa', borderRadius: '6px', border: '1px solid #e1e4e8' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  💡 编辑器模式说明：<br />
                  • 即时渲染模式：边编辑边预览，平衡了编辑体验和预览效果<br />
                  • 所见即所得模式：像Word一样的编辑体验，直接在渲染结果上编辑<br />
                  • 分屏预览模式：左侧编辑Markdown源码，右侧实时预览渲染结果
                </Text>
              </div>
            </Card>
          )}
        </Card>
      </Spin>

      {/* 图片选择器模态框 */}
      <Modal
        title={t['settings.selectAvatarTitle']}
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
                    onClick={() => selectImage(image.path)}
                  >
                    <img 
                      src={image.path} 
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
              <p>{t['settings.noImagesPrompt']}</p>
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  )
}

export default SettingsPage

import React, { useContext, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Empty,
  Image,
  Input,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Typography,
  Upload
} from 'antd'
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  FolderAddOutlined,
  InboxOutlined,
  ScissorOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { EyeOutlined } from '@ant-design/icons'
import { RcFile } from 'antd/lib/upload'
import type { UploadFile } from 'antd/es/upload/interface'
import service from '@/utils/api'
import useLocale from '@/hooks/useLocale'
import { GlobalContext } from '@/context'
import useDeviceDetect from '@/hooks/useDeviceDetect'
import styles from './style/index.module.less'

const { Title, Text } = Typography
const { Dragger } = Upload
const { Option } = Select

interface ImageItem {
  name: string;
  path: string;
  url: string;
  size: number;
  lastModified: string;
}

interface FolderData {
  images: ImageItem[];
  folders: string[];
  total: number;
  page: number;
  pageSize: number;
}

const ImageManager: React.FC = () => {
  const t = useLocale()
  const { theme } = useContext(GlobalContext)
  const { isMobile } = useDeviceDetect()

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FolderData>({
    images: [],
    folders: [],
    total: 0,
    page: 1,
    pageSize: 12
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(isMobile ? 8 : 12)
  const [currentFolder, setCurrentFolder] = useState('')
  const [uploadVisible, setUploadVisible] = useState(false)
  const [uploadFileList, setUploadFileList] = useState<UploadFile<any>[]>([])
  const [createFolderVisible, setCreateFolderVisible] = useState(false)
  const [deleteFolderVisible, setDeleteFolderVisible] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [deleteFolderRecursive, setDeleteFolderRecursive] = useState(false)
  const [renameVisible, setRenameVisible] = useState(false)
  const [currentImage, setCurrentImage] = useState<ImageItem | null>(null)
  const [newName, setNewName] = useState('')
  const [moveVisible, setMoveVisible] = useState(false)
  const [targetFolder, setTargetFolder] = useState('')
  const [customFileName, setCustomFileName] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [storageType, setStorageType] = useState('local')
  const [availableStorages, setAvailableStorages] = useState<string[]>(['local'])
  const isLocal = storageType === 'local'
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false)
  // 清理未引用图片
  const [cleanupVisible, setCleanupVisible] = useState(false)
  const [cleanupScanning, setCleanupScanning] = useState(false)
  const [cleanupItems, setCleanupItems] = useState<Array<{ key: string; url: string; size: number; lastModified: string }>>([])
  const [cleanupSelectedKeys, setCleanupSelectedKeys] = useState<string[]>([])
  const [cleanupRecursive, setCleanupRecursive] = useState(true)
  const [cleanupIncludeDrafts, setCleanupIncludeDrafts] = useState(true)
  const [cleanupMinAgeDays, setCleanupMinAgeDays] = useState<number>(3)
  const [cleanupIgnorePatterns, setCleanupIgnorePatterns] = useState<string>('')
  const [cleanupTotal, setCleanupTotal] = useState(0)
  const [cleanupPage, setCleanupPage] = useState(1)
  const [cleanupPageSize, setCleanupPageSize] = useState(200)

  const toggleSelect = (key: string) => {
    setSelectedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  // 获取图片列表
  const fetchImages = async () => {
    setLoading(true)
    try {
      const res = await service.get('/hexopro/api/images/list', {
        params: {
          page: currentPage,
          pageSize: pageSize,
          folder: currentFolder,
          storageType,
          includeSubfolders: currentFolder === 'trash'
        }
      })

      // 添加时间戳到图片URL以避免缓存问题
      const timestamp = new Date().getTime()
      const processedData = {
        ...res.data,
        images: res.data.images.map(img => ({
          ...img,
          url: `${img.url}${img.url.includes('?') ? '&' : '?'}_t=${timestamp}`
        }))
      }

      setData((pre) => processedData)
    } catch (error) {
      message.error(t['content.images.fetchFailed'] || '获取图片列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 获取图床配置
  const fetchStorageConfig = async () => {
    try {
      const res = await service.get('/hexopro/api/images/config/get')
      console.log(res)
      if (res?.data?.data?.type) {
        // 若默认类型配置不完整，不采用，保持当前选择
        const cfg = res?.data?.data || {}
        const type = cfg.type
        const isValid = (tp: string) => {
          if (tp === 'aliyun') {
            const c = cfg.aliyun || {}
            return c.bucket && (c.domain || (c.region && c.accessKeyId && c.accessKeySecret))
          }
          if (tp === 'qiniu') {
            const c = cfg.qiniu || {}
            return c.bucket && c.domain && c.accessKey && c.secretKey
          }
          if (tp === 'tencent') {
            const c = cfg.tencent || {}
            return c.bucket && (c.domain || (c.region && c.secretId && c.secretKey))
          }
          return true
        }
        if (isValid(type)) setStorageType(type)
      }
      const storages: string[] = []
      const cfg = res?.data?.data || {}
      console.log(cfg)
      // 判定已配置可用的图床
      storages.push('local')
      if (cfg.aliyun && (cfg.aliyun.bucket && (cfg.aliyun.domain || (cfg.aliyun.region && cfg.aliyun.accessKeyId && cfg.aliyun.accessKeySecret)))) {
        storages.push('aliyun')
      }
      if (cfg.qiniu && (cfg.qiniu.bucket && cfg.qiniu.domain && cfg.qiniu.accessKey && cfg.qiniu.secretKey)) {
        console.log('qiniu')
        storages.push('qiniu')
      }
      if (cfg.tencent && (cfg.tencent.bucket && (cfg.tencent.domain || (cfg.tencent.region && cfg.tencent.secretId && cfg.tencent.secretKey)))) {
        storages.push('tencent')
      }
      setAvailableStorages(Array.from(new Set(storages)))
    } catch (e) {
      // 忽略
    }
  }

  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      message.error(t['content.images.folderNameRequired'] || '文件夹名称不能为空')
      return
    }

    try {
      await service.post('/hexopro/api/images/createFolder', { folderName, storageType })
      message.success(t['content.images.createFolderSuccess'] || '创建文件夹成功')
      setCreateFolderVisible(false)
      setFolderName('')
      fetchImages()
    } catch (error) {
      message.error(t['content.images.createFolderFailed'] || '创建文件夹失败')
      console.error(error)
    }
  }

  // 删除图片
  const handleDeleteImage = async (image: ImageItem) => {
    try {
      await service.post('/hexopro/api/images/delete', { path: image.path, storageType })
      message.success(t['content.images.deleteSuccess'] || '删除成功')
      fetchImages()
    } catch (error) {
      message.error(t['content.images.deleteFailed'] || '删除失败')
      console.error(error)
    }
  }

  // 重命名图片
  const handleRenameImage = async () => {
    if (!newName.trim() || !currentImage) {
      message.error(t['content.images.newNameRequired'] || '新名称不能为空')
      return
    }

    try {
      await service.post('/hexopro/api/images/rename', {
        oldPath: currentImage.path,
        newName: newName,
        storageType
      })
      message.success(t['content.images.renameSuccess'] || '重命名成功')


      setRenameVisible(false)
      setNewName('')
      setPreviewVisible(false)      // 新增：关闭预览弹窗
      // setPreviewImage(currentImage.path.replace(currentImage.name, '') + newName);           // 新增：清空预览图片

      console.log(currentImage.path.replace(currentImage.name, '') + newName)
      setTimeout(() => {
        fetchImages()
      }, 1000)
    } catch (error) {
      message.error(t['content.images.renameFailed'] || '重命名失败')
      console.error(error)
    }
  }

  // 移动图片
  const handleMoveImage = async () => {
    if (!currentImage) return

    try {
      await service.post('/hexopro/api/images/move', {
        path: currentImage.path,
        targetFolder: targetFolder,
        storageType
      })
      message.success(t['content.images.moveSuccess'] || '移动成功')
      setMoveVisible(false)
      fetchImages()
    } catch (error) {
      message.error(t['content.images.moveFailed'] || '移动失败')
      console.error(error)
    }
  }

  // 复制图片链接
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      message.success(t['content.images.copySuccess'] || '复制成功')
    }).catch(() => {
      // 如果navigator.clipboard不可用，使用传统方法
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      message.success(t['content.images.copySuccess'] || '复制成功')
    })
  }

  // 处理上传前的文件检查
  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error(t['content.images.onlyImage'] || '只能上传图片文件')
      return false
    }

    return true
  }

  // 处理自定义上传
  const handleCustomUpload = async (options) => {
    const { file, onSuccess, onError } = options

    // 读取文件为Base64
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      try {
        const base64 = reader.result as string
        const res = await service.post('/hexopro/api/images/upload', {
          data: base64,
          filename: customFileName || file.name,
          folder: currentFolder,
          storageType
        })

        message.success(t['content.images.uploadSuccess'] || '上传成功')
        onSuccess(res, file)
        setUploadVisible(false)
        setCustomFileName('')
        // 关键：延迟刷新图片列表，拼接唯一参数防缓存
        setTimeout(() => {
          fetchImages()
        }, 400)
      } catch (error) {
        message.error(t['content.images.uploadFailed'] || '上传失败')
        onError(error)
      }
    }
  }

  // 处理页面变化
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page)
    if (pageSize) setPageSize(pageSize)
  }

  // 处理文件夹变化
  const handleFolderChange = (folder: string) => {
    setCurrentFolder(folder)
    setCurrentPage(1)
  }

  // 格式化文件大小
  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`
    } else {
      return `${(size / 1024 / 1024).toFixed(2)} MB`
    }
  }

  // 初始加载和依赖变化时获取数据
  useEffect(() => {
    fetchImages()
  }, [currentPage, pageSize, currentFolder, storageType])

  useEffect(() => {
    fetchStorageConfig()
  }, [])

  // 响应式调整每页显示数量
  useEffect(() => {
    setPageSize(isMobile ? 8 : 12)
  }, [isMobile])

  return (
    <div className={styles.imageManager}>
      <div className={styles.header}>
        <Title level={4}>{t['content.images.title'] || '图床管理'}</Title>
        <Space>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadVisible(true)}
          >
            {t['content.images.upload'] || '上传图片'}
          </Button>
          {currentFolder !== 'trash' && (
            <Button
              icon={<DeleteOutlined />}
              onClick={() => setCleanupVisible(true)}
            >
              {t['content.images.cleanupUnused'] || '清理未引用图片'}
            </Button>
          )}
          <Button
            icon={<FolderAddOutlined />}
            onClick={() => setCreateFolderVisible(true)}
          >
            {t['content.images.createFolder'] || '新建文件夹'}
          </Button>
        </Space>
      </div>

      <div className={styles.folderSelector}>
        <Text strong style={{ marginRight: 8 }}>{t['content.images.currentFolder'] || '当前文件夹'}:</Text>
        {currentFolder !== 'trash' ? (
          <Select
            style={{ width: isMobile ? 200 : 300, marginLeft: 8 }}
            value={currentFolder}
            onChange={handleFolderChange}
            placeholder={t['content.images.selectFolder'] || '选择文件夹'}
          >
            <Option value="">{t['content.images.rootFolder'] || '根目录'}</Option>
            {data.folders.filter(f => String(f).toLowerCase() !== 'trash').map(folder => (
              <Option key={folder} value={folder}>{folder}</Option>
            ))}
          </Select>
        ) : (
          <Text type="secondary" style={{ marginLeft: 8 }}>trash</Text>
        )}
        <div style={{ flex: 1 }} />
        <Text strong style={{ marginLeft: 16, marginRight: 8 }}>{t['content.images.storageType'] || '图床'}:</Text>
        <Select
          style={{ width: isMobile ? 140 : 180 }}
          value={storageType}
          onChange={(v) => { setStorageType(v); setCurrentPage(1) }}
        >
          {availableStorages.map(s => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
        <Button
          style={{ marginLeft: 8 }}
          onClick={() => { setCurrentFolder(currentFolder === 'trash' ? '' : 'trash'); setCurrentPage(1) }}
        >
          {currentFolder === 'trash' ? (t['content.images.back'] || '返回') : (t['content.images.trash'] || '回收站')}
        </Button>
        <Button
          danger
          style={{ marginLeft: 12 }}
          disabled={currentFolder === 'trash'}
          onClick={() => setDeleteFolderVisible(true)}
        >
          {t['content.images.deleteFolder'] || '删除文件夹'}
        </Button>
      </div>

      <Spin spinning={loading}>
        {data.images.length > 0 ? (
          <>
            <Row gutter={[16, 16]} className={styles.imageGrid}>
              {data.images.map(image => (
                <Col xs={12} sm={8} md={6} lg={6} xl={4} key={image.url}>
                  <Card
                    hoverable
                    className={selectedKeys.includes(image.path) ? styles.selectedCard : ''}
                    onClick={() => toggleSelect(image.path)}
                    cover={
                      <div className={styles.imageContainer}>
                        <Image
                          key={image.url}
                          src={image.url}
                          alt={image.name}
                          preview={false}
                          fallback="data:image/png;base64,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"
                        />
                      </div>
                    }
                    actions={[
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={(e) => { e.stopPropagation(); setPreviewImage(image.url); setPreviewVisible(true); }}
                        title={t['content.images.preview'] || '预览'}
                      />,
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleCopyLink(image.url) }}
                        title={t['content.images.copy'] || '复制链接'}
                      />,
                      // 远程与本地都支持移动
                      <Button
                        type="text"
                        icon={<ScissorOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImage(image)
                          setTargetFolder('')
                          setMoveVisible(true)
                        }}
                        title={t['content.images.move'] || '移动'}
                      />,
                      ...(isLocal ? [
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImage(image)
                            setNewName(image.name)
                            setRenameVisible(true)
                          }}
                          title={t['content.images.rename'] || '重命名'}
                        />,
                        <Popconfirm
                          title={t['content.images.deleteConfirm'] || '确定要删除这张图片吗？'}
                          onConfirm={() => handleDeleteImage(image)}
                          okText={t['content.images.ok'] || '确定'}
                          cancelText={t['content.images.cancel'] || '取消'}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            title={t['content.images.delete'] || '删除'}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Popconfirm>
                      ] : [
                        // 远程图床：也允许重命名、删除
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImage(image)
                            setNewName(image.name)
                            setRenameVisible(true)
                          }}
                          title={t['content.images.rename'] || '重命名'}
                        />,
                        <Popconfirm
                          title={t['content.images.deleteConfirm'] || '确定要删除这张图片吗？'}
                          onConfirm={() => handleDeleteImage(image)}
                          okText={t['content.images.ok'] || '确定'}
                          cancelText={t['content.images.cancel'] || '取消'}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            title={t['content.images.delete'] || '删除'}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Popconfirm>
                      ])
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Text ellipsis={{ tooltip: image.name }}>
                          {image.name}
                        </Text>
                      }
                      description={
                        <div>
                          <div>{formatFileSize(image.size)}</div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            {/* 批量操作条 */}
            {selectedKeys.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Text>{t['content.images.selectedCount'] || '已选中'}: {selectedKeys.length}</Text>
                <Button
                  danger
                  onClick={async () => {
                    try {
                      await service.post('/hexopro/api/images/delete/batch', { paths: selectedKeys, storageType })
                      message.success(t['content.images.deleteSuccess'] || '删除成功')
                      setSelectedKeys([])
                      fetchImages()
                    } catch (e) {
                      message.error(t['content.images.deleteFailed'] || '删除失败')
                    }
                  }}
                >{t['content.images.batchDelete'] || '批量删除'}</Button>
                <Button onClick={() => setSelectedKeys([])}>{t['content.images.clearSelection'] || '清空选择'}</Button>
              </div>
            )}
          </>
        ) : (
          <Empty
            description={t['content.images.noImages'] || '暂无图片'}
            className={styles.empty}
          />
        )}
      </Spin>

      {data.total > 0 && (
        <div className={styles.pagination}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={data.total}
            onChange={handlePageChange}
            showSizeChanger={false}
            responsive
          />
        </div>
      )}

      {/* 上传图片对话框 */}
      <Modal
        title={t['content.images.uploadTitle'] || '上传图片'}
        open={uploadVisible}
        onCancel={() => { setUploadVisible(false); setUploadFileList([]) }}
        footer={null}
        width={isMobile ? '90%' : 520}
      >
        <div className={styles.uploadForm}>
          <div className={styles.formItem}>
            <Text strong>{t['content.images.targetFolder'] || '目标文件夹'}:</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={currentFolder}
              onChange={setCurrentFolder}
              placeholder={t['content.images.selectFolder'] || '选择文件夹'}
            >
              <Option value="">{t['content.images.rootFolder'] || '根目录'}</Option>
              {data.folders.filter(f => String(f).toLowerCase() !== 'trash').map(folder => (
                <Option key={folder} value={folder}>{folder}</Option>
              ))}
            </Select>
          </div>

          <div className={styles.formItem}>
            <Text strong>{t['content.images.customFileName'] || '自定义文件名'}:</Text>
            <Input
              style={{ marginTop: 8 }}
              value={customFileName}
              onChange={e => { console.log(e.target.value); setCustomFileName(e.target.value) }}
              placeholder={t['content.images.fileNamePlaceholder'] || '留空则自动生成'}
            />
          </div>

          <div className={styles.formItem}>
            <Upload.Dragger
              name="data"
              multiple
              accept="image/*"
              beforeUpload={beforeUpload}
              action="/hexopro/api/images/upload"
              headers={{
                Authorization: `Bearer ${localStorage.getItem('hexoProToken') || ''}`,
                'X-Storage-Type': storageType
              }}
              data={() => ({ folder: currentFolder })}
              fileList={uploadFileList}
              showUploadList={{ showRemoveIcon: false, showPreviewIcon: false }}
              progress={{ strokeWidth: 4, showInfo: false, status: 'active' as any }}
              onChange={(info) => {
                const { status, response } = info.file
                // 控制显示数量，避免列表无限增长
                const limitedList = (info.fileList || []).slice(-30)
                setUploadFileList(limitedList)
                if (status === 'uploading') {
                  setLoading(true)
                } else if (status === 'done') {
                  if (response && response.code === 0) {
                    message.success(t['content.images.uploadSuccess'] || '上传成功')
                  } else {
                    message.error(t['content.images.uploadFailed'] || '上传失败')
                  }
                } else if (status === 'error') {
                  message.error(t['content.images.uploadFailed'] || '上传失败')
                }
                // 若全部完成/失败，则关闭弹窗并刷新
                const allFinished = (info.fileList || []).every(f => f.status === 'done' || f.status === 'error')
                if (allFinished) {
                  setLoading(false)
                  setUploadVisible(false)
                  setUploadFileList([])
                  setTimeout(() => fetchImages(), 400)
                }
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {t['content.images.dragHere'] || '拖拽图片到此处，或点击上传'}
              </p>
            </Upload.Dragger>
          </div>
        </div>
      </Modal>

      {/* 创建文件夹对话框 */}
      <Modal
        title={t['content.images.createFolder'] || '新建文件夹'}
        open={createFolderVisible}
        onOk={handleCreateFolder}
        onCancel={() => {
          setCreateFolderVisible(false)
          setFolderName('')
        }}
        okText={t['content.images.ok'] || '确定'}
        cancelText={t['content.images.cancel'] || '取消'}
        width={isMobile ? '90%' : 520}
      >
        <Input
          value={folderName}
          onChange={e => setFolderName(e.target.value)}
          placeholder={t['content.images.folderName'] || '文件夹名称（支持中文、字母、数字、下划线和短横线）'}
        />
      </Modal>

      {/* 删除文件夹对话框 */}
      <Modal
        title={t['content.images.deleteFolder'] || '删除文件夹'}
        open={deleteFolderVisible}
        onOk={async () => {
          try {
            await service.post('/hexopro/api/images/folder/delete', {
              folder: currentFolder,
              storageType,
              recursive: deleteFolderRecursive
            })
            message.success(t['content.images.deleteFolderSuccess'] || '删除成功')
            setDeleteFolderVisible(false)
            setDeleteFolderRecursive(false)
            setCurrentFolder('')
            setCurrentPage(1)
            fetchImages()
          } catch (e) {
            message.error(t['content.images.deleteFolderFailed'] || '删除失败')
          }
        }}
        onCancel={() => {
          setDeleteFolderVisible(false)
          setDeleteFolderRecursive(false)
        }}
        okButtonProps={{ danger: true }}
        okText={t['content.images.ok'] || '确定'}
        cancelText={t['content.images.cancel'] || '取消'}
        width={isMobile ? '90%' : 520}
        destroyOnClose
      >
        <div style={{ marginBottom: 12 }}>
          <Text>
            {t['content.images.deleteFolderConfirm'] || '确定删除当前文件夹？'}
            {!!currentFolder && ` (${currentFolder})`}
          </Text>
        </div>
        <div>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={deleteFolderRecursive}
              onChange={(e) => setDeleteFolderRecursive(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            {t['content.images.deleteFolderRecursive'] || '同时删除文件夹内的所有文件'}
          </label>
        </div>
      </Modal>

      {/* 清空文件夹对话框 */}
      <Modal
        title={t['content.images.clearFolder'] || '清空文件夹图片'}
        open={clearConfirmVisible}
        onOk={async () => {
          try {
            await service.post('/hexopro/api/images/folder/clear', {
              folder: currentFolder,
              storageType,
              includeSubfolders: false
            })
            message.success(t['content.images.clearFolderSuccess'] || '已清空')
            setClearConfirmVisible(false)
            fetchImages()
          } catch (e) {
            message.error(t['content.images.clearFolderFailed'] || '清空失败')
          }
        }}
        onCancel={() => setClearConfirmVisible(false)}
        okButtonProps={{ danger: true }}
        okText={t['content.images.ok'] || '确定'}
        cancelText={t['content.images.cancel'] || '取消'}
      >
        <Text>{t['content.images.clearFolderConfirm'] || '确定清空当前文件夹下的所有图片？'}</Text>
      </Modal>

      {/* 重命名图片对话框 */}
      <Modal
        title={t['content.images.renameTitle'] || '重命名图片'}
        open={renameVisible}
        onOk={handleRenameImage}
        onCancel={() => {
          setRenameVisible(false)
          setNewName('')
        }}
        okText={t['content.images.ok'] || '确定'}
        cancelText={t['content.images.cancel'] || '取消'}
        width={isMobile ? '90%' : 520}
      >
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder={t['content.images.newName'] || '新名称（支持中文、字母、数字、下划线、短横线和点）'}
        />
      </Modal>

      {/* 移动图片对话框 */}
      <Modal
        title={t['content.images.moveTitle'] || '移动图片'}
        open={moveVisible}
        onOk={handleMoveImage}
        onCancel={() => setMoveVisible(false)}
        okText={t['content.images.ok'] || '确定'}
        cancelText={t['content.images.cancel'] || '取消'}
        width={isMobile ? '90%' : 520}
      >
        <Select
          style={{ width: '100%' }}
          value={targetFolder}
          onChange={setTargetFolder}
          placeholder={t['content.images.selectFolder'] || '选择文件夹'}
        >
          <Option value="">{t['content.images.rootFolder'] || '根目录'}</Option>
          {data.folders.filter(f => String(f).toLowerCase() !== 'trash').map(folder => (
            <Option key={folder} value={folder}>{folder}</Option>
          ))}
        </Select>
      </Modal>

      {/* 图片预览 */}
      <Image
        width={0}
        style={{ display: 'none' }}
        preview={{
          visible: previewVisible,
          src: previewImage,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
      />

      {/* 清理未引用图片 */}
      <Modal
        title={t['content.images.cleanupTitle'] || '清理未引用图片'}
        open={cleanupVisible}
        onCancel={() => {
          setCleanupVisible(false)
          setCleanupItems([])
          setCleanupSelectedKeys([])
          setCleanupPage(1)
          setCleanupTotal(0)
        }}
        footer={null}
        width={isMobile ? '95%' : 900}
        destroyOnClose
      >
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <Text strong>{t['content.images.cleanup.folder'] || '目标文件夹'}</Text>
            <Select
              style={{ width: '100%', marginTop: 6 }}
              value={currentFolder === 'trash' ? '' : currentFolder}
              onChange={(v) => { setCurrentFolder(v); setCleanupItems([]); setCleanupSelectedKeys([]); }}
            >
              <Option value="">{t['content.images.rootFolder'] || '根目录'}</Option>
              {data.folders.filter(f => String(f).toLowerCase() !== 'trash').map(folder => (
                <Option key={folder} value={folder}>{folder}</Option>
              ))}
            </Select>
          </div>
          <div>
            <Text strong>{t['content.images.cleanup.minAgeDays'] || '最小年龄（天）'}</Text>
            <Input
              type="number"
              min={0}
              value={cleanupMinAgeDays}
              onChange={(e) => setCleanupMinAgeDays(Number(e.target.value || 0))}
              style={{ marginTop: 6 }}
            />
          </div>
          <div>
            <Text strong>{t['content.images.storageType'] || '图床'}</Text>
            <Select
              style={{ width: '100%', marginTop: 6 }}
              value={storageType}
              onChange={(v) => { setStorageType(v); setCleanupItems([]); setCleanupSelectedKeys([]); }}
            >
              {availableStorages.map(s => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={cleanupRecursive} onChange={(e) => setCleanupRecursive(e.target.checked)} />
            <Text>{t['content.images.cleanup.recursive'] || '包含子文件夹'}</Text>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={cleanupIncludeDrafts} onChange={(e) => setCleanupIncludeDrafts(e.target.checked)} />
            <Text>{t['content.images.cleanup.includeDrafts'] || '包含草稿'}</Text>
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <Text strong>{t['content.images.cleanup.ignore'] || '忽略规则（逗号分隔或JSON数组）'}</Text>
          <Input
            placeholder={t['content.images.cleanup.ignore.placeholder'] || '如：sponsors/*, logo/*, .keep'}
            value={cleanupIgnorePatterns}
            onChange={(e) => setCleanupIgnorePatterns(e.target.value)}
            style={{ marginTop: 6 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <Button
            type="primary"
            loading={cleanupScanning}
            onClick={async () => {
              try {
                setCleanupScanning(true)
                setCleanupItems([])
                setCleanupSelectedKeys([])
                const res = await service.get('/hexopro/api/images/unused', {
                  params: {
                    storageType,
                    folder: currentFolder,
                    recursive: cleanupRecursive,
                    includeDrafts: cleanupIncludeDrafts,
                    minAgeDays: cleanupMinAgeDays,
                    ignorePatterns: cleanupIgnorePatterns,
                    page: cleanupPage,
                    pageSize: cleanupPageSize
                  }
                })
                if (currentFolder === 'trash') {
                  // 回收站禁止扫描
                  setCleanupItems([])
                  setCleanupTotal(0)
                  message.warning(t['content.images.cleanup.trashNotAllowed'] || '回收站目录不支持扫描清理')
                  return
                }
                const items = (res?.data?.items || []).map(it => ({
                  ...it,
                  url: `${it.url}${String(it.url).includes('?') ? '&' : '?'}_t=${Date.now()}`
                }))
                setCleanupItems(items)
                setCleanupTotal(res?.data?.total || items.length)
                message.success(t['content.images.cleanup.scanSuccess'] || '扫描完成')
              } catch (e) {
                message.error(t['content.images.cleanup.scanFailed'] || '扫描失败')
              } finally {
                setCleanupScanning(false)
              }
            }}
          >
            {t['content.images.cleanup.scan'] || '扫描'}
          </Button>
          {cleanupItems.length > 0 && (
            <>
              <Button
                onClick={() => setCleanupSelectedKeys(cleanupItems.map(it => it.key))}
              >
                {t['content.images.selectAll'] || '全选'}
              </Button>
              <Button onClick={() => setCleanupSelectedKeys([])}>
                {t['content.images.clearSelection'] || '清空选择'}
              </Button>
            </>
          )}
          <div style={{ flex: 1 }} />
          {cleanupItems.length > 0 && (
            <Text type="secondary">
              {(t['content.images.cleanup.found'] || '发现未引用图片') + `: ${cleanupTotal}`}
            </Text>
          )}
        </div>

        <Spin spinning={cleanupScanning}>
          {cleanupItems.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
              {cleanupItems.map(item => (
                <div key={item.key} style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={cleanupSelectedKeys.includes(item.key)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setCleanupSelectedKeys(prev => checked ? [...prev, item.key] : prev.filter(k => k !== item.key))
                        }}
                      />
                      <Text ellipsis style={{ maxWidth: 120 }}>{item.key.split('/').slice(-1)[0]}</Text>
                    </label>
                    <Text type="secondary" style={{ fontSize: 12 }}>{formatFileSize(item.size)}</Text>
                  </div>
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8, overflow: 'hidden' }}>
                    <img src={item.url} alt={item.key} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.lastModified || '').toLocaleString()}</Text>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description={t['content.images.cleanup.noResult'] || '暂无待清理图片'} />
          )}
        </Spin>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button onClick={() => setCleanupVisible(false)}>{t['content.images.cancel'] || '取消'}</Button>
          <Button
            danger
            disabled={cleanupSelectedKeys.length === 0}
            onClick={async () => {
              try {
                setCleanupScanning(true)
                const res = await service.post('/hexopro/api/images/unused/cleanup', {
                  storageType,
                  keys: cleanupSelectedKeys,
                  useRecycleBin: true
                })
                if (res?.data?.code === 0 || res?.data?.success) {
                  message.success(t['content.images.cleanup.trashSuccess'] || '已移动到回收站')
                  setCleanupVisible(false)
                  setCleanupItems([])
                  setCleanupSelectedKeys([])
                  fetchImages()
                } else {
                  message.error(t['content.images.cleanup.failed'] || '清理失败')
                }
              } catch (e) {
                message.error(t['content.images.cleanup.failed'] || '清理失败')
              } finally {
                setCleanupScanning(false)
              }
            }}
          >
            {t['content.images.cleanup.toTrash'] || '移到回收站'}
          </Button>
          <Popconfirm
            title={t['content.images.cleanup.deleteConfirm'] || '确定要彻底删除所选图片吗？此操作不可恢复'}
            okText={t['content.images.ok'] || '确定'}
            cancelText={t['content.images.cancel'] || '取消'}
            onConfirm={async () => {
              try {
                setCleanupScanning(true)
                const res = await service.post('/hexopro/api/images/unused/cleanup', {
                  storageType,
                  keys: cleanupSelectedKeys,
                  useRecycleBin: false
                })
                if (res?.data?.code === 0 || res?.data?.success) {
                  message.success(t['content.images.cleanup.deleteSuccess'] || '已删除')
                  setCleanupVisible(false)
                  setCleanupItems([])
                  setCleanupSelectedKeys([])
                  fetchImages()
                } else {
                  message.error(t['content.images.cleanup.failed'] || '清理失败')
                }
              } catch (e) {
                message.error(t['content.images.cleanup.failed'] || '清理失败')
              } finally {
                setCleanupScanning(false)
              }
            }}
          >
            <Button danger type="primary" disabled={cleanupSelectedKeys.length === 0}>
              {t['content.images.cleanup.delete'] || '彻底删除'}
            </Button>
          </Popconfirm>
        </div>
      </Modal>
    </div>
  )
}

export default ImageManager
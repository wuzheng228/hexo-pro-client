import React, { useContext, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Dropdown,
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
import { RcFile } from 'antd/lib/upload'
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
  const [createFolderVisible, setCreateFolderVisible] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [renameVisible, setRenameVisible] = useState(false)
  const [currentImage, setCurrentImage] = useState<ImageItem | null>(null)
  const [newName, setNewName] = useState('')
  const [moveVisible, setMoveVisible] = useState(false)
  const [targetFolder, setTargetFolder] = useState('')
  const [customFileName, setCustomFileName] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')

  // 获取图片列表
  const fetchImages = async () => {
    setLoading(true)
    try {
      const res = await service.get('/hexopro/api/images/list', {
        params: {
          page: currentPage,
          pageSize: pageSize,
          folder: currentFolder
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

  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      message.error(t['content.images.folderNameRequired'] || '文件夹名称不能为空')
      return
    }

    try {
      await service.post('/hexopro/api/images/createFolder', { folderName })
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
      await service.post('/hexopro/api/images/delete', { path: image.path })
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
        newName: newName
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
        targetFolder: targetFolder
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
          folder: currentFolder
        })

        message.success(t['content.images.uploadSuccess'] || '上传成功')
        onSuccess(res, file)
        setUploadVisible(false)
        setCustomFileName('')
        fetchImages()
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
  }, [currentPage, pageSize, currentFolder])

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
          <Button
            icon={<FolderAddOutlined />}
            onClick={() => setCreateFolderVisible(true)}
          >
            {t['content.images.createFolder'] || '新建文件夹'}
          </Button>
        </Space>
      </div>

      <div className={styles.folderSelector}>
        <Text strong>{t['content.images.currentFolder'] || '当前文件夹'}:</Text>
        <Select
          style={{ width: isMobile ? 200 : 300, marginLeft: 8 }}
          value={currentFolder}
          onChange={handleFolderChange}
          placeholder={t['content.images.selectFolder'] || '选择文件夹'}
        >
          <Option value="">{t['content.images.rootFolder'] || '根目录'}</Option>
          {data.folders.map(folder => (
            <Option key={folder} value={folder}>{folder}</Option>
          ))}
        </Select>
      </div>

      <Spin spinning={loading}>
        {data.images.length > 0 ? (
          <Row gutter={[16, 16]} className={styles.imageGrid}>
            {data.images.map(image => (
              <Col xs={12} sm={8} md={6} lg={6} xl={4} key={image.path}>
                <Card
                  hoverable
                  cover={
                    <div className={styles.imageContainer}>
                      <Image
                        src={image.url}
                        alt={image.name}
                        preview={false}
                        onClick={() => {
                          setPreviewImage(image.url)
                          setPreviewVisible(true)
                        }}
                        fallback="data:image/png;base64,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"
                      />
                    </div>
                  }
                  actions={[
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyLink(image.url)}
                      title={t['content.images.copy'] || '复制链接'}
                    />,
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setCurrentImage(image)
                        setNewName(image.name)
                        setRenameVisible(true)
                      }}
                      title={t['content.images.rename'] || '重命名'}
                    />,
                    <Button
                      type="text"
                      icon={<ScissorOutlined />}
                      onClick={() => {
                        setCurrentImage(image)
                        setTargetFolder('')
                        setMoveVisible(true)
                      }}
                      title={t['content.images.move'] || '移动'}
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
                      />
                    </Popconfirm>
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
        onCancel={() => setUploadVisible(false)}
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
              {data.folders.map(folder => (
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
              name="file"
              multiple={false}
              beforeUpload={beforeUpload}
              customRequest={handleCustomUpload}
              showUploadList={false}
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
          {data.folders.map(folder => (
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
    </div>
  )
}

export default ImageManager
import React, { useContext, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Divider,
  Dropdown,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  Tree
} from 'antd'
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import service from '@/utils/api'
import useLocale from '@/hooks/useLocale'
import { GlobalContext } from '@/context'
import useDeviceDetect from '@/hooks/useDeviceDetect'
import styles from './style/index.module.less'
import YamlEditor from './components/YamlEditor'
import TemplateManager from './components/TemplateManager'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TabPane } = Tabs

interface YamlFile {
  name: string;
  path: string;
  content: string;
  lastModified: string;
}

interface YamlTemplate {
  id: string;
  name: string;
  description: string;
  structure: any;
  variables: any[];
}

const YamlManager: React.FC = () => {
  const t = useLocale()
  const { theme } = useContext(GlobalContext)
  const { isMobile } = useDeviceDetect()

  const [loading, setLoading] = useState(false)
  const [yamlFiles, setYamlFiles] = useState<YamlFile[]>([])
  const [templates, setTemplates] = useState<YamlTemplate[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [currentFile, setCurrentFile] = useState<YamlFile | null>(null)
  const [currentTemplate, setCurrentTemplate] = useState<YamlTemplate | null>(null)
  const [editMode, setEditMode] = useState<'file' | 'template' | null>(null)
  const [createFileVisible, setCreateFileVisible] = useState(false)
  const [createTemplateVisible, setCreateTemplateVisible] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFilePath, setNewFilePath] = useState('')
  const [newTemplateData, setNewTemplateData] = useState({
    name: '',
    description: '',
    structure: {},
    variables: []
  })
  const [activeTab, setActiveTab] = useState('files')

  // 获取YAML文件列表
  const fetchYamlFiles = async () => {
    setLoading(true)
    try {
      const res = await service.get('/hexopro/api/yaml/list', {
        params: {
          page: currentPage,
          pageSize: pageSize
        }
      })
      setYamlFiles(res.data.files)
      setTotal(res.data.total)
    } catch (error) {
      message.error(t['content.yaml.fetchFailed'] || '获取YAML文件列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 获取模板列表
  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await service.get('/hexopro/api/yaml/templates')
      setTemplates(res.data)
    } catch (error) {
      message.error(t['content.yaml.fetchTemplatesFailed'] || '获取模板列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 创建新YAML文件
  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      message.error(t['content.yaml.fileNameRequired'] || '文件名称不能为空')
      return
    }

    try {
      await service.post('/hexopro/api/yaml/create', {
        name: newFileName,
        path: newFilePath,
        content: '# 新建YAML文件\n'
      })
      message.success(t['content.yaml.createSuccess'] || '创建文件成功')
      setCreateFileVisible(false)
      setNewFileName('')
      setNewFilePath('')
      fetchYamlFiles()
    } catch (error) {
      message.error(t['content.yaml.createFailed'] || '创建文件失败')
      console.error(error)
    }
  }

  // 创建新模板
  const handleCreateTemplate = async () => {
    if (!newTemplateData.name.trim()) {
      message.error(t['content.yaml.templateNameRequired'] || '模板名称不能为空')
      return
    }

    try {
      // 获取表单中的变量数据
      const formElement = document.querySelector('form')
      const formData = new FormData(formElement as HTMLFormElement)
      const variables = []

      // 从表单中提取变量数据
      const formFields = formElement?.querySelectorAll('.ant-row')
      if (formFields && formFields.length > 0) {
        formFields.forEach((row) => {
          const nameInput = row.querySelector('input[placeholder="title"]')
          const typeSelect = row.querySelector('.ant-select-selection-item')
          const defaultInput = row.querySelector('input[placeholder="默认值"]')
          const descInput = row.querySelector('input[placeholder="变量描述"]')

          if (nameInput) {
            const name = (nameInput as HTMLInputElement).value
            const type = typeSelect ? (typeSelect as HTMLElement).textContent || 'string' : 'string'
            const defaultValue = defaultInput ? (defaultInput as HTMLInputElement).value : ''
            const description = descInput ? (descInput as HTMLInputElement).value : ''

            if (name) {
              variables.push({
                name,
                type,
                default: defaultValue,
                description
              })
            }
          }
        })
      }

      const templateData = {
        ...newTemplateData,
        variables: variables.length > 0 ? variables : newTemplateData.variables
      }

      await service.post('/hexopro/api/yaml/template/create', templateData)
      message.success(t['content.yaml.createTemplateSuccess'] || '创建模板成功')
      setCreateTemplateVisible(false)
      setNewTemplateData({
        name: '',
        description: '',
        structure: {},
        variables: []
      })
      fetchTemplates()
    } catch (error) {
      message.error(t['content.yaml.createTemplateFailed'] || '创建模板失败')
      console.error(error)
    }
  }

  // 保存YAML文件
  const handleSaveFile = async (file: YamlFile, content: string) => {
    try {
      await service.post('/hexopro/api/yaml/update', {
        path: file.path,
        content: content
      })
      message.success(t['content.yaml.saveSuccess'] || '保存成功')
      fetchYamlFiles()
    } catch (error) {
      message.error(t['content.yaml.saveFailed'] || '保存失败')
      console.error(error)
    }
  }

  // 删除YAML文件
  const handleDeleteFile = async (file: YamlFile) => {
    try {
      await service.post('/hexopro/api/yaml/delete', {
        path: file.path
      })
      message.success(t['content.yaml.deleteSuccess'] || '删除成功')
      if (currentFile && currentFile.path === file.path) {
        setCurrentFile(null)
        setEditMode(null)
      }
      fetchYamlFiles()
    } catch (error) {
      message.error(t['content.yaml.deleteFailed'] || '删除失败')
      console.error(error)
    }
  }

  // 应用模板
  const handleApplyTemplate = async (template: YamlTemplate, values: any, targetPath: string) => {
    try {
      await service.post('/hexopro/api/yaml/apply-template', {
        templateId: template.id,
        values: values,
        targetPath: targetPath
      })
      message.success(t['content.yaml.applyTemplateSuccess'] || '应用模板成功')
      fetchYamlFiles()
    } catch (error) {
      message.error(t['content.yaml.applyTemplateFailed'] || '应用模板失败')
      console.error(error)
    }
  }

  // 处理页面变化
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page)
    if (pageSize) setPageSize(pageSize)
  }

  // 初始加载和依赖变化时获取数据
  useEffect(() => {
    fetchYamlFiles()
  }, [currentPage, pageSize])

  useEffect(() => {
    fetchTemplates()
  }, [])

  // 新增状态
  const [fileListCollapsed, setFileListCollapsed] = useState(false)
  const [fullscreenMode, setFullscreenMode] = useState(false)

  // 切换文件列表收起/展开状态
  const toggleFileList = () => {
    setFileListCollapsed(!fileListCollapsed)
  }

  // 切换全屏编辑模式
  const toggleFullscreen = () => {
    setFullscreenMode(!fullscreenMode)
    
    // 全屏模式下自动调整编辑器大小
    setTimeout(() => {
      const editor = document.getElementById('yaml-editor') as any
      if (editor && editor.layout) {
        editor.layout()
      }
    }, 100)
  }

  return (
    <div className={styles.yamlManager}>
      <div className={styles.header}>
        <Title level={4}>{t['content.yaml.title'] || 'YAML 管理'}</Title>
        <Space>
          <Button
            type="primary"
            icon={<FileAddOutlined />}
            onClick={() => setCreateFileVisible(true)}
          >
            {!isMobile && (t['content.yaml.createFile'] || '新建文件')}
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setCreateTemplateVisible(true)}
          >
            {!isMobile && (t['content.yaml.createTemplate'] || '新建模板')}
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={t['content.yaml.files'] || '文件管理'} key="files">
          <Row gutter={16} className={fullscreenMode ? styles.fullscreenContainer : ''}>
            {/* 文件列表列 */}
            {(!fileListCollapsed || !editMode) && (
              <Col 
                xs={24} 
                sm={24} 
                md={editMode === 'file' ? (fileListCollapsed ? 0 : 8) : 24} 
                lg={editMode === 'file' ? (fileListCollapsed ? 0 : 8) : 24}
                xl={editMode === 'file' ? (fileListCollapsed ? 0 : 8) : 24}
                className={styles.fileListColumn}
              >
                <Spin spinning={loading}>
                  {yamlFiles.length > 0 ? (
                    <div>
                      <Table
                        dataSource={yamlFiles}
                        rowKey="path"
                        size={isMobile ? "small" : "middle"}
                        pagination={{
                          current: currentPage,
                          pageSize: pageSize,
                          total: total,
                          onChange: handlePageChange,
                          showSizeChanger: true,
                          size: isMobile ? "small" : "default"
                        }}
                        scroll={{ x: isMobile ? 500 : undefined }}
                      >
                        <Table.Column
                          title={t['content.yaml.fileName'] || '文件名'}
                          dataIndex="name"
                          key="name"
                          render={(text, record: YamlFile) => (
                            <a onClick={() => {
                              setCurrentFile(record)
                              setEditMode('file')
                            }}>{text}</a>
                          )}
                        />
                        {!isMobile && (
                          <Table.Column
                            title={t['content.yaml.filePath'] || '路径'}
                            dataIndex="path"
                            key="path"
                            ellipsis={true}
                          />
                        )}
                        {!isMobile && (
                          <Table.Column
                            title={t['content.yaml.lastModified'] || '最后修改时间'}
                            dataIndex="lastModified"
                            key="lastModified"
                          />
                        )}
                        <Table.Column
                          title={t['content.yaml.actions'] || '操作'}
                          key="actions"
                          render={(_, record: YamlFile) => (
                            <Space>
                              <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setCurrentFile(record)
                                  setEditMode('file')
                                }}
                              />
                              <Popconfirm
                                title={t['content.yaml.deleteConfirm'] || '确定要删除这个文件吗？'}
                                onConfirm={() => handleDeleteFile(record)}
                                okText={t['content.yaml.ok'] || '确定'}
                                cancelText={t['content.yaml.cancel'] || '取消'}
                              >
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                />
                              </Popconfirm>
                            </Space>
                          )}
                        />
                      </Table>
                    </div>
                  ) : (
                    <Empty
                      description={t['content.yaml.noFiles'] || '暂无YAML文件'}
                      className={styles.empty}
                    />
                  )}
                </Spin>
              </Col>
            )}
            
            {/* 编辑器列 */}
            {editMode === 'file' && currentFile && (
              <Col 
                xs={24} 
                sm={24} 
                md={fileListCollapsed ? 24 : 16} 
                lg={fileListCollapsed ? 24 : 16}
                xl={fileListCollapsed ? 24 : 16}
                className={styles.editorColumn}
              >
                <Card
                  title={currentFile.name}
                  extra={
                    <Space>
                      {!isMobile && (
                        <Button
                          icon={fileListCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                          onClick={toggleFileList}
                          title={fileListCollapsed ? '展开文件列表' : '收起文件列表'}
                        />
                      )}
                      <Button
                        icon={fullscreenMode ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                        onClick={toggleFullscreen}
                        title={fullscreenMode ? '退出全屏' : '全屏编辑'}
                      />
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={() => {
                          if (currentFile) {
                            const editor = document.getElementById('yaml-editor') as any
                            if (editor && editor.getValue) {
                              handleSaveFile(currentFile, editor.getValue())
                            }
                          }
                        }}
                      >
                        {!isMobile && (t['content.yaml.save'] || '保存')}
                      </Button>
                    </Space>
                  }
                  className={fullscreenMode ? styles.fullscreenCard : ''}
                >
                  <YamlEditor
                    id="yaml-editor"
                    initialValue={currentFile.content}
                    height={fullscreenMode ? "calc(100vh - 120px)" : "500px"}
                  />
                </Card>
              </Col>
            )}
          </Row>
        </TabPane>
        <TabPane tab={t['content.yaml.templates'] || '模板管理'} key="templates">
          <TemplateManager
            templates={templates}
            yamlFiles={yamlFiles}
            onApplyTemplate={handleApplyTemplate}
            onRefresh={fetchTemplates}
          />
        </TabPane>
      </Tabs>

      {/* 新建文件对话框 */}
      <Modal
        title={t['content.yaml.createFile'] || '新建YAML文件'}
        open={createFileVisible}
        onOk={handleCreateFile}
        onCancel={() => {
          setCreateFileVisible(false)
          setNewFileName('')
          setNewFilePath('')
        }}
        okText={t['content.yaml.ok'] || '确定'}
        cancelText={t['content.yaml.cancel'] || '取消'}
      >
        <Form layout="vertical">
          <Form.Item
            label={t['content.yaml.fileName'] || '文件名'}
            required
          >
            <Input
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              placeholder={t['content.yaml.fileNamePlaceholder'] || '请输入文件名，例如：config.yml'}
            />
          </Form.Item>
          <Form.Item
            label={t['content.yaml.filePath'] || '文件路径'}
          >
            <Input
              value={newFilePath}
              onChange={e => setNewFilePath(e.target.value)}
              placeholder={t['content.yaml.filePathPlaceholder'] || '请输入文件路径，例如：themes/my-theme/'}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建模板对话框 */}
      <Modal
        title={t['content.yaml.createTemplate'] || '新建模板'}
        open={createTemplateVisible}
        onOk={handleCreateTemplate}
        onCancel={() => {
          setCreateTemplateVisible(false)
          setNewTemplateData({
            name: '',
            description: '',
            structure: {},
            variables: []
          })
        }}
        okText={t['content.yaml.ok'] || '确定'}
        cancelText={t['content.yaml.cancel'] || '取消'}
        width={700}
      >
        <Form layout="vertical">
          <Form.Item
            label={t['content.yaml.templateName'] || '模板名称'}
            required
          >
            <Input
              value={newTemplateData.name}
              onChange={e => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
              placeholder={t['content.yaml.templateNamePlaceholder'] || '请输入模板名称'}
            />
          </Form.Item>
          <Form.Item
            label={t['content.yaml.templateDescription'] || '模板描述'}
          >
            <Input.TextArea
              value={newTemplateData.description}
              onChange={e => setNewTemplateData({ ...newTemplateData, description: e.target.value })}
              placeholder={t['content.yaml.templateDescriptionPlaceholder'] || '请输入模板描述'}
              rows={3}
            />
          </Form.Item>
          <Divider>{t['content.yaml.templateStructure'] || '模板结构'}</Divider>
          <Paragraph>
            {t['content.yaml.templateStructureDescription'] || '请在下方编辑器中输入模板的YAML结构，使用 ${变量名} 作为变量占位符。'}
          </Paragraph>
          <YamlEditor
            id="template-structure-editor"
            initialValue="# 示例模板结构\ntitle: ${title}\ndescription: ${description}\nitems:\n  - name: ${item1_name}\n    value: ${item1_value}\n  - name: ${item2_name}\n    value: ${item2_value}"
            height="200px"
            onChange={(value) => {
              try {
                setNewTemplateData({
                  ...newTemplateData,
                  structure: value
                })
              } catch (e) {
                console.error('Invalid YAML structure', e)
              }
            }}
          />
          <Divider>{t['content.yaml.templateVariables'] || '模板变量'}</Divider>
          <Form.List
            name="variables"
            initialValue={[{ name: '', description: '', type: 'string', default: '' }]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map(field => (
                  <Row key={field.key} gutter={16}>
                    <Col span={6}>
                      <Form.Item
                        {...field}
                        label={t['content.yaml.variableName'] || '变量名'}
                        name={[field.name, 'name']}
                      >
                        <Input placeholder="title" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...field}
                        label={t['content.yaml.variableType'] || '类型'}
                        name={[field.name, 'type']}
                      >
                        <Select defaultValue="string">
                          <Option value="string">字符串</Option>
                          <Option value="number">数字</Option>
                          <Option value="boolean">布尔值</Option>
                          <Option value="array">数组</Option>
                          <Option value="object">对象</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...field}
                        label={t['content.yaml.variableDefault'] || '默认值'}
                        name={[field.name, 'default']}
                      >
                        <Input placeholder="默认值" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...field}
                        label={t['content.yaml.variableDescription'] || '描述'}
                        name={[field.name, 'description']}
                      >
                        <Input placeholder="变量描述" />
                      </Form.Item>
                    </Col>
                    <Col span={1} style={{ display: 'flex', alignItems: 'center', marginTop: 30 }}>
                      <DeleteOutlined onClick={() => remove(field.name)} />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    {t['content.yaml.addVariable'] || '添加变量'}
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}

export default YamlManager
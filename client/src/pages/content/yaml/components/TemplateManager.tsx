import React, { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tabs,
  Typography
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  ImportOutlined,
  PlusOutlined,
  SaveOutlined
} from '@ant-design/icons';
import service from '@/utils/api';
import useLocale from '@/hooks/useLocale';
import YamlEditor from './YamlEditor';
import yaml from 'js-yaml';
import styles from '../style/index.module.less'

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

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

interface TemplateManagerProps {
  templates: YamlTemplate[];
  yamlFiles: YamlFile[];
  onApplyTemplate: (template: YamlTemplate, values: any, targetPath: string) => void;
  onRefresh: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  yamlFiles,
  onApplyTemplate,
  onRefresh
}) => {
  const t = useLocale();
  const [form] = Form.useForm();

  const [currentTemplate, setCurrentTemplate] = useState<YamlTemplate | null>(null);
  const [applyTemplateVisible, setApplyTemplateVisible] = useState(false);
  const [targetPath, setTargetPath] = useState('');
  const [editTemplateVisible, setEditTemplateVisible] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState<YamlTemplate | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);

  // 删除模板
  const handleDeleteTemplate = async (template: YamlTemplate) => {
    try {
      await service.post('/hexopro/api/yaml/template/delete', {
        id: template.id
      });
      message.success(t['content.yaml.deleteTemplateSuccess'] || '删除模板成功');
      onRefresh();
    } catch (error) {
      message.error(t['content.yaml.deleteTemplateFailed'] || '删除模板失败');
      console.error(error);
    }
  };

  // 编辑模板
  const handleEditTemplate = async () => {
    if (!editedTemplate) return;

    try {
      await service.post('/hexopro/api/yaml/templates/update', editedTemplate);
      message.success(t['content.yaml.updateTemplateSuccess'] || '更新模板成功');
      setEditTemplateVisible(false);
      onRefresh();
    } catch (error) {
      message.error(t['content.yaml.updateTemplateFailed'] || '更新模板失败');
      console.error(error);
    }
  };

  // 应用模板
  const handleApplyTemplate = async () => {
    try {
      const values = await form.validateFields();
      if (currentTemplate) {
        onApplyTemplate(currentTemplate, values, targetPath);
        setApplyTemplateVisible(false);
        form.resetFields();
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 导出模板
  const handleExportTemplate = (template: YamlTemplate) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${template.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // 导入模板
  const handleImportTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const template = JSON.parse(event.target?.result as string);
            await service.post('/hexopro/api/yaml/templates/import', template);
            message.success(t['content.yaml.importTemplateSuccess'] || '导入模板成功');
            onRefresh();
          } catch (error) {
            message.error(t['content.yaml.importTemplateFailed'] || '导入模板失败');
            console.error(error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          icon={<ImportOutlined />}
          onClick={handleImportTemplate}
        >
          {t['content.yaml.importTemplate'] || '导入模板'}
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {templates.map(template => (
          <Col xs={24} sm={12} md={8} lg={8} xl={6} key={template.id}>
            <Card
              title={template.name}
              extra={
                <Space>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditedTemplate({ ...template });
                      setEditTemplateVisible(true);
                    }}
                  />
                  <Button
                    type="text"
                    icon={<ExportOutlined />}
                    onClick={() => handleExportTemplate(template)}
                  />
                  <Popconfirm
                    title={t['content.yaml.deleteTemplateConfirm'] || '确定要删除这个模板吗？'}
                    onConfirm={() => handleDeleteTemplate(template)}
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
              }
              actions={[
                <Button
                  type="primary"
                  onClick={() => {
                    setCurrentTemplate(template);
                    setApplyTemplateVisible(true);
                    form.resetFields();

                    // 为每个变量设置默认值
                    const initialValues = {};
                    template.variables.forEach(variable => {
                      initialValues[variable.name] = variable.default || '';
                    });
                    form.setFieldsValue(initialValues);
                  }}
                >
                  {t['content.yaml.applyTemplate'] || '应用模板'}
                </Button>
              ]}
            >
              <div style={{ marginBottom: 16 }}>
                <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                  {template.description || t['content.yaml.noDescription'] || '暂无描述'}
                </Paragraph>
              </div>
              <div>
                <Text type="secondary">
                  {t['content.yaml.variableCount'] || '变量数量'}: {template.variables.length}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 应用模板对话框 */}
      <Modal
        title={`${t['content.yaml.applyTemplate'] || '应用模板'}: ${currentTemplate?.name || ''}`}
        open={applyTemplateVisible}
        onOk={handleApplyTemplate}
        onCancel={() => setApplyTemplateVisible(false)}
        okText={t['content.yaml.ok'] || '确定'}
        cancelText={t['content.yaml.cancel'] || '取消'}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t['content.yaml.targetPath'] || '目标路径'}
            name="targetPath"
            rules={[{ required: true, message: t['content.yaml.targetPathRequired'] || '请选择目标路径' }]}
          >
            <Select
              placeholder={t['content.yaml.selectTargetPath'] || '选择目标路径'}
              onChange={value => setTargetPath(value)}
            >
              {yamlFiles.map(file => (
                <Option key={file.path} value={file.path}>{file.path}</Option>
              ))}
              <Option value="__new__">{t['content.yaml.createNewFile'] || '创建新文件'}</Option>
            </Select>
          </Form.Item>

          {targetPath === '__new__' && (
            <Form.Item
              label={t['content.yaml.newFilePath'] || '新文件路径'}
              name="newFilePath"
              rules={[{ required: true, message: t['content.yaml.newFilePathRequired'] || '请输入新文件路径' }]}
            >
              <Input placeholder={t['content.yaml.newFilePathPlaceholder'] || '例如：themes/my-theme/config.yml'} />
            </Form.Item>
          )}

          <Divider>{t['content.yaml.templateVariables'] || '模板变量'}</Divider>

          {currentTemplate?.variables.map(variable => (
            <Form.Item
              key={variable.name}
              label={
                <Space>
                  <Text strong>{variable.name}</Text>
                  {variable.description && (
                    <Text type="secondary">({variable.description})</Text>
                  )}
                </Space>
              }
              name={variable.name}
              rules={[{ required: true, message: t['content.yaml.variableRequired'] || '请输入变量值' }]}
            >
              {variable.type === 'string' && (
                <Input placeholder={`${t['content.yaml.enterValue'] || '请输入值'}`} />
              )}
              {variable.type === 'number' && (
                <Input type="number" placeholder={`${t['content.yaml.enterNumber'] || '请输入数字'}`} />
              )}
              {variable.type === 'boolean' && (
                <Select>
                  <Option value="true">true</Option>
                  <Option value="false">false</Option>
                </Select>
              )}
              {variable.type === 'array' && (
                <Select mode="tags" placeholder={`${t['content.yaml.enterItems'] || '请输入项目，回车分隔'}`} />
              )}
              {variable.type === 'object' && (
                <Input.TextArea rows={4} placeholder={`${t['content.yaml.enterObject'] || '请输入JSON对象'}`} />
              )}
            </Form.Item>
          ))}

          <Divider>{t['content.yaml.preview'] || '预览'}</Divider>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            {!previewFullscreen && (
              <Button
                className={styles.fullscreenBtn}
                icon={<FullscreenOutlined />}
                size="small"
                style={{ position: 'absolute', right: 0, top: -36, zIndex: 10 }}
                onClick={() => setPreviewFullscreen(true)}
              >
                全屏预览
              </Button>
            )}
            <div
              className={previewFullscreen ? styles.fullscreenContainer : ''}
              style={previewFullscreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 2000, background: '#fff', padding: 24 } : {}}
            >
              {previewFullscreen && (
                <Button
                  className={styles.fullscreenBtn}
                  icon={<FullscreenExitOutlined />}
                  size="small"
                  style={{ position: 'absolute', right: 24, top: 16, zIndex: 1101 }}
                  onClick={() => setPreviewFullscreen(false)}
                >
                  退出全屏
                </Button>
              )}
              <YamlEditor
                id="template-preview"
                initialValue={
                  currentTemplate?.structure
                    ? (typeof currentTemplate.structure === 'string'
                      ? currentTemplate.structure
                      : yaml.dump(currentTemplate.structure))
                    : ''
                }
                height={previewFullscreen ? 'calc(100vh - 80px)' : '200px'}
                readOnly={true}
              />
            </div>
          </div>
        </Form>
      </Modal>

      {/* 编辑模板对话框 */}
      <Modal
        title={t['content.yaml.editTemplate'] || '编辑模板'}
        open={editTemplateVisible}
        onOk={handleEditTemplate}
        onCancel={() => {
          setEditTemplateVisible(false);
          setFullscreen(false); // 关闭 Modal 时退出全屏
        }}
        okText={t['content.yaml.ok'] || '确定'}
        cancelText={t['content.yaml.cancel'] || '取消'}
        width={700} // 移除 fullscreen ? '100vw' : 700
      // 移除 style, bodyStyle, className
      >
        {editedTemplate && (
          <Form layout="vertical">
            {/* Template Name and Description Form Items remain the same */}
            <Form.Item
              label={t['content.yaml.templateName'] || '模板名称'}
              required
            >
              <Input
                value={editedTemplate.name}
                onChange={e => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                placeholder={t['content.yaml.templateNamePlaceholder'] || '请输入模板名称'}
              />
            </Form.Item>
            <Form.Item
              label={t['content.yaml.templateDescription'] || '模板描述'}
            >
              <Input.TextArea
                value={editedTemplate.description}
                onChange={e => setEditedTemplate({ ...editedTemplate, description: e.target.value })}
                placeholder={t['content.yaml.templateDescriptionPlaceholder'] || '请输入模板描述'}
                rows={3}
              />
            </Form.Item>

            <Divider>{t['content.yaml.templateStructure'] || '模板结构'}</Divider>
            {/* 修改全屏容器和按钮逻辑 */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              {!fullscreen && (
                <Button
                  className={styles.fullscreenBtn}
                  icon={<FullscreenOutlined />}
                  size="small"
                  style={{ position: 'absolute', right: 0, top: -36, zIndex: 10 }} // 调整按钮位置
                  onClick={() => setFullscreen(true)}
                >
                  {t['content.yaml.fullscreenEdit'] || '全屏编辑'}
                </Button>
              )}
              <div
                className={fullscreen ? styles.fullscreenContainer : ''}
                style={fullscreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050, background: '#fff', padding: 24 } : {}} // 使用与预览一致的样式, 调整 zIndex
              >
                {fullscreen && (
                  <Button
                    className={styles.fullscreenBtn}
                    icon={<FullscreenExitOutlined />}
                    size="small"
                    style={{ position: 'absolute', right: 24, top: 16, zIndex: 1101 }} // 使用与预览一致的样式
                    onClick={() => setFullscreen(false)}
                  >
                    {t['content.yaml.exitFullscreen'] || '退出全屏'}
                  </Button>
                )}
                <YamlEditor
                  id="edit-template-structure"
                  initialValue={
                    editedTemplate.structure
                      ? (typeof editedTemplate.structure === 'string'
                        ? editedTemplate.structure
                        : yaml.dump(editedTemplate.structure))
                      : ''
                  }
                  height={fullscreen ? 'calc(100vh - 80px)' : '200px'} // 调整全屏高度
                  onChange={(value) => {
                    try {
                      // 尝试解析 YAML 以确保其有效性，但仅在编辑时更新字符串状态
                      yaml.load(value);
                      setEditedTemplate({ ...editedTemplate, structure: value });
                    } catch (e) {
                      // 如果 YAML 无效，仍然更新编辑器的内容，但不改变状态中的 structure
                      // 或者可以添加一个错误提示
                      console.warn("Invalid YAML structure:", e);
                      // 仅更新编辑器显示，不更新 state
                      setEditedTemplate(prev => ({ ...prev, structure: value })); // 或者保持原样，让用户修复
                    }
                  }}
                />
              </div>
            </div>

            <Divider>{t['content.yaml.templateVariables'] || '模板变量'}</Divider>
            {/* Form.List for variables remains the same */}
            <Form.List
              name="variables"
              initialValue={editedTemplate.variables}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field, index) => ( // 使用 index
                    <Row key={field.key} gutter={16} style={{ alignItems: 'flex-start' }}>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          {...field}
                          label={t['content.yaml.variableName'] || '变量名'}
                          name={[field.name, 'name']}
                          fieldKey={[field.fieldKey, 'name']} // 添加 fieldKey
                          rules={[{ required: true, message: '请输入变量名' }]}
                        >
                          <Input
                            placeholder="title"
                          // 移除 value 和 onChange，让 Form.List 控制
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          {...field}
                          label={t['content.yaml.variableType'] || '类型'}
                          name={[field.name, 'type']}
                          fieldKey={[field.fieldKey, 'type']} // 添加 fieldKey
                          initialValue="string" // 设置默认值
                        >
                          <Select
                          // 移除 value 和 onChange
                          >
                            <Option value="string">字符串</Option>
                            <Option value="number">数字</Option>
                            <Option value="boolean">布尔值</Option>
                            <Option value="array">数组</Option>
                            <Option value="object">对象</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          {...field}
                          label={t['content.yaml.variableDefault'] || '默认值'}
                          name={[field.name, 'default']}
                          fieldKey={[field.fieldKey, 'default']} // 添加 fieldKey
                        >
                          <Input
                            placeholder="默认值"
                          // 移除 value 和 onChange
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={5}>
                        <Form.Item
                          {...field}
                          label={t['content.yaml.variableDescription'] || '描述'}
                          name={[field.name, 'description']}
                          fieldKey={[field.fieldKey, 'description']} // 添加 fieldKey
                        >
                          <Input
                            placeholder="变量描述"
                          // 移除 value 和 onChange
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={1} style={{ display: 'flex', alignItems: 'center', height: '32px', marginTop: '30px' }}>
                        <DeleteOutlined
                          onClick={() => remove(field.name)} // 使用 Form.List 提供的 remove
                        />
                      </Col>
                    </Row>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add({ name: '', type: 'string', default: '', description: '' })} // 使用 Form.List 提供的 add
                      block
                      icon={<PlusOutlined />}
                    >
                      {t['content.yaml.addVariable'] || '添加变量'}
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default TemplateManager;
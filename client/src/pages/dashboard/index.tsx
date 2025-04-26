import React, { useContext, useEffect, useState } from 'react';
import {
  Row, Col, Card, Statistic, Tag, List, Button, Input,
  Space, Divider, Typography, Calendar, Timeline, Spin,
  message, Tooltip, Badge, Checkbox
} from 'antd';
import {
  FileAddOutlined, EditOutlined, SearchOutlined,
  EyeOutlined, CloudUploadOutlined, SettingOutlined,
  TagsOutlined, FolderOutlined, ClockCircleOutlined,
  QuestionCircleOutlined, LinkOutlined, HomeOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from '@/context';
import useLocale from '@/hooks/useLocale';
import useDeviceDetect from '@/hooks/useDeviceDetect';
import service from '@/utils/api';
import { base64Encode } from '@/utils/encodeUtils';
import styles from './style/index.module.less';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useContext(GlobalContext);
  const t = useLocale();
  const { isMobile } = useDeviceDetect();

  // 状态定义
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    draftPosts: 0,
    publishedPosts: 0,
    categories: [],
    tags: [],
    recentPosts: []
  });
  const [systemInfo, setSystemInfo] = useState({
    hexoVersion: '',
    theme: '',
    plugins: [],
    lastDeployTime: ''
  });
  const [todoItems, setTodoItems] = useState([]);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setLoading(true);
      // 获取文章统计
      const postsRes = await service.get('/hexopro/api/dashboard/posts/stats');
      // 获取分类统计
      const categoriesRes = await service.get('/hexopro/api/dashboard/categories/list');
      // 获取标签统计
      const tagsRes = await service.get('/hexopro/api/dashboard/tags/list');
      // 获取最近文章
      const recentPostsRes = await service.get('/hexopro/api/dashboard/posts/recent', {
        params: { limit: 5 }
      });

      setStats({
        totalPosts: postsRes.data.total || 0,
        draftPosts: postsRes.data.drafts || 0,
        publishedPosts: postsRes.data.published || 0,
        categories: categoriesRes.data || [],
        tags: tagsRes.data || [],
        recentPosts: recentPostsRes.data || []
      });

      // 获取系统信息
      const systemRes = await service.get('/hexopro/api/dashboard/system/info');
      setSystemInfo(systemRes.data || {
        hexoVersion: 'N/A',
        theme: 'N/A',
        plugins: [],
        lastDeployTime: 'N/A'
      });

      // 获取待办事项
      const todoRes = await service.get('/hexopro/api/dashboard/todos/list');
      setTodoItems(todoRes.data || []);

    } catch (error) {
      message.error('获取数据失败，请稍后重试');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 创建新文章
  const createNewPost = async (title) => {
    try {
      const res = await service.post('/hexopro/api/posts/new', { title });
      if (res.data) {
        message.success('文章创建成功');
        navigate(`/post/${base64Encode(res.data.permalink)}`);
      }
    } catch (error) {
      message.error('创建文章失败');
      console.error(error);
    }
  };

  // 添加待办事项
  const addTodoItem = async (content) => {
    try {
      await service.post('/hexopro/api/dashboard/todos/add', { content });
      message.success('添加成功');
      fetchStats(); // 刷新数据
    } catch (error) {
      message.error('添加失败');
      console.error(error);
    }
  };

  // 获取欢迎消息
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了，注意休息';
    if (hour < 9) return '早上好，开始新的一天';
    if (hour < 12) return '上午好，工作顺利';
    if (hour < 14) return '中午好，注意休息';
    if (hour < 18) return '下午好，继续加油';
    if (hour < 22) return '晚上好，放松一下';
    return '夜深了，注意休息';
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 渲染数据概览区域
  const renderStatsSection = () => (
    <Card
      title="数据概览"
      className={styles.dashboardCard}
      extra={<Button type="link" onClick={() => fetchStats()}>刷新</Button>}
    >
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title="总文章数"
              value={stats.totalPosts}
              prefix={<FileAddOutlined />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="草稿数"
              value={stats.draftPosts}
              prefix={<EditOutlined />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="已发布数"
              value={stats.publishedPosts}
              prefix={<CloudUploadOutlined />}
            />
          </Col>
        </Row>

        <Divider orientation="left">分类统计</Divider>
        <div className={styles.categoriesContainer}>
          {stats.categories.map(category => (
            <Tag
              key={category.name}
              color="blue"
              className={styles.categoryTag}
            >
              {category.name} ({category.count})
            </Tag>
          ))}
          {stats.categories.length === 0 && <Text type="secondary">暂无分类</Text>}
        </div>

        <Divider orientation="left">标签云</Divider>
        <div className={styles.tagsContainer}>
          {stats.tags.map(tag => (
            <Tag
              key={tag.name}
              color={tag.count > 5 ? 'purple' : tag.count > 2 ? 'geekblue' : 'blue'}
              className={styles.tagItem}
            >
              {tag.name} ({tag.count})
            </Tag>
          ))}
          {stats.tags.length === 0 && <Text type="secondary">暂无标签</Text>}
        </div>

        <Divider orientation="left">最近活动</Divider>
        <List
          size="small"
          dataSource={stats.recentPosts}
          renderItem={post => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate(`/post/${base64Encode(post.permalink)}`)}
                >
                  编辑
                </Button>
              ]}
            >
              <List.Item.Meta
                title={post.title}
                description={`${post.date} · ${post.isDraft ? '草稿' : '已发布'}`}
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无活动' }}
        />
      </Spin>
    </Card>
  );

  // 渲染快捷操作区
  const renderQuickActionsSection = () => (
    <Card title="快捷操作" className={styles.dashboardCard}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Button
            type="primary"
            icon={<FileAddOutlined />}
            size="large"
            block
            onClick={() => {
              const title = prompt('请输入文章标题');
              if (title) createNewPost(title);
            }}
          >
            新建文章
          </Button>
        </Col>
        <Col xs={12} sm={6}>
          <Button
            icon={<EditOutlined />}
            size="large"
            block
            onClick={() => navigate('/content/posts/drafts')}
          >
            草稿箱
          </Button>
        </Col>
        <Col xs={12} sm={6}>
          <Button
            icon={<EyeOutlined />}
            size="large"
            block
            onClick={() => navigate('/content/posts/blogs')}
          >
            已发布
          </Button>
        </Col>
        <Col xs={12} sm={6}>
          <Button
            icon={<RocketOutlined />}
            size="large"
            block
            onClick={() => navigate('/deploy')}
          >
            部署
          </Button>
        </Col>
      </Row>

      <Divider />

      <Search
        placeholder="搜索文章内容..."
        enterButton="搜索"
        size="large"
        onSearch={value => {
          if (value) {
            navigate(`/search?q=${encodeURIComponent(value)}`);
          }
        }}
      />
    </Card>
  );

  // 渲染系统状态区
  const renderSystemStatusSection = () => (
    <Card title="系统状态" className={styles.dashboardCard}>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Statistic
              title="Hexo 版本"
              value={systemInfo.hexoVersion || 'N/A'}
              valueStyle={{ fontSize: '16px' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Statistic
              title="主题"
              value={systemInfo.theme || 'N/A'}
              valueStyle={{ fontSize: '16px' }}
            />
          </Col>
        </Row>

        <Divider orientation="left">插件状态</Divider>
        <List
          size="small"
          dataSource={systemInfo.plugins || []}
          renderItem={plugin => (
            <List.Item>
              <Badge status={plugin.enabled ? "success" : "default"} />
              <Text>{plugin.name}</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>v{plugin.version}</Text>
            </List.Item>
          )}
          locale={{ emptyText: '暂无插件信息' }}
          pagination={systemInfo.plugins?.length > 5 ? { pageSize: 5 } : false}
        />

        <Divider orientation="left">部署状态</Divider>
        <Statistic
          title="最近部署时间"
          value={systemInfo.lastDeployTime || '暂无部署记录'}
          valueStyle={{ fontSize: '14px' }}
        />
      </Spin>
    </Card>
  );

  // 渲染个性化内容区
  const renderPersonalizedSection = () => (
    <Card
      title="个性化内容"
      className={styles.dashboardCard}
    >
      <div className={styles.welcomeMessage}>
        <Title level={4}>{getWelcomeMessage()}</Title>
        <Paragraph>今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Paragraph>
      </div>

      <Divider orientation="left">写作日历</Divider>
      <div className={styles.calendarContainer}>
        <Calendar
          fullscreen={false}
          onSelect={date => {
            // 可以在这里添加日期选择的逻辑
          }}
        />
      </div>

      <Divider orientation="left">待办事项</Divider>
      <List
        size="small"
        dataSource={todoItems}
        renderItem={item => (
          <List.Item
            actions={[
              <Button
                type="text"
                size="small"
                danger
                onClick={() => {
                  // 删除待办事项的逻辑
                }}
              >
                删除
              </Button>
            ]}
          >
            <Checkbox checked={item.completed} onChange={() => {
              // 更新待办事项状态的逻辑
            }}>
              {item.content}
            </Checkbox>
          </List.Item>
        )}
        footer={
          <div style={{ display: 'flex' }}>
            <Search
              placeholder="添加新待办..."
              enterButton="添加"
              size="small"
              onSearch={value => {
                if (value) addTodoItem(value);
              }}
            />
          </div>
        }
        locale={{ emptyText: '暂无待办事项' }}
      />
    </Card>
  );

  // 渲染资源链接区
  const renderResourcesSection = () => (
    <Card title="资源链接" className={styles.dashboardCard}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Button
            icon={<QuestionCircleOutlined />}
            block
            onClick={() => window.open('https://hexo.io/zh-cn/docs/', '_blank')}
          >
            Hexo 文档
          </Button>
        </Col>
        <Col xs={12} sm={6}>
          <Button
            icon={<TagsOutlined />}
            block
            onClick={() => window.open('https://hexo.io/themes/', '_blank')}
          >
            主题市场
          </Button>
        </Col>
        <Col xs={12} sm={6}>
          <Button
            icon={<FolderOutlined />}
            block
            onClick={() => window.open('https://hexo.io/plugins/', '_blank')}
          >
            插件中心
          </Button>
        </Col>
        <Col xs={12} sm={6}>
          <Button
            icon={<HomeOutlined />}
            block
            onClick={() => window.open('/', '_blank')}
          >
            博客前台
          </Button>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className={styles.dashboardContainer}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {renderStatsSection()}
          {renderQuickActionsSection()}
          {!isMobile && renderPersonalizedSection()}
        </Col>
        <Col xs={24} lg={8}>
          {renderSystemStatusSection()}
          {isMobile && renderPersonalizedSection()}
          {renderResourcesSection()}
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
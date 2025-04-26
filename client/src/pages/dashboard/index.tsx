import React, { useContext, useEffect, useState } from 'react';
import {
  Row, Col, Card, Statistic, Tag, List, Button, Input,
  Space, Divider, Typography, Calendar, Timeline, Spin,
  message, Tooltip, Badge, Checkbox, Avatar
} from 'antd';
import {
  FileAddOutlined, EditOutlined, SearchOutlined,
  EyeOutlined, CloudUploadOutlined, SettingOutlined,
  TagsOutlined, FolderOutlined, ClockCircleOutlined,
  QuestionCircleOutlined, LinkOutlined, HomeOutlined,
  RocketOutlined, PlusOutlined, BarChartOutlined,
  CalendarOutlined, LineChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from '@/context';
import useLocale from '@/hooks/useLocale';
import useDeviceDetect from '@/hooks/useDeviceDetect';
import service from '@/utils/api';
import { base64Encode } from '@/utils/encodeUtils';
import styles from './style/index.module.less';
import { Line } from '@ant-design/charts';

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
    lastDeployTime: '',
    author: ''
  });
  const [todoItems, setTodoItems] = useState([]);
  const [visitStats, setVisitStats] = useState([]);

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

      // 模拟访问数据
      setVisitStats([
        { date: '2023-01', value: 320 },
        { date: '2023-02', value: 450 },
        { date: '2023-03', value: 520 },
        { date: '2023-04', value: 390 },
        { date: '2023-05', value: 680 },
        { date: '2023-06', value: 720 },
        { date: '2023-07', value: 650 },
      ]);

    } catch (error) {
      message.error('获取数据失败，请稍后重试');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 检查标题是否已存在
  const checkTitleExists = async (title) => {
    try {
      const res = await service.get('/hexopro/api/posts/check-title', {
        params: { title }
      })
      return res.data.exists
    } catch (err) {
      console.error('检查标题失败', err)
      return false
    }
  }

  // 创建新文章
  const createNewPost = async (title) => {
    try {
      // 检查标题是否已存在
      const exists = await checkTitleExists(title)
      let finalTitle = title
      
      if (exists) {
        // 如果存在，自动添加时间戳后缀
        finalTitle = `${title} (${Date.now()})`
        message.info('已存在同名文章，已自动添加区分字符')
      }
      
      const res = await service.post('/hexopro/api/posts/new', { title: finalTitle });
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

  // 渲染顶部欢迎区域
  const renderWelcomeSection = () => (
    <Card className={`${styles.dashboardCard} ${styles.welcomeCard}`}>
      <div className={styles.welcomeHeader}>
        <div className={styles.welcomeInfo}>
          <Title level={3}>
            {getWelcomeMessage()}
            {systemInfo.author ? `，${systemInfo.author}` : ''}
          </Title>
          <Paragraph>今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Paragraph>
        </div>
        <div className={styles.quickActions}>
          <Button type="primary" icon={<FileAddOutlined />} onClick={() => {
            const title = prompt('请输入文章标题');
            if (title) createNewPost(title);
          }}>新建文章</Button>
          <Button icon={<EditOutlined />} onClick={() => navigate('/content/posts/drafts')}>草稿箱</Button>
          <Button icon={<RocketOutlined />} onClick={() => navigate('/deploy')}>部署</Button>
          <Button icon={<HomeOutlined />} onClick={() => window.open('/', '_blank')}>博客前台</Button>
        </div>
      </div>
    </Card>
  );

  // 渲染核心指标卡片
  const renderCoreMetricsSection = () => (
    <Row gutter={[16, 16]} className={styles.metricsRow}>
      <Col xs={24} sm={12} md={6}>
        <Card className={`${styles.dashboardCard} ${styles.metricCard}`}>
          <Statistic
            title="文章总数"
            value={stats.totalPosts}
            prefix={<FileAddOutlined className={styles.metricIcon} />}
            className={styles.metricStatistic}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className={`${styles.dashboardCard} ${styles.metricCard}`}>
          <Statistic
            title="访问量"
            value={visitStats.reduce((sum, item) => sum + item.value, 0)}
            prefix={<EyeOutlined className={styles.metricIcon} />}
            className={styles.metricStatistic}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className={`${styles.dashboardCard} ${styles.metricCard}`}>
          <Statistic
            title="草稿数"
            value={stats.draftPosts}
            prefix={<EditOutlined className={styles.metricIcon} />}
            className={styles.metricStatistic}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className={`${styles.dashboardCard} ${styles.metricCard}`}>
          <Statistic
            title="待办事项"
            value={todoItems.length}
            prefix={<ClockCircleOutlined className={styles.metricIcon} />}
            className={styles.metricStatistic}
          />
        </Card>
      </Col>
    </Row>
  );

  // 渲染趋势图表区域
  const renderTrendsSection = () => (
    <Row gutter={[16, 16]} className={styles.trendsRow}>
      <Col xs={24} md={12}>
        <Card 
          title={<><CalendarOutlined /> 写作日历</>} 
          className={styles.dashboardCard}
        >
          <div className={styles.calendarContainer}>
            <Calendar
              fullscreen={false}
              onSelect={date => {
                // 可以在这里添加日期选择的逻辑
              }}
            />
          </div>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card 
          title={<><LineChartOutlined /> 访问趋势</>} 
          className={styles.dashboardCard}
        >
          <div className={styles.chartContainer}>
            <Line
              data={visitStats}
              xField="date"
              yField="value"
              point={{
                size: 5,
                shape: 'diamond',
              }}
              smooth={true}
              color="#1890ff"
            />
          </div>
        </Card>
      </Col>
    </Row>
  );

  // 渲染底部系统信息区域
  const renderSystemInfoSection = () => (
    <Row gutter={[16, 16]} className={styles.systemRow}>
      <Col xs={24} md={8}>
        <Card 
          title={<><SettingOutlined /> 系统信息</>} 
          className={styles.dashboardCard}
        >
          <List
            size="small"
            dataSource={[
              { label: 'Hexo 版本', value: systemInfo.hexoVersion || 'N/A' },
              { label: '主题', value: systemInfo.theme || 'N/A' },
              { label: '最近部署', value: systemInfo.lastDeployTime || '暂无记录' }
            ]}
            renderItem={item => (
              <List.Item>
                <Text strong>{item.label}:</Text>
                <Text>{item.value}</Text>
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card 
          title={<><TagsOutlined /> 插件状态</>} 
          className={styles.dashboardCard}
        >
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
          />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card 
          title={<><BarChartOutlined /> 构建记录</>} 
          className={styles.dashboardCard}
        >
          <Timeline>
            <Timeline.Item>构建成功 (2023-07-15 14:30)</Timeline.Item>
            <Timeline.Item>部署完成 (2023-07-15 14:32)</Timeline.Item>
            <Timeline.Item>构建成功 (2023-07-10 09:45)</Timeline.Item>
            <Timeline.Item>部署完成 (2023-07-10 09:48)</Timeline.Item>
          </Timeline>
        </Card>
      </Col>
    </Row>
  );

  // 渲染待办事项区域
  const renderTodoSection = () => (
    <Card 
      title={<><ClockCircleOutlined /> 待办事项</>} 
      className={styles.dashboardCard}
      extra={
        <Search
          placeholder="添加新待办..."
          enterButton={<PlusOutlined />}
          size="small"
          onSearch={value => {
            if (value) addTodoItem(value);
          }}
        />
      }
    >
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
        locale={{ emptyText: '暂无待办事项' }}
      />
    </Card>
  );

  return (
    <div className={styles.dashboardContainer}>
      {/* 顶部：欢迎语 + 快捷操作栏 */}
      {renderWelcomeSection()}
      
      {/* 中部：核心指标卡片 */}
      {renderCoreMetricsSection()}
      
      {/* 待办事项区域 */}
      {renderTodoSection()}
      
      {/* 下方：趋势图表 */}
      {renderTrendsSection()}
      
      {/* 最底部：系统信息、插件状态、构建记录 */}
      {renderSystemInfoSection()}
    </div>
  );
};

export default Dashboard;
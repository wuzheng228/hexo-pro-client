import React, { useContext, useEffect, useState } from 'react'
import {
  Row, Col, Card, Statistic, List, Button, Input,
  Typography, Timeline, Spin, Modal, Form, // 移除 Calendar
  message, Tooltip, Badge, Checkbox, Avatar, Empty
} from 'antd'
import {
  FileAddOutlined, EditOutlined,
  EyeOutlined, SettingOutlined,
  TagsOutlined, ClockCircleOutlined, HomeOutlined,
  RocketOutlined, BarChartOutlined,
  InfoCircleOutlined, // 保留 CalendarOutlined 图标
  PieChartOutlined, // 添加 PieChartOutlined 图标
  DeleteOutlined,
  EllipsisOutlined,
  CodeOutlined,
  BgColorsOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { GlobalContext } from '@/context'
import useLocale from '@/hooks/useLocale'
import useDeviceDetect from '@/hooks/useDeviceDetect'
import service from '@/utils/api'
import { base64Encode } from '@/utils/encodeUtils'
import styles from './style/index.module.less'
// import { Line } from '@ant-design/charts'; // 移除 Line
import { Column, Pie, WordCloud } from '@ant-design/charts' // 引入 WordCloud
// import { text } from 'body-parser'; // 移除未使用的导入

const { Title, Text, Paragraph } = Typography
const { Search } = Input

// --- 新增：提取的图表组件 ---

interface ChartProps {
  loading: boolean;
  theme: string;
  darkMode: string;
  styles: Record<string, string>;
}

interface MonthlyPostsChartProps extends ChartProps {
  monthlyPostStats: { month: string; count: number }[];
}

const MonthlyPostsChart = React.memo(({ loading, monthlyPostStats, theme, darkMode, styles, t }: MonthlyPostsChartProps & { t: any }) => {
  const validCount = monthlyPostStats.filter(item => item.count > 0).length

  if (loading) {
    return (
      <div className={`${styles.loadingContainer} ${darkMode}`}>
        <Spin size="large" />
      </div>
    )
  }

  if (monthlyPostStats.length === 0 || validCount < 1) {
    return (
      <div className={`${styles.emptyContainer} ${darkMode}`}>
        <Empty description={t['dashboard.empty.noData']} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  const config = {
    data: monthlyPostStats,
    xField: 'month',
    yField: 'count',
    height: 250,
    meta: {
      month: { alias: '月份' },
      count: { alias: '发布量' },
    },
    animation: {
      appear: {
        animation: 'scale-in-y',
        duration: 800,
      },
    },
    tooltip: {
      title: (datum) => datum.month,
      formatter: (datum) => ({ name: '发布量', value: datum.count }),
    },
    label: {
      position: 'top' as const,
      style: {
        fill: theme === 'dark' ? '#ccc' : '#333',
        opacity: 0.8,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
        style: {
          fill: theme === 'dark' ? '#ccc' : '#333',
        }
      },
      line: {
        style: {
          stroke: theme === 'dark' ? '#303030' : '#d9d9d9',
        }
      },
      tickLine: {
        style: {
          stroke: theme === 'dark' ? '#303030' : '#d9d9d9',
        }
      },
    },
    yAxis: {
      label: {
        style: {
          fill: theme === 'dark' ? '#ccc' : '#333',
        }
      },
      line: {
        style: {
          stroke: theme === 'dark' ? '#303030' : '#d9d9d9',
        }
      },
      tickLine: {
        style: {
          stroke: theme === 'dark' ? '#303030' : '#d9d9d9',
        }
      },
    },
    color: ['#1890ff'],
    columnStyle: {
      radius: [4, 4, 0, 0],
      fill: 'l(90) 0:#1890ff 1:#36cfc9',
    },
    interactions: [{ type: 'element-active' }],
    state: {
      active: {
        style: {
          fill: '#ff7875',
          stroke: '#ff4d4f',
          lineWidth: 1,
        },
      },
    },
    theme: theme === 'dark' ? 'dark' : 'light',
  }

  return <Column {...config} />
});

interface CategoryPieChartProps extends ChartProps {
  categories: { name: string; count: number }[];
}

const CategoryPieChart = React.memo(({ loading, categories, theme, darkMode, styles, t }: CategoryPieChartProps & { t: any }) => {
  if (loading) {
    return (
      <div className={`${styles.loadingContainer} ${darkMode}`}>
        <Spin size="large" />
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className={`${styles.emptyContainer} ${darkMode}`}>
        <Empty description={t['dashboard.empty.noCategories']} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  return (
    <div className={`${styles.chartContainer} ${darkMode}`}>
      <Pie
        data={(categories || []).map(cat => ({
          type: cat.name,
          value: cat.count,
        }))}
        angleField="value"
        colorField="type"
        radius={0.8}
        innerRadius={0.6}
        height={280}
        label={{
          type: 'outer',
          content: '{name}: {value}',
          style: {
            fontSize: 14,
            fontWeight: 600,
            fill: theme === 'dark' ? '#ccc' : '#333',
          },
        }}
        statistic={{
          title: {
            style: {
              // fontSize: 18,
              fontWeight: 700,
              color: theme === 'dark' ? '#40a9ff' : '#1890ff'
            },
            content: '总计',
          },
          content: {
            style: {
              // fontSize: 28,
              fontWeight: 700,
              color: theme === 'dark' ? '#40a9ff' : '#1890ff'
            },
            formatter: (_, data) => {
              return data.reduce((total, item) => total + item.value, 0);
            },
          },
        }}
        color={['#36cfc9', '#1890ff', '#ffc53d', '#ff7875', '#73d13d', '#b37feb']}
        interactions={[
          { type: 'element-active' },
          { type: 'pie-statistic-active' }
        ]}
        tooltip={{
          showTitle: false,
          formatter: (datum) => ({ name: datum.type, value: datum.value }),
        }}
        state={{
          active: {
            style: {
              shadowBlur: 8,
              stroke: '#1890ff',
              lineWidth: 2,
            }
          }
        }}
        legend={{
          position: 'bottom',
          layout: 'horizontal',
          itemName: {
            style: {
              fontSize: 12,
              fill: theme === 'dark' ? '#ccc' : '#333',
            }
          }
        }}
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  )
});

interface TagWordCloudProps extends ChartProps {
  tags: { name: string; count: number; path: string }[];
}

const TagWordCloud = React.memo(({ loading, tags, theme, darkMode, styles, t }: TagWordCloudProps & { t: any }) => {
  if (loading) {
    return (
      <div className={`${styles.loadingContainer} ${darkMode}`}>
        <Spin size="large" />
      </div>
    )
  }

  if (tags.length === 0) {
    return (
      <div className={`${styles.emptyContainer} ${darkMode}`}>
        <Empty description={t['dashboard.empty.noTags']} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  return (
    <WordCloud
      data={tags.map(tag => ({
        name: tag.name,
        value: tag.count,
        path: tag.path
      }))}
      wordField="name"
      weightField="value"
      colorField="name"
      height={240}
      spiral="rectangular"
      wordStyle={{
        fontFamily: 'Verdana',
        fontSize: [16, 40],
        rotation: 0,
        fontWeight: 700,
      }}
      random={() => Math.random()}
      tooltip={{
        formatter: (datum) => {
          return { name: datum.text, value: datum.value }
        },
      }}
      state={{
        active: {
          style: {
            shadowColor: '#1890ff',
            shadowBlur: 10,
            fill: '#ff7875',
            cursor: 'pointer'
          }
        }
      }}
      interactions={[{ type: 'element-active' }]}
      onReady={(plot) => {
        plot.chart.on('element:click', (e) => {
          const { data } = e.data;
          if (data.datum?.path) {
            window.open(data.datum.path, '_blank');
          }
        });
      }}
      style={{
        background: theme === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(245, 250, 255, 0.7)',
        borderRadius: 8
      }}
      theme={theme === 'dark' ? 'dark' : 'light'}
    />
  )
});

// --- Dashboard 组件 ---

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { theme } = useContext(GlobalContext)
  const [todoLoading, setTodoLoading] = useState(false); // 添加待办事项加载状态
  const darkMode = theme === 'dark' ? styles.darkMode : ''
  const t = useLocale()
  const { isMobile } = useDeviceDetect()

  // 状态定义
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    totalPosts: number;
    draftPosts: number;
    publishedPosts: number;
    categories: { name: string; count: number }[];
    tags: { name: string; count: number; path: string }[];
    recentPosts: any[]; // 明确类型会更好
  }>({
    totalPosts: 0,
    draftPosts: 0,
    publishedPosts: 0,
    categories: [],
    tags: [],
    recentPosts: []
  })
  const [systemInfo, setSystemInfo] = useState({
    hexoVersion: '',
    theme: '',
    plugins: [],
    lastDeployTime: '',
    author: ''
  })
  const [todoItems, setTodoItems] = useState([])
  // 移除访问量相关状态
  // const [visitStats, setVisitStats] = useState<{ date: string; value: number }[]>([]) 
  // const [visitData, setVisitData] = useState({...})
  
  // 新增最近一月新增文章数状态
  const [monthlyNewPosts, setMonthlyNewPosts] = useState(0)
  const [monthlyPostStats, setMonthlyPostStats] = useState<{ month: string; count: number }[]>([]) // 明确类型
  const [todoInput, setTodoInput] = useState('')

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setLoading(true)
      // 获取文章统计
      const postsRes = await service.get('/hexopro/api/dashboard/posts/stats')
      // 获取分类统计
      const categoriesRes = await service.get('/hexopro/api/dashboard/categories/list')
      // 获取标签统计
      const tagsRes = await service.get('/hexopro/api/dashboard/tags/list')
      // 获取最近文章
      const recentPostsRes = await service.get('/hexopro/api/dashboard/posts/recent', {
        params: { limit: 5 }
      })
      // 新增：获取月度文章统计
      const monthlyStatsRes = await service.get('/hexopro/api/dashboard/posts/monthly-stats')
      // 新增：获取最近一月新增文章数
      const monthlyNewRes = await service.get('/hexopro/api/dashboard/posts/monthly-new')

      setStats({
        totalPosts: postsRes.data.total || 0,
        draftPosts: postsRes.data.drafts || 0,
        publishedPosts: postsRes.data.published || 0,
        categories: categoriesRes.data || [],
        tags: tagsRes.data || [],
        recentPosts: recentPostsRes.data || []
      })
      setMonthlyPostStats(monthlyStatsRes.data || []) // 设置月度统计数据
      // 设置最近一月新增文章数
      setMonthlyNewPosts(monthlyNewRes.data.count || 0)

      // 获取系统信息
      const systemRes = await service.get('/hexopro/api/dashboard/system/info')
      setSystemInfo(systemRes.data || {
        hexoVersion: 'N/A',
        theme: 'N/A',
        plugins: [],
        lastDeployTime: 'N/A',
        author: 'N/A' // 添加默认值
      })
      
      // 移除获取访问统计数据的代码

    } catch (error) {
      message.error(t['dashboard.error.fetchFailed'])
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

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

      const res = await service.post('/hexopro/api/posts/new', { title: finalTitle })
      if (res.data) {
        message.success(t['dashboard.success.createPost'])
        navigate(`/post/${base64Encode(res.data.permalink)}`)
      }
    } catch (error) {
      message.error(t['dashboard.error.createPostFailed'])
      console.error(error)
    }
  }

  // 添加待办事项
  const addTodoItem = async (content) => {
    try {
      await service.post('/hexopro/api/dashboard/todos/add', { content })
      message.success(t['dashboard.success.addTodo'])
      setTodoInput('') // 清空输入
      // fetchStats() // 刷新数据
      fetchTodoItems()
    } catch (error) {
      message.error(t['dashboard.error.addTodoFailed'])
      console.error(error)
    }
  }

  const fetchTodoItems = async () => {
    try {
      const todoRes = await service.get('/hexopro/api/dashboard/todos/list')
      setTodoItems(todoRes.data || [])
    } catch (error) {
      console.error('获取待办事项失败', error)
    }
  }

  // 获取欢迎消息
  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 6) return t['dashboard.welcome.night']
    if (hour < 9) return t['dashboard.welcome.morning']
    if (hour < 12) return t['dashboard.welcome.forenoon']
    if (hour < 14) return t['dashboard.welcome.noon']
    if (hour < 18) return t['dashboard.welcome.afternoon']
    if (hour < 22) return t['dashboard.welcome.evening']
    return t['dashboard.welcome.night']
  }

  useEffect(() => {
    fetchStats()
    fetchTodoItems()
  }, [])

  // 渲染顶部欢迎区域
  const renderWelcomeSection = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [postTitle, setPostTitle] = useState('');
    const [form] = Form.useForm();

    const handleCreatePost = async () => {
      try {
        const values = await form.validateFields();
        await createNewPost(values.title);
        setModalVisible(false);
        form.resetFields();
      } catch (error) {
        console.error('创建文章失败:', error);
      }
    };

    return (
    <Card className={`${styles.dashboardCard} ${styles.welcomeCard} ${darkMode}`}>
      <div className={styles.welcomeHeader}>
        <div className={styles.welcomeInfo}>
          <Title level={3}>
            {getWelcomeMessage()}
            {systemInfo.author ? `，${systemInfo.author}` : ''}
          </Title>
          <Paragraph>
            {t['dashboard.welcome.today'].replace('{date}', new Date().toLocaleDateString(t.lang === 'zh-CN' ? 'zh-CN' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }))}
          </Paragraph>
        </div>
        <div className={styles.quickActions}>
          <Button type="primary" icon={<FileAddOutlined />} onClick={() => setModalVisible(true)}>{t['dashboard.welcome.new.post']}</Button>
          <Modal
            title={t['dashboard.welcome.new.post']}
            visible={modalVisible}
            onOk={handleCreatePost}
            onCancel={() => {
              setModalVisible(false);
              form.resetFields();
            }}
            okText={t['universal.create']}
            cancelText={t['universal.cancel']}
          >
            <Form form={form} layout="vertical">
              <Form.Item
                name="title"
                label={t['universal.input.placeholder']}
                rules={[{ required: true, message: `${t['universal.input.placeholder']}` }]}
              >
                <Input placeholder={t['universal.input.placeholder']} />
              </Form.Item>
            </Form>
          </Modal>
          <Button icon={<EditOutlined />} onClick={() => navigate('/content/posts/drafts')}>{t['dashboard.welcome.new.draft']}</Button>
          <Button icon={<RocketOutlined />} onClick={() => navigate('/deploy')}>{t['dashboard.welcome.new.deploy']}</Button>
          <Button icon={<HomeOutlined />} onClick={() => window.open('/', '_blank')}>{t['dashboard.welcome.new.blog.front.end']}</Button>
        </div>
      </div>
    </Card>
  )}

  // 修改渲染核心指标卡片组
  const renderCoreMetricsGroup = () => (
    <Card className={`${styles.metricsGroupCard} ${darkMode}`} bordered={false}>
      <Row gutter={[24, 16]}>
        <Col xs={12} md={6}>
          <div className={`${styles.metricCardNew} ${darkMode}`}>
            <FileAddOutlined className={styles.metricIconBadge} />
            <Statistic
              title={t['dashboard.stats.totalPosts']}
              value={stats.totalPosts}
              className={styles.metricStatisticNew}
            />
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className={`${styles.metricCardNew} ${darkMode}`}>
            <BarChartOutlined className={styles.metricIconBadge} />
            <Statistic
              title={t['dashboard.stats.monthlyNew']}
              value={monthlyNewPosts}
              className={styles.metricStatisticNew}
            />
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className={`${styles.metricCardNew} ${darkMode}`}>
            <EditOutlined className={styles.metricIconBadge} />
            <Statistic
              title={t['dashboard.stats.drafts']}
              value={stats.draftPosts}
              className={styles.metricStatisticNew}
            />
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className={`${styles.metricCardNew} ${darkMode}`}>
            <ClockCircleOutlined className={styles.metricIconBadge} />
            <Statistic
              title={t['dashboard.stats.todos']}
              value={todoItems.length}
              className={styles.metricStatisticNew}
            />
          </div>
        </Col>
      </Row>
    </Card>
  )

  // 修改：渲染趋势图表区域
  const renderTrendsSection = () => (
    <div style={{width: '100%'}}>
      <Row gutter={[16, 16]} className={styles.trendsRow}>
        {/* 文章产出柱状图 */}
        <Col xl={8} xs={24} md={24}>
          <Card
            title={<><BarChartOutlined /> {t['dashboard.chart.postTrend']} <Text type="secondary" style={{fontSize:12,marginLeft:8}}>{t['dashboard.chart.postTrendNote']}</Text></>}
            className={`${styles.dashboardCard} ${darkMode}`}
            bodyStyle={{ padding: 10 }}
          >
            <div className={`${styles.chartContainer} ${darkMode}`}>
              {/* 使用新组件 */}
              <MonthlyPostsChart
                loading={loading}
                monthlyPostStats={monthlyPostStats}
                theme={theme}
                darkMode={darkMode}
                styles={styles}
                t={t}
              />
            </div>
          </Card>
        </Col>

        {/* 分类饼图 */}
        <Col xl={8} xs={24} md={24}>
          <Card
            title={<><PieChartOutlined /> {t['dashboard.chart.categoryDist']}</>}
            className={`${styles.dashboardCard} ${darkMode}`}
            bodyStyle={{ padding: 10 }}
          >
            {/* 使用新组件 */}
            <CategoryPieChart
              loading={loading}
              categories={stats.categories}
              theme={theme}
              darkMode={darkMode}
              styles={styles}
              t={t}
            />
          </Card>
        </Col>
        <Col xl={8} xs={24} md={24}>
          {renderTodoSection()}
        </Col>
      </Row>
    </div>
    
  )


  // 渲染标签词云图
  const renderTagsWordCloud = () => (
    <Card
      title={<><TagsOutlined /> {t['dashboard.chart.tagCloud']}</>}
      className={`${styles.dashboardCard} ${darkMode}`}
    >
      <div className={`${styles.tagsContainer} ${darkMode}`}>
        {/* 使用新组件 */}
        <TagWordCloud
          loading={loading}
          tags={stats.tags}
          theme={theme}
          darkMode={darkMode}
          styles={styles}
          t={t}
        />
      </div>
    </Card>
  )

  const MemoizedWordCloud = React.memo(()=>{
    if (loading) {
      return (
        <div className={`${styles.loadingContainer} ${darkMode}`}>
          <Spin size="large" />
        </div>
      )
    }
    
    if (stats.tags.length === 0) {
      return (
        <div className={`${styles.emptyContainer} ${darkMode}`}>
          <Empty description="暂无标签数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )
    }

    return (
      <WordCloud
            data={stats.tags.map(tag => ({
              name: tag.name,
              value: tag.count,
              path: tag.path
            }))}
            wordField="name"
            weightField="value"
            colorField="name"
            height={240}
            spiral="rectangular"
            wordStyle={{
              fontFamily: 'Verdana',
              fontSize: [16, 40],
              rotation: 0,
              fontWeight: 700,
            }}
            random={() => Math.random()}
            tooltip={{
              formatter: (datum) => {
                return { name: datum.text, value: datum.value }
              },
            }}
            state={{
              active: {
                style: {
                  shadowColor: '#1890ff',
                  shadowBlur: 10,
                  fill: '#ff7875',
                  cursor: 'pointer'
                }
              }
            }}
            interactions={[{ type: 'element-active' }]}
            onReady={(plot) => {
              plot.on('element:click', (e) => {
                const { data } = e.data;
                if (data?.path) {
                  window.open(data.path, '_blank');
                }
              });
            }}
            style={{ 
              background: theme === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(245, 250, 255, 0.7)', 
              borderRadius: 8 
            }}
            theme={theme === 'dark' ? 'dark' : 'light'}
          />
    )
  })
  

  // 渲染底部系统信息区域
  const renderSystemInfoSection = () => {
    // 获取启用的插件数量
    const enabledPluginsCount = systemInfo.plugins ? 
      systemInfo.plugins.filter(plugin => plugin.enabled).length : 0;
    
    // 构建记录数据（示例数据，实际应从API获取）
    const buildRecords = [
      { id: 1, title: '构建成功', time: '2023-07-15 14:30', status: 'success' },
      { id: 2, title: '部署完成', time: '2023-07-15 14:32', status: 'success' },
      { id: 3, title: '构建成功', time: '2023-07-10 09:45', status: 'success' },
      { id: 4, title: '部署完成', time: '2023-07-10 09:48', status: 'success' },
    ];
    
    return (
      <Row gutter={[16, 16]} className={styles.systemRow}>
        {/* 系统信息卡片 */}
        <Col xs={24} md={8}>
          <Card
            title={<><SettingOutlined /> {t['dashboard.system.title']}</>}
            className={`${styles.dashboardCard} ${styles.systemInfoCard}`}
          >
            <List
              size="small"
              dataSource={[
                { 
                  label: t['dashboard.system.hexoVersion'],
                  value: systemInfo.hexoVersion || 'N/A',
                  icon: <CodeOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                },
                { 
                  label: t['dashboard.system.theme'],
                  value: systemInfo.theme || 'N/A',
                  icon: <BgColorsOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                },
                { 
                  label: t['dashboard.system.lastDeploy'],
                  value: systemInfo.lastDeployTime || '暂无记录',
                  icon: <ClockCircleOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                }
              ]}
              renderItem={item => (
                <List.Item>
                  <span>{item.icon} {item.label}</span>
                  <Text strong>{item.value}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        {/* 插件状态卡片 */}
        <Col xs={24} md={8}>
          <Card
            title={<><TagsOutlined /> {t['dashboard.system.plugins']}</>}
            className={`${styles.dashboardCard} ${styles.pluginsCard}`}
            bodyStyle={{ padding: '0 16px' }}
          >
            <div className={styles.pluginsHeader}>
              <span className={styles.pluginsCount}>
                {t['dashboard.system.pluginsCount']
                  .replace('{enabled}', enabledPluginsCount)
                  .replace('{total}', systemInfo.plugins ? systemInfo.plugins.length : 0)}
              </span>
              <Tooltip title={t['dashboard.system.pluginsViewAll']}>
                <Button type="link" size="small" icon={<EllipsisOutlined />} onClick={() => navigate('/settings/plugins')} />
              </Tooltip>
            </div>
            
            <div className={styles.pluginsList}>
              {loading ? (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <Spin size="small" />
                </div>
              ) : systemInfo.plugins && systemInfo.plugins.length > 0 ? (
                <List
                  size="small"
                  dataSource={systemInfo.plugins}
                  renderItem={plugin => (
                    <List.Item>
                      <Badge status={plugin.enabled ? "success" : "default"} />
                      <span className={styles.pluginName}>{plugin.name}</span>
                      <span className={styles.pluginVersion}>v{plugin.version}</span>
                      <span className={`${styles.pluginStatus} ${!plugin.enabled ? styles.disabled : ''}`}>
                        {plugin.enabled ? '已启用' : '未启用'}
                      </span>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description="暂无插件信息" 
                  style={{ margin: '20px 0' }} 
                />
              )}
            </div>
          </Card>
        </Col>
        
        {/* 构建记录卡片 */}
        <Col xs={24} md={8}>
          <Card
            title={<><BarChartOutlined /> {t['dashboard.system.buildHistory']}</>}
            className={`${styles.dashboardCard} ${styles.buildCard}`}
            bodyStyle={{ padding: '0 16px' }}
          >
            <div className={styles.buildHeader}>
              <span className={styles.buildCount}>
                {t['dashboard.system.buildCount'].replace('{count}', buildRecords.length)}
              </span>
              <Tooltip title={t['dashboard.system.buildViewAll']}>
                <Button type="link" size="small" icon={<EllipsisOutlined />} onClick={() => navigate('/deploy/history')} />
              </Tooltip>
            </div>
            
            <div className={styles.buildTimeline}>
              <Timeline>
                {buildRecords.map(record => (
                  <Timeline.Item 
                    key={record.id}
                    color={record.status === 'success' ? 'green' : 'red'}
                  >
                    <div className={styles.buildItemTitle}>
                      {record.title}
                      <span className={`${styles.buildItemStatus} ${record.status !== 'success' ? styles.failed : ''}`}>
                        {record.status === 'success' ? '成功' : '失败'}
                      </span>
                    </div>
                    <div className={styles.buildItemTime}>{record.time}</div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </Card>
        </Col>
      </Row>
    )
  }

  // 添加最近文章组件
const renderRecentArticlesSection = () => {
  const [recentArticles, setRecentArticles] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  // 获取最近文章列表
  const fetchRecentArticles = async () => {
    try {
      setRecentLoading(true);
      const response = await service.get('/hexopro/api/dashboard/posts/recent', {
        params: { limit: 10, sortBy: 'updated' }
      });
      setRecentArticles(response.data || []);
    } catch (error) {
      console.error('获取最近文章失败:', error);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentArticles();
  }, []);

  // 跳转到文章编辑页面
  const handleEditArticle = (permalink) => {
    navigate(`/post/${base64Encode(permalink)}`);
  };

  return (
    <Card
      title={<><EditOutlined /> {t['dashboard.articles.recent']}</>}
      className={`${styles.dashboardCard} ${styles.recentArticlesCard} ${darkMode}`}
      bodyStyle={{ padding: '0 16px', height: 'calc(100% - 57px)' }}
    >
      {recentLoading ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <Spin />
        </div>
      ) : (
        <List
          className={styles.recentArticlesList}
          dataSource={recentArticles}
          renderItem={(article) => (
            <List.Item 
              className={styles.recentArticleItem}
              onClick={() => handleEditArticle(article.permalink)}
            >
              <div className={styles.articleInfo}>
                <div className={styles.articleTitle}>
                  {article.isDraft && <Badge status="warning" text={t['dashboard.articles.draftBadge']} style={{ marginRight: 8 }} />}
                  <Text ellipsis style={{ maxWidth: '100%' }}>{article.title}</Text>
                </div>
                <div className={styles.articleMeta}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  <Text type="secondary">{article.updated || article.date}</Text>
                </div>
              </div>
              <Button 
                type="link" 
                icon={<EditOutlined />} 
                size="small"
                className={styles.editButton}
              >
                {t['dashboard.todo.editTooltip']}
              </Button>
            </List.Item>
          )}
          locale={{ emptyText: <Empty description={t['dashboard.articles.empty']} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      )}
    </Card>
  );
};

  // 渲染待办事项区域
  const renderTodoSection = () => {
    const [inputValue, setInputValue] = useState('');
    const handleAdd = async () => {
      if (inputValue.trim()) {
        await addTodoItem(inputValue.trim());
        setInputValue('');
      }
    };

    // 删除待办事项
  const handleDeleteTodo = async (id) => {
    try {
      setTodoLoading(true);
      await service.delete(`/hexopro/api/dashboard/todos/delete/${id}`);
      message.success('删除成功');
      // 更新本地状态
      setTodoItems(prevItems => prevItems.filter(item => item.id !== id));
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    } finally {
      setTodoLoading(false);
    }
  };

    // 处理切换待办事项状态
    const handleToggleTodo = async (id: string) => {
        console.log('Toggling todo with ID:', id); // 添加日志
        try {
            setTodoLoading(true);
            await service.put(`/hexopro/api/dashboard/todos/toggle/${id}`);
            // fetchTodos(); // 重新获取列表 - 注意：原始代码没有 fetchTodos，这里先注释掉，如果需要，需要定义 fetchTodos
            // 暂时保留本地更新逻辑，如果需要强制刷新，取消注释 fetchTodos() 并确保其已定义
            setTodoItems(prevItems =>
              prevItems.map(item =>
                item.id === id ? { ...item, completed: !item.completed } : item
              )
            );
        } catch (error) {
            console.error('Failed to toggle todo:', error);
            message.error('切换待办事项状态失败');
        } finally {
            setTodoLoading(false);
        }
    };

    return (
      <Card
            title={<><EditOutlined style={{ marginRight: 8 }} />{t['dashboard.todo.title']}</>}
            bordered={false}
            className={`${styles.todoCard} ${styles.dashboardCard}  ${darkMode}`}
            extra={
              <Search
                placeholder={t['dashboard.todo.addPlaceholder']}
                enterButton={t['dashboard.todo.addButton']}
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onSearch={addTodoItem}
                loading={todoLoading} // 添加加载状态到Search按钮
                style={{ width: isMobile ? '100%' : 300 }}
              />
            }
          >
            <Spin spinning={todoLoading}> {/* 用Spin包裹List */}
              {todoItems.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={todoItems}
                  renderItem={(item: any) => ( // 添加类型注解
                    <List.Item
                      actions={[
                        <Tooltip title={t['dashboard.todo.deleteTooltip']}>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteTodo(item.id)}
                          />
                        </Tooltip>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Checkbox
                            checked={item.completed}
                            onChange={() => handleToggleTodo(item.id)}
                          />
                        }
                        title={
                          <Text delete={item.completed} style={{ color: item.completed ? '#8c8c8c' : 'inherit' }}>
                            {item.content}
                          </Text>
                        }
                        description={t['dashboard.todo.createdAt'].replace('{date}', item.createdAt)}
                      />
                    </List.Item>
                  )}
                  className={styles.todoList} // 添加样式类
                />
              ) : (
                <Empty description={t['dashboard.todo.empty']} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Spin>
          </Card>
    );
  };

  return (
      <div className={styles.dashboardContainer}>
        {/* 欢迎区域 */}
        {renderWelcomeSection()}
        {/* 核心指标区域 */}
        <div >
          {renderCoreMetricsGroup()}
        </div>
        
       
        <Row gutter={[16,16]}>
          <Col span={24}  >
            {renderTrendsSection()}
          </Col>
          <Col span={24}>
            <Row gutter={[16, 16]}>
                {/* 标签词云区域 */}
                <Col xl={12} sm={24}>
                  {renderTagsWordCloud()}
                </Col>
                <Col xl={12} sm={24}>
                  {renderRecentArticlesSection()}
                </Col>
            </Row>
          </Col>
          <Col span={24}>
            {/* 系统信息区域 */}
            {renderSystemInfoSection()}
          </Col>
        </Row>
       
         
      </div>
    )
}

export default Dashboard

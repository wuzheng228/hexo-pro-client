import React, { useContext, useEffect, useState } from 'react'
import {
  Row, Col, Card, Statistic, Tag, List, Button, Input,
  Space, Divider, Typography, Calendar, Timeline, Spin, // 移除 Calendar
  message, Tooltip, Badge, Checkbox, Avatar, Empty
} from 'antd'
import {
  FileAddOutlined, EditOutlined, SearchOutlined,
  EyeOutlined, CloudUploadOutlined, SettingOutlined,
  TagsOutlined, FolderOutlined, ClockCircleOutlined,
  QuestionCircleOutlined, LinkOutlined, HomeOutlined,
  RocketOutlined, PlusOutlined, BarChartOutlined,
  CalendarOutlined, LineChartOutlined, InfoCircleOutlined, // 保留 CalendarOutlined 图标
  FireOutlined, PieChartOutlined // 添加 PieChartOutlined 图标
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

const { Title, Text, Paragraph } = Typography
const { Search } = Input

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { theme } = useContext(GlobalContext)
  const t = useLocale()
  const { isMobile } = useDeviceDetect()

  // 状态定义
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
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
  const [visitStats, setVisitStats] = useState([])
  const [visitData, setVisitData] = useState({
    success: false,
    busuanziEnabled: false,
    currentStats: {
      siteUv: 0,
      sitePv: 0
    },
    visitHistory: [],
    error: null,
    message: ''
  })
  const [monthlyPostStats, setMonthlyPostStats] = useState([]) // 新增：月度文章统计状态

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

      setStats({
        totalPosts: postsRes.data.total || 0,
        draftPosts: postsRes.data.drafts || 0,
        publishedPosts: postsRes.data.published || 0,
        categories: categoriesRes.data || [],
        tags: tagsRes.data || [],
        recentPosts: recentPostsRes.data || []
      })
      setMonthlyPostStats(monthlyStatsRes.data || []) // 设置月度统计数据

      // 获取系统信息
      const systemRes = await service.get('/hexopro/api/dashboard/system/info')
      setSystemInfo(systemRes.data || {
        hexoVersion: 'N/A',
        theme: 'N/A',
        plugins: [],
        lastDeployTime: 'N/A'
      })

      // 获取待办事项
      const todoRes = await service.get('/hexopro/api/dashboard/todos/list')
      setTodoItems(todoRes.data || [])

      // 获取访问统计数据
      try {
        const visitRes = await service.get('/hexopro/api/dashboard/visit/stats')
        setVisitData(visitRes.data)

        // 如果有历史访问数据，则使用它
        if (visitRes.data.visitHistory && visitRes.data.visitHistory.length > 0) {
          setVisitStats(visitRes.data.visitHistory)
        } else {
          // 如果没有历史数据但有当前统计，则创建一个简单的趋势图数据
          if (visitRes.data.success && visitRes.data.currentStats) {
            const currentMonth = new Date().toISOString().slice(0, 7)
            setVisitStats([
              { date: currentMonth, value: visitRes.data.currentStats.sitePv || 0 }
            ])
          } else {
            // 如果没有任何数据，使用模拟数据 (保持不变)
            setVisitStats([
              { date: '2023-01', value: 320 },
              { date: '2023-02', value: 450 },
              { date: '2023-03', value: 520 },
              { date: '2023-04', value: 390 },
              { date: '2023-05', value: 680 },
              { date: '2023-06', value: 720 },
              { date: '2023-07', value: 650 },
            ])
          }
        }
      } catch (error) {
        console.error('获取访问统计失败:', error)
        // 使用模拟数据作为后备 (保持不变)
        setVisitStats([
          { date: '2023-01', value: 320 },
          { date: '2023-02', value: 450 },
          { date: '2023-03', value: 520 },
          { date: '2023-04', value: 390 },
          { date: '2023-05', value: 680 },
          { date: '2023-06', value: 720 },
          { date: '2023-07', value: 650 },
        ])
      }

    } catch (error) {
      message.error('获取数据失败，请稍后重试')
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
        message.success('文章创建成功')
        navigate(`/post/${base64Encode(res.data.permalink)}`)
      }
    } catch (error) {
      message.error('创建文章失败')
      console.error(error)
    }
  }

  // 添加待办事项
  const addTodoItem = async (content) => {
    try {
      await service.post('/hexopro/api/dashboard/todos/add', { content })
      message.success('添加成功')
      fetchStats() // 刷新数据
    } catch (error) {
      message.error('添加失败')
      console.error(error)
    }
  }

  // 获取欢迎消息
  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了，注意休息'
    if (hour < 9) return '早上好，开始新的一天'
    if (hour < 12) return '上午好，工作顺利'
    if (hour < 14) return '中午好，注意休息'
    if (hour < 18) return '下午好，继续加油'
    if (hour < 22) return '晚上好，放松一下'
    return '夜深了，注意休息'
  }

  useEffect(() => {
    fetchStats()
  }, [])

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
            const title = prompt('请输入文章标题')
            if (title) createNewPost(title)
          }}>新建文章</Button>
          <Button icon={<EditOutlined />} onClick={() => navigate('/content/posts/drafts')}>草稿箱</Button>
          <Button icon={<RocketOutlined />} onClick={() => navigate('/deploy')}>部署</Button>
          <Button icon={<HomeOutlined />} onClick={() => window.open('/', '_blank')}>博客前台</Button>
        </div>
      </div>
    </Card>
  )

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
            // 优先使用实时数据，其次使用历史数据，最后使用模拟数据
            value={visitData.success ? visitData.currentStats.sitePv : (visitStats.length > 0 ? visitStats.reduce((sum, item) => sum + item.value, 0) : 0)}
            prefix={<EyeOutlined className={styles.metricIcon} />}
            className={styles.metricStatistic}
          />
          {visitData.busuanziEnabled === false && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} />
              未启用busuanzi统计
            </Text>
          )}
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
  )

  // 新增：渲染月度文章发布柱状图
  const renderMonthlyPostsChart = () => {
    const config = {
      data: monthlyPostStats,
      xField: 'month',
      yField: 'count',
      height: 250, // 调整图表高度
      meta: {
        month: { alias: '月份' },
        count: { alias: '发布量' },
      },
      tooltip: {
        title: (datum) => datum.month,
        formatter: (datum) => ({ name: '发布量', value: datum.count }),
      },
      label: {
        position: 'top', // 将标签显示在柱子顶部
        style: {
          fill: theme === 'dark' ? '#ccc' : '#333', // Adjust label color based on theme
          opacity: 0.8,
        },
      },
      xAxis: {
        label: {
          autoHide: true,
          autoRotate: false,
        },
      },
    }
    return (
      <Spin spinning={loading}>
        {monthlyPostStats.length > 0 ? (
          <Column {...config} />
        ) : (
          <Empty description="暂无文章发布数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
    )
  }

  // 修改后的：渲染分类分布饼图
  const renderCategoryDistributionChart = () => {
    const data = (stats.categories || []).map(cat => ({
      type: cat.name,
      value: cat.count,
    }));

    // 分类数小于2时不显示饼图
    if (data.length < 2) {
      return (
        <Empty description="分类数据不足，无法展示饼图" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )
    }

    const config = {
      data,
      angleField: 'value',
      colorField: 'type',
      innerRadius: 0.6,
      height: 260,
      label: {
        text: (d) => `${d.type}: ${d.value}`,
        position: 'outside',
        style: {
          fontWeight: 'bold',
        },
      },
      legend: {
        color: {
          title: false,
          position: 'right',
          rowPadding: 5,
        },
      },
      annotations: [
        {
          type: 'text',
          style: {
            text: '分类\n分布',
            x: '50%',
            y: '50%',
            textAlign: 'center',
            fontSize: 32,
            fontStyle: 'bold',
          },
        },
      ],
    };

    return (
      <Spin spinning={loading}>
        <Pie {...config} />
      </Spin>
    )
  }

  // 修改：渲染趋势图表区域
  const renderTrendsSection = () => (
    <Row gutter={[16, 16]} className={styles.trendsRow}>
      {/* 文章产出柱状图 */}
      <Col xs={24} md={12}>
        <Card
          title={<><BarChartOutlined /> 最近6个月文章产出</>}
          className={styles.dashboardCard}
        >
          <div className={styles.chartContainer}>
            {renderMonthlyPostsChart()}
          </div>
        </Card>
      </Col>
      {/* 分类饼图与热门标签 */}
      <Col xs={24} md={12}>
        <Card
          title={<><FireOutlined /> 热门内容分布</>}
          className={styles.dashboardCard}
        >
          <div className={styles.popularContainer}>
            {/* 分类饼图 */}
            <div className={styles.sectionTitle}><PieChartOutlined /> 分类分布</div>
            <div className={styles.chartContainer} style={{ height: 200, marginBottom: 16 }}>
              {renderCategoryDistributionChart()}
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* 热门标签词云 */}
            <div className={styles.sectionTitle}><TagsOutlined /> 热门标签</div>
            <div className={styles.tagsContainer} style={{ height: 200 }}>
              {stats.tags.length > 0 ? (
                <WordCloud
                  data={stats.tags.map(tag => ({
                    text: tag.name,
                    value: tag.count,
                    path: tag.path,
                  }))}
                  wordField="text"
                  weightField="value"
                  colorField="text"
                  height={180}
                  spiral="rectangular"
                  wordStyle={{
                    fontFamily: 'inherit',
                    fontWeight: 600,
                  }}
                  tooltip={{
                    customContent: (title, items) => {
                      const item = items?.[0]?.data
                      return item
                        ? `<div style="padding: 8px;">
                            <div><b>标签：</b>${item.name}</div>
                            <div><b>路径：</b>${item.path}</div>
                          </div>`
                        : ''
                    }
                  }}
                  state={{
                    active: {
                      style: {
                        lineWidth: 1,
                        stroke: '#333',
                      }
                    }
                  }}
                  interactions={[{ type: 'element-active' }]}
                  onReady={(plot) => {
                    plot.on('element:click', (e) => {
                      const { data } = e.data
                      if (data?.path) {
                        window.open(data.path, '_blank') // 新标签页打开
                        // 或 navigate(data.path) // 如果你想在当前页面跳转
                      }
                    })
                  }}
                />
              ) : (
                <Empty
                  description="暂无标签数据"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  )

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
  )

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
            if (value) addTodoItem(value)
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
  )

  return (
    <Spin spinning={loading && !monthlyPostStats.length} tip="加载仪表盘数据中...">
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
    </Spin>
  )
}

export default Dashboard

import { Button, Menu, MenuProps, message } from 'antd'
import Sider from 'antd/es/layout/Sider'
import Layout, { Content } from 'antd/es/layout/layout'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import styles from './style/layout.module.less'
import useRoute, { IRoute } from './routes'
import { AppstoreOutlined, CloudUploadOutlined, CodeOutlined, EditOutlined, FileTextOutlined, HomeOutlined, MenuFoldOutlined, MenuUnfoldOutlined, PictureOutlined, SettingOutlined } from '@ant-design/icons'
import useLocale from './hooks/useLocale'
import lazyload from './utils/lazyload'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import qs from 'query-string'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import useDeviceDetect from './hooks/useDeviceDetect'
import SettingIcon from './assets/setting.svg'
import SettingIconLight from './assets/settingLight.svg'
import { GlobalContext } from './context'
type MenuItem = Required<MenuProps>['items'][number];

function getIconFromKey(key: string) {
    const {theme} = useContext(GlobalContext)
    switch (key) {
        case 'posts':
            return <EditOutlined />
        case 'dashboard':
            return <HomeOutlined />
        case 'content_management':
            return <AppstoreOutlined />
        case 'system':
            return <SettingOutlined />
        case 'deploy':
            return <CloudUploadOutlined />
        case 'content/pages':
            return <FileTextOutlined />
        case 'content/images':
            return <PictureOutlined />
        case 'content/yaml':
                return <CodeOutlined />
        case 'settings': 
            return theme == 'dark' ? <SettingIconLight /> : <SettingIcon />
        default:
            return <div className={styles['icon-empty']}></div>
    }
}

function getFlatternRoute(routes): any[] {
    const res = []
    function travel(_routes) {
        _routes.forEach((route) => {
            if (route.key && !route.children) {
                try {
                    route.component = lazyload(() => import(`./pages/${route.key}`))
                    res.push(route)
                } catch (e) {
                    message.error(`页面${route.key}加载失败`)
                }
            }
            if (route.children && route.children.length) {
                travel(route.children)
            }
        })
    }
    travel(routes)
    return res
}

export default function PageLayout() {
    // 
    const navigate = useNavigate()
    const location = useLocation()
    const { isMobile } = useDeviceDetect()

    const locale = useLocale()

    const currentComponent = qs.parseUrl(location.pathname).url.slice(1)
    const [routes, defaultRoute] = useRoute()
    const defaultSelectedKeys = [currentComponent || defaultRoute]
    const [collapsed, setCollapsed] = useState(false)

    const [selectedKeys, setSelectedKeys] = useState<string[]>(defaultSelectedKeys)

    const flatternRoutes = useMemo(() => getFlatternRoute(routes) || [], [routes])

    const menuMap = useRef<
        Map<string, { menuItem?: boolean; subMenu?: boolean }>
    >(new Map())

    function reanderRoutes() {
        return function travel(_routes: IRoute[], level = 1): MenuItem[] {
            return _routes.map((route) => {
                if (!route.children) {
                    menuMap.current.set(route.key, { menuItem: true })
                    return {
                        key: route.key,
                        label: locale[route.name],
                        icon: getIconFromKey(route.key),
                        children: undefined
                    }
                } else {
                    menuMap.current.set(route.key, { subMenu: true })
                    return {
                        key: route.key,
                        label: locale[route.name],
                        icon: getIconFromKey(route.key),
                        children: travel(route.children, level + 1)
                    }
                }
            })
        }
    }

    function onClickItem(item) {
        const { key } = item
        const currentRoute = flatternRoutes.find((r) => r.key === key)
        const component = currentRoute.component
        const preload = component.preload()
        preload.then(() => {
            navigate(currentRoute.path ? currentRoute.path : `/${key}`)
        })
    }

    const updateMenuStatus = useCallback(() => {
        const pathKeys = location.pathname.split('/')
        const newSelectedKeys: string[] = []
        // console.log("pathKeys ===>", pathKeys)
        while (pathKeys.length > 0) {
            const currentRouteKey = pathKeys.join('/')
            // console.log('currentRouteKey', currentRouteKey)
            const menuKey = currentRouteKey.replace(/^\//, '') // 替换掉开头的下划线 /path ==> path
            // console.log('menuKey===>', menuKey)
            const menuType = menuMap.current.get(menuKey)
            if (menuType && menuType.menuItem) {
                newSelectedKeys.push(menuKey)
            }

            pathKeys.pop()
        }
        setSelectedKeys(newSelectedKeys)
    }, [location.pathname])

    function toggleCollapsed() {
        setCollapsed(!collapsed)
    }

    useEffect(() => {
        updateMenuStatus()
    }, [location.pathname, updateMenuStatus])

    // Add useEffect to automatically collapse sidebar on mobile
    useEffect(() => {
        if (isMobile) {
            setCollapsed(true)
        }
    }, [isMobile])

    // 添加自动折叠侧边栏的逻辑
    useEffect(() => {
        if (isMobile) {
            setCollapsed(true)
        } else {
            setCollapsed(false)
        }
    }, [isMobile])

    return (
        <Layout className={styles.layout}>
            <Navbar />
            <Layout>
                <Sider
                    className={styles['layout-sider']}
                    collapsed={collapsed}
                    collapsedWidth={isMobile ? 0 : 80}
                    width={220}
                    theme="light"
                >
                    <Button type="default" onClick={toggleCollapsed} className={styles['collapse-btn']} size='small' >
                        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    </Button>
                    <Menu
                        style={{ height: '100%' }}
                        selectedKeys={selectedKeys}
                        onClick={onClickItem}
                        mode={"inline"}
                        items={reanderRoutes()(routes, 1)}
                    >
                    </Menu>
                </Sider>
                <Layout
                    className={styles['layout-content']}
                    style={{
                        paddingLeft: isMobile ? 0 : (collapsed ? 30 : 15),
                        paddingRight: isMobile ? 0 : (collapsed ? 30 : 15),
                        paddingTop: isMobile ? 0 : 15,
                        paddingBottom: isMobile ? 0 : 15
                    }}
                >
                    <div className={styles['layout-content-wrapper']}>
                        <Content>
                            <Routes>
                                {/* 路由部分保持不变 */}
                                {
                                    flatternRoutes.map((route, index) => {
                                        const rout = (<Route
                                            key={index}
                                            path={`/${route.key}`}
                                            element={route.component.render()}
                                        />)
                                        return rout
                                    })
                                }
                                <Route path="/"
                                    element={lazyload(() => import(`./pages/${defaultRoute}`)).render()}
                                />
                                <Route
                                    path="/post/:_id"
                                    element={lazyload(() => import('./pages/content/posts/post')).render()}
                                />
                                <Route
                                    path="/page/:_id"
                                    element={lazyload(() => import('./pages/content/pages/page')).render()}
                                />
                                <Route path="*"
                                    element={lazyload(() => import(`./pages/${defaultRoute}`)).render()}
                                />
                            </Routes>
                        </Content>
                    </div>
                    <Footer />
                </Layout>
            </Layout>
        </Layout>
    )
}
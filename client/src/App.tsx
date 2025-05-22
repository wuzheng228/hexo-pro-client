import React, { useEffect, useState } from "react"
import { createStore } from 'redux'
import { Provider } from "react-redux"
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import rootReducer from './store'
import Login from "./pages/login"
import PageLayout from "./layout"
import { ConfigProvider, theme as antTheme, message } from "antd"

import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import { GlobalContext } from "./context"
import service from "./utils/api"
import checkLogin from "./utils/checkLogin"
import useStorage from "./utils/useStorage"


const store = createStore(rootReducer)

function App() {

    const [lang, setLang] = useStorage('hexo-pro-lang', 'zh-CN')
    const [theme, setTheme] = useStorage('hexo-pro-theme', 'light')
    const [configProviderTheme, setConfigProviderTheme] = useState({})

    function getLocale() {
        switch (lang) {
            case 'zh-CN':
                return zhCN
            case 'en-US':
                return enUS
            default:
                return zhCN
        }
    }

    const contextValue = {
        lang: lang,
        setLang: setLang,
        theme,
        setTheme,
    }

    function fetchUserInfo() {
        store.dispatch({
            type: 'update-userInfo',
            payload: { userLoading: true },
        })
        service.get('/hexopro/api/userInfo').then((res) => {
            store.dispatch({
                type: 'update-userInfo',
                payload: { userInfo: res.data, userLoading: false },
            })
        }).catch(err => {
            message.error(err.message)
        }
        )
    }

    useEffect(() => {
        console.log('App mount', window.location.pathname.replace(/\//g, ''))
        // debugger;
        if (checkLogin()) {
            fetchUserInfo()
        } else {
            // 检查是否已跳过设置
            const skipSettings = localStorage.getItem('hexoProSkipSettings') === 'true'
            
            if (skipSettings) {
                // 用户已选择跳过设置，不再检查首次使用状态
                // console.log('用户已选择跳过设置，允许访问')
                return
            }
            
            // 检查是否是首次使用
            service.get('/hexopro/api/settings/check-first-use')
                .then(res => {
                    if (res.data.code === 0 && res.data.data.isFirstUse) {
                        // console.log('首次使用，允许访问')
                        // 首次使用，允许访问设置页面或首页
                        if (window.location.pathname === '/pro/settings' || window.location.pathname === '/pro/login') {
                            // 不做重定向
                            // console.log('首次使用，允许访问：', window.location.pathname)
                        } 
                        else {
                            // 其他页面重定向到首页
                            window.location.pathname = '/pro/login'
                        }
                    } else {
                        // 清除可能存在的过期token
                        localStorage.removeItem('hexoProToken')
                        window.location.pathname = '/pro/login'
                    }
                })
                .catch(_ => {
                    // 出错时默认重定向到登录页
                    localStorage.removeItem('hexoProToken')
                    window.location.pathname = '/pro/login'
                })
        }
    }, [])


    useEffect(() => {
        if (theme === 'dark') {
            setConfigProviderTheme({
                algorithm: antTheme.darkAlgorithm,
                token: {
                    colorBgBase: '#141414',
                    colorTextBase: '#ffffff',
                    // Button specific styles
                    colorPrimaryBg: '#1a1a1a',
                    colorPrimaryText: '#ffffff',
                    colorPrimaryBorder: '#2a2a2a',
                    defaultShadow: 'none',
                    primaryShadow: 'none',
                    boxShadow: 'none', // 移除所有组件的阴影
                    btnBoxShadow: 'none', // 移除按钮的阴影
                    // 其他颜色和样式
                },
                components: {
                    Button: {
                        defaultShadow: 'none',
                        primaryShadow: 'none',
                        borderRadius: 'none',
                        borderRadiusSM: 'none',
                        borderRadiusLG: 'none',
                        defaultBorderColor: 'none',
                        defaultHoverBorderColor: 'none',
                    },
                    Menu: {
                        itemColor: '#ffffff',
                        itemHoverColor: '#1890ff',
                        itemSelectedColor: '#ffffff',  // 修改选中项字体颜色为白色
                        itemSelectedBg: '#1f1f1f',
                        itemBg: '#141414',
                        subMenuItemBg: '#141414',
                        itemActiveBg: '#1f1f1f',
                        activeBarWidth: 0,  // 移除选中项的蓝色指示条
                        activeBarBorderWidth: 0
                    }
                }
            })
        } else {
            setConfigProviderTheme({
                algorithm: antTheme.defaultAlgorithm,
                token: {
                    colorBgBase: '#ffffff',
                    colorTextBase: '#000000',
                    // Button specific styles
                    colorPrimaryBg: '#ffffff',
                    colorPrimaryText: '#000000',
                    colorPrimaryBorder: '#1890ff',
                    defaultShadow: 'none',
                    primaryShadow: 'none',
                    boxShadow: 'none', // 移除所有组件的阴影
                    btnBoxShadow: 'none' // 移除按钮的阴影

                    // 其他颜色和样式
                },
                components: {
                    Button: {
                        defaultShadow: 'none',
                        primaryShadow: 'none',
                        borderRadius: 'none',
                        borderRadiusSM: 'none',
                        borderRadiusLG: 'none',
                        defaultBorderColor: 'none',
                        defaultHoverBorderColor: 'none',
                    },
                }
            })
        }
    }, [theme])

    return (
        <BrowserRouter basename="/pro">
            <ConfigProvider
                locale={getLocale()}
                theme={configProviderTheme}
            >
                <Provider store={store}>
                    <GlobalContext.Provider value={contextValue}>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            {/* fix: 这里存在子路由 path不能使用 / 而应该使用/* */}
                            <Route path="/*" element={<PageLayout />} />
                        </Routes>
                    </GlobalContext.Provider>
                </Provider>
            </ConfigProvider>
        </BrowserRouter>

    )
}

export default App

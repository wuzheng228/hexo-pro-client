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
        if (checkLogin()) {
            fetchUserInfo()
        } else if (window.location.pathname.replace(/\//g, '') !== 'prologin') {
            window.location.pathname = '/pro/login'
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
                    colorPrimaryBg: '#000000',
                    colorPrimaryText: '#ffffff',
                    colorPrimaryBorder: '#1890ff',
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
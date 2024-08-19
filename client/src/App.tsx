import React, { useEffect, useState } from "react"
import { createStore } from 'redux'
import { Provider } from "react-redux"
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import rootReducer from './store'
import Login from "./pages/login"
import PageLayout from "./layout"
import { ConfigProvider, ConfigProviderProps, theme as antTheme } from "antd"

import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import { GlobalContext } from "./context"
import service from "./utils/api"
import checkLogin from "./utils/checkLogin"
import useStorage from "./utils/useStorage"

type Locale = ConfigProviderProps['locale'];

const store = createStore(rootReducer)

function App() {

    const setLang = () => { }

    const [theme, setTheme] = useStorage('hexo-pro-theme', 'light');
    const [configProviderTheme, setConfigProviderTheme] = useState({
        algorithm: antTheme.defaultAlgorithm,
        token: {
            colorPrimary: '#1890ff',
            colorBgBase: '#ffffff',
            colorTextBase: '#000000',
            colorPrimaryBg: '#ffffff',
            colorPrimaryText: '#000000',
            colorPrimaryBorder: '#1890ff',
        }
    })

    const contextValue = {
        lang: "zh-CN",
        setLang: setLang,
        theme,
        setTheme,
    }

    function fetchUserInfo() {
        store.dispatch({
            type: 'update-userInfo',
            payload: { userLoading: true },
        });
        service.get('/hexopro/api/userInfo').then((res) => {
            store.dispatch({
                type: 'update-userInfo',
                payload: { userInfo: res.data, userLoading: false },
            });
        }).catch(err => {
            console.log(err)
        }
        );
    }

    useEffect(() => {
        if (checkLogin()) {
            fetchUserInfo()
        } else if (window.location.pathname.replace(/\//g, '') !== 'prologin') {
            window.location.pathname = '/pro/login';
        }
    }, [])

    useEffect(() => {
        if (theme === 'dark') {
            setConfigProviderTheme({
                algorithm: antTheme.darkAlgorithm,
                token: {
                    colorPrimary: '#1890ff',
                    colorBgBase: '#141414',
                    colorTextBase: '#ffffff',
                    // Button specific styles
                    colorPrimaryBg: '#000000',
                    colorPrimaryText: '#ffffff',
                    colorPrimaryBorder: '#1890ff',
                    // 其他颜色和样式
                }
            })
        } else {
            setConfigProviderTheme({
                algorithm: antTheme.defaultAlgorithm,
                token: {
                    colorPrimary: '#1890ff',
                    colorBgBase: '#ffffff',
                    colorTextBase: '#000000',
                    // Button specific styles
                    colorPrimaryBg: '#ffffff',
                    colorPrimaryText: '#000000',
                    colorPrimaryBorder: '#1890ff',
                    // 其他颜色和样式
                }
            })
        }
    }, [theme])

    return (
        <BrowserRouter basename="/pro">
            <ConfigProvider
                locale={zhCN}
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
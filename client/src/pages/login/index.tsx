import React, { useContext, useEffect, useState } from 'react'
import styles from './style/index.module.less'
import Logo from '../../assets/logo3.svg'
import LoginBanner from './banner'
import LoginForm from './form'
import { GlobalContext } from '@/context'
import service from '@/utils/api'
import { Spin, message } from 'antd'

function Login() {
    const { theme } = useContext(GlobalContext)
    const [loading, setLoading] = useState(true)

    // 检查是否是首次使用
    useEffect(() => {
        // 检查是否已登录（有token）
        if (localStorage.getItem('hexoProToken')) {
            // 如果已有token，直接跳转到主页
            window.location.href = '/pro'
        } else {
            // 不再检查首次使用，让LoginForm组件处理
            setLoading(false)
        }
    }, [])

    if (loading) {
        return (
            <div className={styles.container} data-theme={theme}>
                <div className={styles.content} style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Spin size="large" tip="正在检查系统状态..." />
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container} data-theme={theme}>
            <div className={styles.logo}>
                <Logo />
            </div>
            {/* banner */}
            <div className={styles.banner}>
                <LoginBanner />
            </div>
            {/* content */}
            <div className={styles.content}>
                {/* form */}
                <LoginForm />
            </div>
        </div>
    )
}

export default Login

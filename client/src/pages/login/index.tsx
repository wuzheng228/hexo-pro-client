import React, { useContext, useState } from 'react'
import styles from './style/index.module.less'
import Logo from '../../assets/logo.svg'
import LoginBanner from './banner'
import LoginForm from './form'
import { GlobalContext } from '@/context'

function Login() {

    const { theme } = useContext(GlobalContext)

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

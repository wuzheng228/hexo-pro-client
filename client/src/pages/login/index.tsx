import React, { useContext } from 'react'
import styles from './style/index.module.less'
import Logo from '../../assets/logo3.svg'
import LoginBanner from './banner'
import LoginForm from './form'
import { GlobalContext } from '@/context'

function Login() {
    console.log('[Login Component]: 组件开始渲染');
    console.log('[Login Component]: window.location.href:', window.location.href);
    console.log('[Login Component]: window.location.search:', window.location.search);
    
    const { theme } = useContext(GlobalContext)
    
    console.log('[Login Component]: 准备渲染LoginForm');

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

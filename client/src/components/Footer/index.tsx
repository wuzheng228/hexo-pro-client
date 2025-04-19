import React, { useContext } from "react"
import { Footer as Foo } from 'antd/es/layout/layout'
import styles from './style/index.module.less'
import { GlobalContext } from '@/context'

export default function Footer() {
    const { theme } = useContext(GlobalContext)
    return (
        <div>
            <Foo className={`${styles.footer} ${theme === 'dark' ? styles.dark : ''}`}>Hexo pro</Foo>
        </div>
    )
}
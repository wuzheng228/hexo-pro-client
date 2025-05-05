import { LockOutlined, UserOutlined } from "@ant-design/icons"
import { Button, Form, Input, message, Alert } from "antd"
import React, { useRef, useState, useEffect } from "react"
import styles from './style/index.module.less'
import useLocale from "@/hooks/useLocale"
import service from "@/utils/api"
import useStorage from "@/utils/useStorage"

export default function LoginForm() {
    const formRef = useRef(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [loginParams, setLoginParams, removeLoginParams] =
        useStorage('loginParams')
    const [isFirstUse, setIsFirstUse] = useState(false)
    const [checkingFirstUse, setCheckingFirstUse] = useState(true)

    const [rememberPassword,] = useState(!!loginParams)

    const t = useLocale()

    // 检查是否是首次使用
    useEffect(() => {
        const checkFirstUse = async () => {
            try {
                const res = await service.get('/hexopro/api/settings/check-first-use')
                if (res.data.code === 0) {
                    setIsFirstUse(res.data.data.isFirstUse)
                }
            } catch (error) {
                console.error('检查系统状态失败:', error)
            } finally {
                setCheckingFirstUse(false)
            }
        }
        
        checkFirstUse()
    }, [])

    function afterLoginSuccess(params, token) {
        // 记住密码
        if (rememberPassword) {
            setLoginParams(JSON.stringify(params))
        } else {
            removeLoginParams()
        }
        // 记录登录状态，只保存token
        if (token) {
            localStorage.setItem('hexoProToken', token)
        }
        // 跳转首页
        window.location.href = '/pro'
    }

    function login(params) {
        setLoading(true)
        service
            .post('/hexopro/api/login', params)
            .then((res) => {
                const { code, msg, token } = res.data
                if (code === 0) {
                    afterLoginSuccess(params, token)
                } else if (code === -2) {
                    afterLoginSuccess(params, null)
                } else if (code === -1) {
                    setErrorMessage(t['login.form.login.errMsg'])
                }
                else {
                    setErrorMessage(msg || t['login.form.login.errMsg'])
                }
            })
            .finally(() => {
                setLoading(false)
            })
    }

    function onSubmitClick() {
        formRef.current.validateFields().then((values) => {
            login(values)
        }).catch((_) => {
            message.error(t['login.form.validate.errMsg'])
        })
    }

    const onFinishFailed = () => {
        message.error('Submit failed!')
    }

    // 跳转到设置页面进行首次设置
    const goToSettings = () => {
        // 首次使用不需要token，直接跳转到设置页面
        window.location.href = '/pro/settings'
    }

    // 跳过设置直接进入
    const skipSettings = () => {
        // 设置一个标记，表示用户选择了跳过设置
        localStorage.setItem('hexoProSkipSettings', 'true');
        // 首次使用不需要token，直接跳转到首页
        window.location.href = '/pro';
    }

    if (checkingFirstUse) {
        return <div className={styles['login-form-wrapper']}>
            <div className={styles['login-form-title']}>{t['login.form.title']}</div>
            <div className={styles['login-form-sub-title']}>{t['settings.system.check.status']}</div>
        </div>
    }

    if (isFirstUse) {
        return (
            <div className={styles['login-form-wrapper']}>
                <div className={styles['login-form-title']}>{t['settings.welcomeTitle']}</div>
                <div className={styles['login-form-sub-title']}>{t['settings.welcomeSubtitle']}</div>
                <Alert
                    message={t['settings.firstUsePrompt']}
                    description={t['settings.firstUseDescription']}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
                <Button type="primary" onClick={goToSettings} style={{ marginBottom: 12, width: '100%' }}>
                    {t['settings.setupNow']}
                </Button>
                <Button onClick={skipSettings} style={{ width: '100%' }}>
                    {t['settings.setupLater']}
                </Button>
            </div>
        )
    }

    return (
        <div className={styles['login-form-wrapper']}>
            <div className={styles['login-form-title']}>{t['login.form.title']}</div>
            <div className={styles['login-form-sub-title']}>{t['login.form.subTitle']}</div>
            <div className={styles['login-form-error']}>{errorMessage}</div>
            <Form
                onFinishFailed={onFinishFailed}
                ref={formRef}
                layout="vertical"
            >
                <Form.Item
                    rules={[{ required: true }]}
                    label={t['login.form.username']}
                    name={"username"}
                >
                    <Input
                        prefix={<UserOutlined />}
                    />
                </Form.Item>
                <Form.Item
                    rules={[{ required: true }]}
                    label={t['login.form.password']}
                    name="password"
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                    />
                </Form.Item>
                <Button type="primary" onClick={onSubmitClick} loading={loading}>
                    {t['login.form.login']}
                </Button>
            </Form>
        </div >
    )
}

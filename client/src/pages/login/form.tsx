import { LockOutlined, UserOutlined } from "@ant-design/icons"
import { Button, Form, Input, message, Alert } from "antd"
import React, { useRef, useState, useEffect, useCallback } from "react"
import styles from './style/index.module.less'
import useLocale from "@/hooks/useLocale"
import service from "@/utils/api"
import useStorage from "@/utils/useStorage"
import { useNavigate } from 'react-router-dom'

// 定义页面状态枚举
type PageStatus = 'checking' | 'first-use' | 'token-login' | 'login'

export default function LoginForm() {
    const formRef = useRef(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [pageStatus, setPageStatus] = useState<PageStatus>('checking') // 初始状态为 checking
    const [loginParams, setLoginParams, removeLoginParams] = useStorage('loginParams')
    const [rememberPassword,] = useState(!!loginParams)
    const t = useLocale()
    const navigate = useNavigate()

    // 统一的Token验证和页面跳转逻辑
    const validateTokenAndProceed = useCallback((tokenOverride?: string) => {
        console.log('[Login Form]: validateTokenAndProceed - 开始验证Token');
        const currentToken = tokenOverride || localStorage.getItem('hexoProToken');
        console.log(`[Login Form]: validateTokenAndProceed - 使用的Token (override: ${!!tokenOverride}):`, currentToken?.substring(0, 20) + '...');
        if (!currentToken) {
            console.log('[Login Form]: validateTokenAndProceed - 没有找到Token，显示登录表单');
            setPageStatus('login');
            return;
        }

        console.log('[Login Form]: validateTokenAndProceed - 检测到Token，准备验证有效性');
        const requestConfig: { headers?: { [key: string]: string } } = {};
        if (tokenOverride) {
            requestConfig.headers = { 'Authorization': 'Bearer ' + tokenOverride };
            console.log('[Login Form]: validateTokenAndProceed - 为 /userInfo 请求直接设置 Authorization 头');
        }

        service.get('/hexopro/api/userInfo', requestConfig)
            .then(res => {
                if (res.data && res.data.code !== 401 && res.data.name) { // 确保有有效的用户信息
                    console.log('[Login Form]: validateTokenAndProceed - Token有效，跳转到后台', res.data);
                    if (typeof navigate === 'function') {
                        navigate('/pro');
                    } else {
                        window.location.href = '/pro';
                    }
                } else {
                    console.log('[Login Form]: validateTokenAndProceed - Token无效或用户信息不完整，显示登录表单', res.data);
                    localStorage.removeItem('hexoProToken');
                    setPageStatus('login');
                }
            })
            .catch((err) => {
                console.log('[Login Form]: validateTokenAndProceed - Token验证失败，显示登录表单', err);
                localStorage.removeItem('hexoProToken');
                setPageStatus('login');
            });
    }, [navigate]); // useCallback 依赖项包含navigate

    // 主要的副作用钩子，处理页面加载时的逻辑
    useEffect(() => {
        console.log('[Login Form Effect]: 开始执行 useEffect');
        // 只用 localStorage 检查 token
        if (window.location.pathname.includes('/pro/login')) {
            const urlParams = new URLSearchParams(window.location.search);
            const reason = urlParams.get('reason');
            if (reason) {
                console.log('[Login Form Effect Browser]: 检测到reason参数，直接显示登录表单:', reason);
                setPageStatus('login');
                return;
            }
            const tokenFromStorage = localStorage.getItem('hexoProToken');
            if (tokenFromStorage) {
                console.log('[Login Form Effect Browser]: 在登录页，检测到Storage Token，尝试验证');
                validateTokenAndProceed(tokenFromStorage);
                return;
            }
            console.log('[Login Form Effect Browser]: 在登录页，无reason且无Storage Token，显示登录表单');
            setPageStatus('login');
        } else {
            // 对于非登录页（例如直接访问 /pro 等）
            const tokenForProtectedRoute = localStorage.getItem('hexoProToken');
            if (tokenForProtectedRoute) {
                console.log('[Login Form Effect Browser]: 非登录页，检测到Token，尝试验证');
                validateTokenAndProceed(tokenForProtectedRoute);
            } else {
                console.log('[Login Form Effect Browser]: 非登录页，没有Token，需要登录，跳转到登录页');
                window.location.href = '/pro/login?reason=no_token_on_protected_route_browser';
            }
        }
    }, [validateTokenAndProceed]); // validateTokenAndProceed 作为依赖项

    // 处理登录成功
    function afterLoginSuccess(params, token) {
        console.log('[Login Form]: 登录成功，处理token', token);
        
        // 记住密码
        if (rememberPassword) {
            setLoginParams(JSON.stringify(params))
        } else {
            removeLoginParams()
        }
        
        // 保存token
        if (token) {
            localStorage.setItem('hexoProToken', token);
            if (window.isHexoProDesktop) {
                service.post('/hexopro/api/desktop/save-token', { token: token })
                .then(res=>{
                    // console.log('[Login Form]: 桌面端token保存结果 (after explicit login):', JSON.stringify(res));
                })
            }
            // 如果是桌面端，调用保存token API (这部分逻辑可以保留，用于显式登录成功后的同步)
            if (window.electronAPI) { // 检查 electronAPI 是否存在，表明是桌面环境
                // 注意：此时我们不需要再依赖 window.isHexoProDesktop
                fetch('/hexopro/api/desktop/save-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                })
                .then(response => response.json())
                .then(result => {
                    console.log('[Login Form]: 桌面端token保存结果 (after explicit login):', result);
                    // 跳转首页由后续逻辑统一处理
                })
                .catch(error => {
                    console.error('[Login Form]: 桌面端token保存失败 (after explicit login):', error);
                });
            }
        }
        
        // 跳转首页
        window.location.href = '/pro';
    }

    // 处理登录请求
    function login(params) {
        setLoading(true);
        service.post('/hexopro/api/login', params)
            .then((res) => {
                const { code, msg, token } = res.data;
                console.log('[Login Form]: 登录成功，处理token', JSON.stringify(res));
                if (code === 0 || code === -2) {
                    afterLoginSuccess(params, token);
                } else {
                    setErrorMessage(msg || t['login.form.login.errMsg']);
                }
            })
            .catch((err) => {
                setErrorMessage(err.message || t['login.form.login.errMsg']);
            })
            .finally(() => {
                setLoading(false);
            });
    }

    // 处理表单提交
    function onSubmitClick() {
        formRef.current.validateFields()
            .then((values) => {
                login(values);
            })
            .catch((err) => {
                message.error(t['login.form.validate.errMsg'] + err);
            });
    }

    // 如果还在检查状态，显示加载中
    if (pageStatus === 'checking') {
        return (
            <div className={styles['login-form-wrapper']}>
                <div className={styles['login-form-title']}>{t['login.form.title']}</div>
                <div className={styles['login-form-sub-title']}>{t['settings.system.check.status']}</div>
            </div>
        );
    }

    // 显示登录表单
    return (
        <div className={styles['login-form-wrapper']}>
            <div className={styles['login-form-title']}>{t['login.form.title']}</div>
            <div className={styles['login-form-sub-title']}>{t['login.form.subTitle']}</div>
            {errorMessage && 
                <Alert 
                    message={errorMessage} 
                    type="error" 
                    showIcon 
                    style={{ marginBottom: 20 }} 
                    closable 
                    onClose={() => setErrorMessage('')} 
                />
            }
            <Form
                onFinishFailed={() => message.error('Submit failed!')}
                ref={formRef}
                layout="vertical"
            >
                <Form.Item
                    rules={[{ required: true }]} // 添加了 required 规则的显式消息
                    label={t['login.form.username']}
                    name="username"
                >
                    <Input prefix={<UserOutlined />} />
                </Form.Item>
                <Form.Item
                    rules={[{ required: true }]} // 添加了 required 规则的显式消息
                    label={t['login.form.password']}
                    name="password"
                >
                    <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Button type="primary" onClick={onSubmitClick} loading={loading}>
                    {t['login.form.login']}
                </Button>
            </Form>
        </div>
    );
}

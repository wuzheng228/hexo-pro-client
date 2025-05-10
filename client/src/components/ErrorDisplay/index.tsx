import React, { useContext } from 'react'
import { GlobalContext } from '@/context'
import styles from './style/index.module.less'

interface ErrorDisplayProps {
    error: Error
    onRetry: () => void
    className?: string
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, className }) => {
    const { theme } = useContext(GlobalContext)

    return (
        <div className={`${styles['error-display']} ${className}`} style={{
            padding: 20,
            textAlign: 'center',
            color: theme === 'dark' ? '#fff' : '#000'
        }}>
            <h3>加载失败</h3>
            <p>{error.message}</p>
            <button 
                onClick={onRetry}
                style={{
                    marginTop: 10,
                    padding: '8px 16px',
                    background: theme === 'dark' ? '#1890ff' : '#096dd9',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                }}
            >
                重试
            </button>
        </div>
    )
}

export default ErrorDisplay

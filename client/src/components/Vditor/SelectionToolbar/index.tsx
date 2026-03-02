import React, { useEffect } from 'react'
import { Spin } from 'antd'
import {
    BulbOutlined,
    EditOutlined,
    ExpandOutlined,
    SwapOutlined,
    FileTextOutlined,
    ImportOutlined,
    UndoOutlined,
    CloseOutlined,
} from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useLocale from '@/hooks/useLocale'
import styles from './style.module.less'

export type SelectionActionType = 'explain' | 'polish' | 'expand' | 'translate' | 'suggest'

export interface SelectionToolbarProps {
    visible: boolean
    position: { top: number; left: number }
    flipped?: boolean
    selectedText: string
    loading?: boolean
    dark?: boolean
    onAction: (type: SelectionActionType) => void
    aiResultVisible?: boolean
    aiResultContent?: string
    aiResultReasoning?: string
    aiResultReasoningExpanded?: boolean
    aiResultReasoningDurationMs?: number
    aiResultStreaming?: boolean
    onToggleReasoning?: () => void
    onInsert?: () => void
    onRetry?: () => void
    onCloseResult?: () => void
}

const ACTIONS: { key: SelectionActionType; icon: React.ReactNode; localeKey: string }[] = [
    { key: 'explain', icon: <BulbOutlined />, localeKey: 'selectionToolbar.explain' },
    { key: 'polish', icon: <EditOutlined />, localeKey: 'selectionToolbar.polish' },
    { key: 'expand', icon: <ExpandOutlined />, localeKey: 'selectionToolbar.expand' },
    { key: 'translate', icon: <SwapOutlined />, localeKey: 'selectionToolbar.translate' },
    { key: 'suggest', icon: <FileTextOutlined />, localeKey: 'selectionToolbar.suggest' },
]

export default function SelectionToolbar({
    visible,
    position,
    flipped = false,
    selectedText,
    loading = false,
    dark = false,
    onAction,
    aiResultVisible = false,
    aiResultContent = '',
    aiResultReasoning = '',
    aiResultReasoningExpanded = true,
    aiResultReasoningDurationMs,
    aiResultStreaming = false,
    onToggleReasoning,
    onInsert,
    onRetry,
    onCloseResult,
}: SelectionToolbarProps) {
    const t = useLocale()
    const formatDuration = (durationMs?: number) => {
        if (!durationMs || durationMs <= 0) return ''
        return `${(durationMs / 1000).toFixed(1)}s`
    }

    useEffect(() => {
        if (!aiResultVisible) return
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation()
                onCloseResult?.()
            }
        }
        document.addEventListener('keydown', handleEsc, true)
        return () => document.removeEventListener('keydown', handleEsc, true)
    }, [aiResultVisible, onCloseResult])

    if (!visible || !selectedText.trim()) return null

    const posStyle: React.CSSProperties = flipped
        ? { position: 'fixed', bottom: window.innerHeight - position.top + 6, left: position.left, zIndex: 9999 }
        : { position: 'fixed', top: position.top, left: position.left, zIndex: 9999 }

    return (
        <div
            className={`${styles.container} ${dark ? styles.dark : ''} ${flipped ? styles.flipped : ''}`}
            style={posStyle}
        >
            {/* 功能按钮条 */}
            <div className={styles.bar}>
                {loading ? (
                    <div className={styles.loadingWrap}>
                        <Spin size="small" />
                        <span className={styles.loadingText}>{t['ai.thinking'] || 'AI 正在思考...'}</span>
                    </div>
                ) : (
                    <div className={styles.actions}>
                        {ACTIONS.map(({ key, icon, localeKey }) => (
                            <button
                                key={key}
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => onAction(key)}
                                title={t[localeKey] || localeKey}
                            >
                                <span className={styles.icon}>{icon}</span>
                                <span className={styles.label}>{t[localeKey] || key}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* AI 结果对话框 */}
            {aiResultVisible && (
                <div className={styles.resultBox}>
                    <div className={styles.resultContent}>
                        {!!aiResultReasoning && (
                            <div className={styles.reasoning}>
                                <div
                                    className={styles.reasoningHeader}
                                    onClick={onToggleReasoning}
                                >
                                    <span className={styles.reasoningLabel}>
                                        {aiResultStreaming
                                            ? (t['ai.thinking'] || '思考中...')
                                            : `已思考${aiResultReasoningDurationMs ? ` ${formatDuration(aiResultReasoningDurationMs)}` : ''}`}
                                    </span>
                                    <span className={styles.reasoningToggle}>
                                        {aiResultReasoningExpanded ? '▼' : '▶'}
                                    </span>
                                </div>
                                {aiResultReasoningExpanded && (
                                    <div className={styles.reasoningContent}>{aiResultReasoning}</div>
                                )}
                            </div>
                        )}
                        {aiResultContent ? (
                            <div className={styles.markdown}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {aiResultContent}
                                </ReactMarkdown>
                            </div>
                        ) : aiResultStreaming && !aiResultReasoning ? (
                            <div className={styles.loadingWrap}>
                                <Spin size="small" />
                            </div>
                        ) : null}
                        {aiResultStreaming && aiResultContent && (
                            <span className={styles.cursor}>▍</span>
                        )}
                    </div>
                    {!aiResultStreaming && aiResultContent && (
                        <div className={styles.resultActions}>
                            <button
                                type="button"
                                className={styles.resultBtn}
                                onClick={onInsert}
                            >
                                <ImportOutlined />
                                <span>{t['selectionToolbar.insert'] || '插入'}</span>
                            </button>
                            <button
                                type="button"
                                className={styles.resultBtn}
                                onClick={onRetry}
                            >
                                <UndoOutlined />
                                <span>{t['selectionToolbar.retry'] || '再试一次'}</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.resultBtn} ${styles.closeBtn}`}
                                onClick={onCloseResult}
                            >
                                <CloseOutlined />
                                <span>{t['selectionToolbar.close'] || '关闭'}</span>
                                <kbd className={styles.kbd}>Escape</kbd>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

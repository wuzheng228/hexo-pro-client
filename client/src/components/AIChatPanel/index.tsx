import React, { useState, useRef, useEffect, useContext } from 'react';
import { Input, Button, message, Spin } from 'antd';
import { SendOutlined, CloseOutlined, CopyOutlined, ReloadOutlined, InsertRowLeftOutlined } from '@ant-design/icons';
import { flushSync } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GlobalContext } from '@/context';
import useLocale from '@/hooks/useLocale';
import { isAISConfigured } from '@/utils/aiSettings'
import { aiChatStream } from '@/utils/aiService';
import styles from './style.module.less';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    reasoning?: string;
    reasoningExpanded?: boolean;
    reasoningStartAt?: number;
    reasoningDurationMs?: number;
    isStreaming?: boolean;
}

interface AIChatPanelProps {
    visible: boolean;
    onClose: () => void;
    onInsertContent: (content: string) => void;
}

export default function AIChatPanel({ visible, onClose, onInsertContent }: AIChatPanelProps) {
    const t = useLocale();
    const { theme } = useContext(GlobalContext);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const formatDuration = (durationMs?: number) => {
        if (!durationMs || durationMs <= 0) return '';
        return `${(durationMs / 1000).toFixed(1)}s`;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!visible) {
            setInputValue('');
            setMessages([]);
        }
    }, [visible]);

    const sendMessage = async (content: string, baseMessages: Message[]) => {
        if (!content.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
        };

        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            reasoning: '',
            reasoningExpanded: true,
            isStreaming: true,
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInputValue('');
        setIsLoading(true);

        const allMessagesForApi = [
            ...baseMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            { role: 'user' as const, content: userMessage.content }
        ];

        const configured = await isAISConfigured()
        if (!configured) {
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessage.id
                    ? { ...msg, content: t['ai.notConfigured'], isStreaming: false }
                    : msg
            ))
            setIsLoading(false)
            return
        }

        try {
            abortControllerRef.current = new AbortController();

            // 使用 aiService 的流式接口
            let hasReceivedData = false;
            for await (const chunk of aiChatStream(
                allMessagesForApi,
                (chunk) => {
                    // 使用 flushSync 确保状态同步更新，实现打字机效果
                    flushSync(() => {
                        if (chunk.done) {
                            setMessages(prev => prev.map(msg =>
                                msg.id === assistantMessage.id
                                    ? {
                                        ...msg,
                                        isStreaming: false,
                                        reasoningExpanded: msg.reasoning ? false : msg.reasoningExpanded,
                                        reasoningDurationMs: msg.reasoning && !msg.reasoningDurationMs && msg.reasoningStartAt
                                            ? Date.now() - msg.reasoningStartAt
                                            : msg.reasoningDurationMs,
                                    }
                                    : msg
                            ));
                            return;
                        }

                        // 收到第一个数据块时，关闭 Spin，开始显示内容
                        if (!hasReceivedData) {
                            hasReceivedData = true;
                            setMessages(prev => prev.map(msg =>
                                msg.id === assistantMessage.id
                                    ? { ...msg, isStreaming: false }
                                    : msg
                            ));
                        }

                        setMessages(prev => prev.map(msg => {
                            if (msg.id === assistantMessage.id) {
                                const now = Date.now();
                                const hasNewReasoning = !!chunk.reasoning;
                                const hasNewContent = !!chunk.content;
                                const nextReasoning = hasNewReasoning ? (msg.reasoning || '') + chunk.reasoning : msg.reasoning;
                                const nextContent = hasNewContent ? msg.content + chunk.content : msg.content;
                                const shouldCloseReasoning = !!nextReasoning && hasNewContent;
                                return {
                                    ...msg,
                                    content: nextContent,
                                    reasoning: nextReasoning,
                                    reasoningStartAt: hasNewReasoning && !msg.reasoningStartAt ? now : msg.reasoningStartAt,
                                    reasoningExpanded: shouldCloseReasoning ? false : (hasNewReasoning ? true : msg.reasoningExpanded),
                                    reasoningDurationMs: shouldCloseReasoning && msg.reasoningStartAt && !msg.reasoningDurationMs
                                        ? now - msg.reasoningStartAt
                                        : msg.reasoningDurationMs,
                                };
                            }
                            return msg;
                        }));
                    });
                },
                abortControllerRef.current.signal
            )) {
                // 流式处理在上面的回调中完成
            }

            // 确保流结束后 isStreaming 设为 false
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessage.id
                    ? { ...msg, isStreaming: false }
                    : msg
            ));
        } catch (error: any) {
            if (error.name === 'AbortError') {
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessage.id
                        ? { ...msg, isStreaming: false }
                        : msg
                ));
            } else {
                console.error('AI API Error:', error);
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessage.id
                        ? { ...msg, content: `${t['ai.error']}: ${error.message}`, isStreaming: false }
                        : msg
                ));
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleSend = () => {
        sendMessage(inputValue.trim(), messages);
    };

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content).then(() => {
            message.success(t['ai.copySuccess']);
        });
    };

    const handleRegenerate = () => {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUserMessage) return;

        const assistantMessages = messages.filter(m => m.role === 'assistant');
        const lastAssistantMsg = assistantMessages[assistantMessages.length - 1];
        const lastAssistantIndex = lastAssistantMsg ? messages.findIndex(m => m.id === lastAssistantMsg.id) : -1;

        // 移除最后一对 user + assistant
        const baseMessages = lastAssistantIndex > 0 ? messages.slice(0, lastAssistantIndex - 1) : [];
        setMessages(baseMessages);
        setInputValue('');

        sendMessage(lastUserMessage.content, baseMessages);
    };

    const handleInsert = (content: string) => {
        onInsertContent(content);
        message.success(t['ai.insertSuccess']);
    };

    const toggleReasoning = (msgId: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === msgId) {
                return { ...msg, reasoningExpanded: !msg.reasoningExpanded };
            }
            return msg;
        }));
    };

    if (!visible) return null;

    return (
        <div className={`${styles.panel} ${theme === 'dark' ? styles.dark : ''}`}>
            <div className={styles.header}>
                <span className={styles.title}>{t['ai.title']}</span>
                <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={onClose}
                    className={styles.closeBtn}
                />
            </div>

            <div className={styles.content}>
                {messages.length === 0 && (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🤖</div>
                        <div className={styles.emptyText}>{t['ai.title']}</div>
                    </div>
                )}

                {messages.map(msg => (
                    <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                        <div className={styles.messageContent}>
                            {msg.role === 'assistant' ? (
                                <>
                                    {msg.reasoning && (
                                        <div className={styles.reasoning}>
                                            <div
                                                className={styles.reasoningHeader}
                                                onClick={() => toggleReasoning(msg.id)}
                                            >
                                                <span className={styles.reasoningLabel}>
                                                    {msg.isStreaming
                                                        ? '思考中...'
                                                        : `已思考${msg.reasoningDurationMs ? ` (${formatDuration(msg.reasoningDurationMs)})` : ''}`}
                                                </span>
                                                <span className={styles.reasoningToggle}>
                                                    {msg.reasoningExpanded ? '▼' : '▶'}
                                                </span>
                                            </div>
                                            {msg.reasoningExpanded && (
                                                <div className={styles.reasoningContent}>{msg.reasoning}</div>
                                            )}
                                        </div>
                                    )}
                                    <div className={styles.markdown}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                               </>
                            ) : (
                                <div className={styles.userContent}>{msg.content}</div>
                            )}
                            {msg.isStreaming && <Spin size="small" className={styles.streaming} />}
                        </div>

                        {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                            <div className={styles.actions}>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<InsertRowLeftOutlined />}
                                    onClick={() => handleInsert(msg.content)}
                                >
                                    {t['ai.insert']}
                                </Button>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() => handleCopy(msg.content)}
                                >
                                    {t['ai.copy']}
                                </Button>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={handleRegenerate}
                                >
                                    {t['ai.regenerate']}
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className={styles.footer}>
                <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onPressEnter={!isLoading ? handleSend : undefined}
                    placeholder={t['ai.placeholder']}
                    disabled={isLoading}
                    className={styles.input}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    loading={isLoading}
                    className={styles.sendBtn}
                />
            </div>
        </div>
    );
}

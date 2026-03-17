import { Button, Card, Checkbox, Input, Tag, Tooltip, Select, Switch, InputNumber, Space, Divider, message } from "antd"
import React from "react"
import { useEffect, useState } from "react"
import useDeviceDetect from '../../../hooks/useDeviceDetect'
import { formatFrontMatterValue } from "@/utils/booleanUtils"
import useLocale from "@/hooks/useLocale"
import yaml from "js-yaml"

const CheckboxGroup = Checkbox.Group
const { Option } = Select

export function FrontMatterAdder({ visible, onClose, title, existFrontMatter, frontMatter, frontMatterStyles = {}, onChange }) {
    const { isMobile } = useDeviceDetect()
    const [localVisible, setLocalVisible] = useState(false)
    const [inputFmtKeyValue, setInputFmtKeyValue] = useState('')
    const [inputFmtValueValue, setInputFmtValueValue] = useState('')
    const [inputValueType, setInputValueType] = useState('string') // 'string', 'boolean', 'number'
    const [booleanValue, setBooleanValue] = useState(false)
    const [numberValue, setNumberValue] = useState(0)

    const t = useLocale()

    const hasOwn = (obj: Record<string, any>, key: string) => Object.prototype.hasOwnProperty.call(obj || {}, key)

    const getStringInputStyle = (value: string): 'double' | 'single' | 'plain' => {
        const raw = typeof value === 'string' ? value : ''
        const trimmed = raw.trim()
        if (!trimmed) return 'plain'

        const wrappedByDoubleQuote = trimmed.startsWith('"') && trimmed.endsWith('"')
        const wrappedBySingleQuote = trimmed.startsWith("'") && trimmed.endsWith("'")
        if (wrappedByDoubleQuote) {
            return 'double'
        }
        if (wrappedBySingleQuote) {
            return 'single'
        }
        return 'plain'
    }

    // 把输入值解析成真实字符串值；引号风格通过 frontMatterStyles 单独保存
    const normalizeStringInput = (value: string, style: 'double' | 'single' | 'plain') => {
        const raw = typeof value === 'string' ? value : ''
        const trimmed = raw.trim()
        if (!trimmed) return raw
        if (style === 'plain') return raw
        try {
            const parsed = yaml.load(trimmed)
            if (typeof parsed === 'string') {
                return parsed
            }
        } catch (_) {
            // ignore parsing error and fallback below
        }

        return trimmed.slice(1, -1)
    }

    useEffect(() => {
        setLocalVisible(visible)
    }, [visible])

    // 重置输入状态
    const resetInputState = () => {
        setInputFmtKeyValue('')
        setInputFmtValueValue('')
        setInputValueType('string')
        setBooleanValue(false)
        setNumberValue(0)
    }

    const existFontMatter = () => {
        const fmkeys = Array.from(new Set([
            ...Object.keys(existFrontMatter || {}),
            ...Object.keys(frontMatter || {})
        ]))
        const selectedKeys = Object.keys(frontMatter || {})
        const options = []

        fmkeys.forEach((name, i) => {
            const value = hasOwn(frontMatter, name) ? frontMatter[name] : existFrontMatter[name]
            options.push({
                label: (
                    <Tooltip key={i} title={formatFrontMatterValue(value)}>
                        <Tag color={value === null || value === undefined ? 'default' : 'blue'} style={{fontSize: '11px', padding: '2px 6px'}}>{name}</Tag>
                    </Tooltip>
                ),
                value: name
            })
        })

        return (
            <CheckboxGroup options={options} value={selectedKeys} onChange={(v) => {
                const newfmt = {}
                const newStyles = {}
                v.forEach(name => {
                    // 优先保留用户当前编辑中的值；不存在时回退到初始值
                    if (hasOwn(frontMatter, name)) {
                        newfmt[name] = frontMatter[name]
                    } else if (hasOwn(existFrontMatter, name)) {
                        newfmt[name] = existFrontMatter[name]
                    } else {
                        newfmt[name] = null
                    }

                    if (hasOwn(frontMatterStyles, name)) {
                        newStyles[name] = frontMatterStyles[name]
                    }
                })
                onChange(newfmt, newStyles)
            }} />
        )
    }

    const onInputEnterKeyPress = () => {
        const normalizedKey = inputFmtKeyValue.trim()
        if (normalizedKey.length === 0) {
            return
        }

        const newFmt = { ...frontMatter }
        const nextStyles = { ...frontMatterStyles }

        // 根据选择的类型设置值
        switch (inputValueType) {
            case 'boolean':
                newFmt[normalizedKey] = booleanValue
                delete nextStyles[normalizedKey]
                break
            case 'number':
                newFmt[normalizedKey] = numberValue
                delete nextStyles[normalizedKey]
                break
            case 'string':
            default: {
                const style = getStringInputStyle(inputFmtValueValue)
                newFmt[normalizedKey] = normalizeStringInput(inputFmtValueValue, style)
                if (style === 'plain') {
                    delete nextStyles[normalizedKey]
                } else {
                    nextStyles[normalizedKey] = style
                }
                break
            }
        }

        if (hasOwn(frontMatter, normalizedKey)) {
            message.info(`已更新字段: ${normalizedKey}`)
        }

        onChange(newFmt, nextStyles)
        resetInputState()
    }

    // 渲染值输入控件
    const renderValueInput = () => {
        switch (inputValueType) {
            case 'boolean':
                return (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        backgroundColor: '#fafafa',
                        minHeight: '28px'
                    }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                            {t['frontMatterAdder.input.boolean.value']}:
                        </span>
                        <Space size="small">
                            <Switch 
                                checked={booleanValue} 
                                onChange={setBooleanValue}
                                size="small"
                            />
                            <span style={{ 
                                fontSize: '11px', 
                                color: booleanValue ? '#52c41a' : '#ff4d4f',
                                fontWeight: 500,
                                minWidth: '30px'
                            }}>
                                {booleanValue ? 'true' : 'false'}
                            </span>
                        </Space>
                    </div>
                )
            case 'number':
                return (
                    <InputNumber
                        placeholder={t['frontMatterAdder.input.number.placeholder']}
                        value={numberValue}
                        onChange={(value) => setNumberValue(value || 0)}
                        onPressEnter={onInputEnterKeyPress}
                        style={{ width: '100%' }}
                        size="small"
                        controls={false}
                    />
                )
            case 'string':
            default:
                return (
                    <Input
                        placeholder={t['frontMatterAdder.input.string.placeholder']}
                        value={inputFmtValueValue}
                        onChange={(v) => setInputFmtValueValue(v.target.value)}
                        onPressEnter={onInputEnterKeyPress}
                        size="small"
                    />
                )
        }
    }

    const addFrontMatter = () => {
        return (
            <div style={{
                padding: '12px',
                backgroundColor: '#fafafa',
                borderRadius: '4px',
                border: '1px solid #f0f0f0'
            }}>
                {/* 标题 */}
                <div style={{
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#262626'
                }}>
                    {t['frontMatterAdder.title.addNewFrontMatter']}
                </div>

                {/* 输入区域 */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    {/* 键名和类型选择 - 横向布局 */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-end'
                    }}>
                        <div style={{ flex: 2 }}>
                            <div style={{ 
                                marginBottom: '4px', 
                                fontSize: '11px', 
                                color: '#666'
                            }}>
                                {t['frontMatterAdder.field.key.name']}
                            </div>
                            <Input
                                placeholder={t['frontMatterAdder.field.key.placeholder']}
                                value={inputFmtKeyValue}
                                onChange={(v) => setInputFmtKeyValue(v.target.value)}
                                onPressEnter={onInputEnterKeyPress}
                                status={!inputFmtKeyValue.trim() ? 'error' : undefined}
                                size="small"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ 
                                marginBottom: '4px', 
                                fontSize: '11px', 
                                color: '#666'
                            }}>
                                数据类型
                            </div>
                            <Select
                                value={inputValueType}
                                onChange={setInputValueType}
                                style={{ width: '100%' }}
                                size="small"
                            >
                                <Option value="string">📝 {t['frontMatterAdder.input.string.value']}</Option>
                                <Option value="boolean">🔘 {t['frontMatterAdder.input.boolean.value']}</Option>
                                <Option value="number">🔢 {t['frontMatterAdder.input.number.value']}</Option>
                            </Select>
                        </div>
                    </div>

                    {/* 值输入 */}
                    <div>
                        <div style={{ 
                            marginBottom: '4px', 
                            fontSize: '11px', 
                            color: '#666'
                        }}>
                            键值
                        </div>
                        {renderValueInput()}
                    </div>

                    {/* 操作按钮 */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px',
                        paddingTop: '8px',
                        borderTop: '1px solid #f0f0f0'
                    }}>
                        <Button
                            type="primary"
                            onClick={onInputEnterKeyPress}
                            disabled={!inputFmtKeyValue.trim()}
                            size="small"
                        >
                            {t['frontMatterAdder.button.addFrontMatter']}
                        </Button>
                        <Button
                            onClick={() => {
                                setLocalVisible(false)
                                resetInputState()
                                onClose()
                            }}
                            size="small"
                        >
                            {t['universal.close']}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return localVisible ? (
        <Card
            title={
                <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 600,
                    color: '#262626'
                }}>
                    {title}
                </div>
            }
            bordered={true}
            size="small"
            style={{
                position: 'absolute',
                top: '100%',
                zIndex: 100,
                width: isMobile ? '95vw' : '500px',
                maxWidth: '100vw',
                left: isMobile ? '2.5vw' : undefined,
                right: isMobile ? '2.5vw' : undefined,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderRadius: '6px',
                marginTop: '4px'
            }}
            bodyStyle={{ 
                padding: isMobile ? '12px' : '16px',
                maxHeight: '60vh',
                overflowY: 'auto'
            }}
        >
            {/* 现有 Front Matter 选择区域 */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{
                    marginBottom: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#262626'
                }}>
                    {t['frontMatterAdder.title.selectExistingFrontMatter']}
                </div>
                <div style={{
                    padding: '8px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef'
                }}>
                    {existFontMatter()}
                </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* 添加新 Front Matter 区域 */}
            {addFrontMatter()}
        </Card>
    ) : null
}

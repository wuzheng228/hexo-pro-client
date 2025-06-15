import { Button, Card, Checkbox, Input, Tag, Tooltip, Select, Switch, InputNumber, Space, Divider } from "antd"
import React from "react"
import { useEffect, useState } from "react"
import useDeviceDetect from '../../../hooks/useDeviceDetect'
import { formatFrontMatterValue } from "@/utils/booleanUtils"
import useLocale from "@/hooks/useLocale"

const CheckboxGroup = Checkbox.Group
const { Option } = Select

export function FrontMatterAdder({ visible, onClose, title, existFrontMatter, frontMatter, onChange }) {
    const { isMobile } = useDeviceDetect()
    const [localVisible, setLocalVisible] = useState(false)
    const [inputFmtKeyValue, setInputFmtKeyValue] = useState('')
    const [inputFmtValueValue, setInputFmtValueValue] = useState('')
    const [inputValueType, setInputValueType] = useState('string') // 'string', 'boolean', 'number'
    const [booleanValue, setBooleanValue] = useState(false)
    const [numberValue, setNumberValue] = useState(0)

    const t = useLocale()

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
        const fmkeys = Object.keys(existFrontMatter)
        const options = []

        fmkeys.forEach((name, i) => {
            options.push({
                label: (
                    <Tooltip key={i} title={formatFrontMatterValue(frontMatter[name])}>
                        <Tag color={frontMatter[name] === null || frontMatter[name] === undefined ? 'default' : 'blue'}>{name}</Tag>
                    </Tooltip>
                ),
                value: name
            })
        })

        return (
            <CheckboxGroup options={options} defaultValue={fmkeys} onChange={(v) => {
                const newfmt = {}
                v.forEach(name => {
                    // 保持原始值，不进行任何转换
                    newfmt[name] = !existFrontMatter[name] ? null : existFrontMatter[name]
                })
                console.log('newfmt', newfmt)
                onChange(newfmt)
            }} />
        )
    }

    const onInputEnterKeyPress = () => {
        if (inputFmtKeyValue.trim().length == 0) {
            return
        }
        
        const newFmt = { ...frontMatter }
        
        // 根据选择的类型设置值
        switch (inputValueType) {
            case 'boolean':
                newFmt[inputFmtKeyValue] = booleanValue
                break
            case 'number':
                newFmt[inputFmtKeyValue] = numberValue
                break
            case 'string':
            default:
                newFmt[inputFmtKeyValue] = inputFmtValueValue
                break
        }
        
        onChange(newFmt)
        resetInputState()
    }

    // 渲染值输入控件
    const renderValueInput = () => {
        const commonStyle = { 
            width: '100%', 
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center'
        }

        switch (inputValueType) {
            case 'boolean':
                return (
                    <div style={{
                        ...commonStyle,
                        justifyContent: 'space-between',
                        padding: '4px 12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        backgroundColor: '#fafafa'
                    }}>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                            {t['frontMatterAdder.input.boolean.value']}:
                        </span>
                        <Space>
                            <Switch 
                                checked={booleanValue} 
                                onChange={setBooleanValue}
                                size="small"
                            />
                            <span style={{ 
                                fontSize: '12px', 
                                color: booleanValue ? '#52c41a' : '#ff4d4f',
                                fontWeight: 500,
                                minWidth: '35px'
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
                        style={{ ...commonStyle }}
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
                        style={{ ...commonStyle }}
                    />
                )
        }
    }

    const addFrontMatter = () => {
        return (
            <div style={{
                padding: isMobile ? '16px' : '20px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #f0f0f0'
            }}>
                {/* 标题 */}
                <div style={{
                    marginBottom: '16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#262626'
                }}>
                    {t['frontMatterAdder.title.addNewFrontMatter']}
                </div>

                {/* 输入区域 */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {/* 键名输入 */}
                    <div>
                        <div style={{ 
                            marginBottom: '6px', 
                            fontSize: '12px', 
                            color: '#666',
                            fontWeight: 500
                        }}>
                            {t['frontMatterAdder.field.key.name']}
                        </div>
                        <Input
                            placeholder={t['frontMatterAdder.field.key.placeholder']}
                            value={inputFmtKeyValue}
                            onChange={(v) => setInputFmtKeyValue(v.target.value)}
                            onPressEnter={onInputEnterKeyPress}
                            status={!inputFmtKeyValue.trim() ? 'error' : undefined}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* 类型选择 */}
                    <div>
                        <div style={{ 
                            marginBottom: '6px', 
                            fontSize: '12px', 
                            color: '#666',
                            fontWeight: 500
                        }}>
                            数据类型
                        </div>
                        <Select
                            value={inputValueType}
                            onChange={setInputValueType}
                            style={{ width: '100%' }}
                            size="middle"
                        >
                            <Option value="string">
                                <Space>
                                    <span>📝</span>
                                    <span>{t['frontMatterAdder.input.string.value']}</span>
                                </Space>
                            </Option>
                            <Option value="boolean">
                                <Space>
                                    <span>🔘</span>
                                    <span>{t['frontMatterAdder.input.boolean.value']}</span>
                                </Space>
                            </Option>
                            <Option value="number">
                                <Space>
                                    <span>🔢</span>
                                    <span>{t['frontMatterAdder.input.number.value']}</span>
                                </Space>
                            </Option>
                        </Select>
                    </div>

                    {/* 值输入 */}
                    <div>
                        <div style={{ 
                            marginBottom: '6px', 
                            fontSize: '12px', 
                            color: '#666',
                            fontWeight: 500
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
                        gap: '8px',
                        marginTop: '8px',
                        paddingTop: '12px',
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
                    fontSize: '16px', 
                    fontWeight: 600,
                    color: '#262626'
                }}>
                    {title}
                </div>
            }
            bordered={true}
            style={{
                position: 'absolute',
                top: '100%',
                zIndex: 100,
                width: isMobile ? '95vw' : '750px',
                maxWidth: '100vw',
                left: isMobile ? '2.5vw' : undefined,
                right: isMobile ? '2.5vw' : undefined,
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                borderRadius: '8px',
                marginTop: '8px'
            }}
            bodyStyle={{ 
                padding: isMobile ? '16px' : '24px',
                maxHeight: '70vh',
                overflowY: 'auto'
            }}
        >
            {/* 现有 Front Matter 选择区域 */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{
                    marginBottom: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#262626'
                }}>
                    {t['frontMatterAdder.title.selectExistingFrontMatter']}
                </div>
                <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                }}>
                    {existFontMatter()}
                </div>
            </div>

            <Divider style={{ margin: '20px 0' }} />

            {/* 添加新 Front Matter 区域 */}
            {addFrontMatter()}
        </Card>
    ) : null
}
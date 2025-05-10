import { Button, Card, Checkbox, Input, Tag, Tooltip } from "antd"
import React from "react"
import { useEffect, useState } from "react"
import useDeviceDetect from '../../../hooks/useDeviceDetect'

const CheckboxGroup = Checkbox.Group

export function FrontMatterAdder({ visible, onClose, title, existFrontMatter, frontMatter, onChange }) {
    const { isMobile } = useDeviceDetect()
    const [localVisible, setLocalVisible] = useState(false)
    const [inputFmtKeyValue, setInputFmtKeyValue] = useState('')
    const [inputFmtValueValue, setInputFmtValueValue] = useState('')

    useEffect(() => {
        setLocalVisible(visible)
    }, [visible])

    const existFontMatter = () => {
        const fmkeys = Object.keys(existFrontMatter)
        const options = []

        fmkeys.forEach((name, i) => {
            options.push({
                label: (
                    <Tooltip key={i} title={!frontMatter[name] ? 'unset' : frontMatter[name]}>
                        <Tag color={!frontMatter[name] ? 'default' : 'blue'}>{name}</Tag>
                    </Tooltip>
                ),
                value: name
            })
        })

        return (
            <CheckboxGroup options={options} defaultValue={fmkeys} onChange={(v) => {
                const newfmt = {}
                v.forEach(name => {
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
        newFmt[inputFmtKeyValue] = inputFmtValueValue
        onChange(newFmt)
    }

    const addFrontMatter = () => {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                width: '100%'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr auto auto',
                    gridTemplateRows: isMobile ? 'auto auto' : 'unset',
                    gap: 8,
                    alignItems: 'center'
                }}>
                    <Input
                        placeholder="键名"
                        value={inputFmtKeyValue}
                        onChange={(v) => setInputFmtKeyValue(v.target.value)}
                        onPressEnter={onInputEnterKeyPress}
                        status={!inputFmtKeyValue.trim() ? 'error' : undefined}
                    />
                    <Input
                        placeholder="键值"
                        value={inputFmtValueValue}
                        onChange={(v) => setInputFmtValueValue(v.target.value)}
                        onPressEnter={onInputEnterKeyPress}
                    />
                    <Button
                        type="primary"
                        onClick={onInputEnterKeyPress}
                        disabled={!inputFmtKeyValue.trim()}
                        style={{ minWidth: isMobile ? '100%' : 80 }}
                    >
                        添加
                    </Button>
                </div>
                <Button
                    danger
                    onClick={() => {
                        setLocalVisible(false)
                        onClose()
                    }}
                    style={{ alignSelf: 'flex-end' }}
                >
                    关闭
                </Button>
            </div >
        )
    }

    return localVisible ? (
        <Card
            title={title}
            bordered={true}
            hoverable={true}
            style={{
                position: 'absolute',
                top: '100%',
                zIndex: 100,
                width: isMobile ? '80vw' : '600px',
                maxWidth: '100vw',
                left: isMobile ? 0 : undefined,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
            extra={addFrontMatter()}
            bodyStyle={{ padding: isMobile ? 12 : 24 }}
        >
            <div style={{
                maxHeight: '60vh',
                overflowY: 'auto',
                paddingRight: 8
            }}>
                {existFontMatter()}
            </div>
        </Card>
    ) : null
}
import { Button, Card, Checkbox, Input, Space, Tag, Tooltip } from "antd"
import React from "react"
import { useEffect, useState } from "react"

const CheckboxGroup = Checkbox.Group

export function FrontMatterAdder({ visible, onClose, title, existFrontMatter, frontMatter, onChange }) {
    const [localVisible, setLocalVisible] = useState(false)
    const [inputFmtKeyValue, setInputFmtKeyValue] = useState('')
    const [inputFmtValueValue, setInputFmtValueValue] = useState('')

    useEffect(() => {
        setLocalVisible(visible)
    }, [visible])

    const exitsFontMatter = () => {
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Space>
                    <Input style={{ flex: 1 }} placeholder="frontMatter Key" value={inputFmtKeyValue} onChange={(v) => setInputFmtKeyValue(v.target.value)} onPressEnter={onInputEnterKeyPress} />
                    <Input style={{ flex: 1 }} placeholder="frontMatter value" value={inputFmtValueValue} onChange={(v) => setInputFmtValueValue(v.target.value)} onPressEnter={onInputEnterKeyPress} />
                    <Button type='default' onClick={() => {
                        setLocalVisible(false)
                        onClose()
                    }}>X</Button>
                </Space>
            </div>

        )
    }

    return (
        localVisible &&
        <Card title={title} bordered={true} hoverable={true} style={{ position: 'absolute', top: '100%', zIndex: 100, width: '600px' }} extra={addFrontMatter()}>
            {exitsFontMatter()}
        </Card>
    )
}
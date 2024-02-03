import React from "react"
import { Button, Card, Checkbox, Form, Grid, Input, Space, Tag, Tooltip, Typography } from "@arco-design/web-react"
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
        return (
            <CheckboxGroup onChange={(v) => {
                const newfmt = {}
                v.forEach(name => {
                    newfmt[name] = !exitsFontMatter[name] ? null : exitsFontMatter[name]
                })
                onChange(newfmt)
            }} value={Object.keys(frontMatter)}>
                {
                    fmkeys.map((item, i) => {
                        return (
                            <Checkbox key={item} value={item}>
                                {({ checked }) => {
                                    return (
                                        <Tooltip key={item} content={!frontMatter[item] ? 'unset' : frontMatter[item]}>
                                            <Tag key={item} color={checked ? 'purple' : ''} style={{ marginBottom: 5 }}>
                                                {item}
                                            </Tag>
                                        </Tooltip>

                                    );
                                }}
                            </Checkbox>
                        );
                    })}
            </CheckboxGroup>
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
            <Space>
                <Input placeholder="frontMatter Key" value={inputFmtKeyValue} onChange={(v) => setInputFmtKeyValue(v)} onPressEnter={onInputEnterKeyPress} />
                <Input placeholder="frontMatter value" value={inputFmtValueValue} onChange={(v) => setInputFmtValueValue(v)} onPressEnter={onInputEnterKeyPress} />
                <Button type='text' onClick={() => {
                    setLocalVisible(false)
                    onClose()
                }}>X</Button>
            </Space>
        )
    }

    return (
        localVisible && <Card title={title} bordered={true} hoverable={true} style={{ position: 'absolute', top: '100%', zIndex: 100, width: '100%' }} extra={addFrontMatter()}>
            {exitsFontMatter()}
        </Card>
    )
}
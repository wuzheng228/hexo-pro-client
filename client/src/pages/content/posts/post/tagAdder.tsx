import { Button, Card, Checkbox, Input, Tag } from "antd"
import React, { useEffect, useState } from "react"
import useDeviceDetect from '../../../../hooks/useDeviceDetect';

const CheckboxGroup = Checkbox.Group

export function TagAdder({ existTags, tags, onchange, onClose, visible, cardTitle, placeholder }) {
    const { isMobile } = useDeviceDetect();
    const [tagInputValue, setTagInputValue] = useState('')
    const [localVisible, setLocalVisible] = useState(visible)

    useEffect(() => {
        // 当外部的 visible 发生变化时，同步更新本地的状态
        setLocalVisible(visible)
    }, [visible])

    const onInputEnterKeyPress = () => {
        if (tagInputValue.trim() === '') {
            return
        }
        const tagSet = new Set(tags)
        tagSet.add(tagInputValue)
        onchange(Array.from(tagSet))
        setTagInputValue('')
    }

    const addNewTag = (v) => {
        const inputValue = v.target.value
        if (inputValue.trim() === '') {
            setTagInputValue('')
            return
        }
        const tagSet = new Set(tags)
        tagSet.add(inputValue)
        onchange(Array.from(tagSet))
        setTagInputValue('')
    }


    function tagModified() {
        const options = []
        Object.keys(existTags).forEach((name) => {
            options.push(existTags[name])
        })
        return (
            <CheckboxGroup
                options={options.map((item, i) => ({
                    label: (
                        <Tag color={tags.includes(item) ? 'purple' : ''} style={{ marginBottom: 5 }}>
                            {item}
                        </Tag>
                    ),
                    value: item
                }))}
                value={tags}
                onChange={(v) => { onchange(v) }}
            />
        )
    }

    function addTag() {
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
                        placeholder={placeholder}
                        value={tagInputValue}
                        onChange={(v) => setTagInputValue(v.target.value)}
                        onPressEnter={(v) => { addNewTag(v) }}
                        status={!tagInputValue.trim() ? 'error' : undefined}
                    />
                    <Button
                        type="primary"
                        onClick={onInputEnterKeyPress}
                        disabled={!tagInputValue.trim()}
                        style={{ minWidth: isMobile ? '100%' : '100%' }}
                    >
                        添加
                    </Button>
                    <Button
                        danger
                        onClick={() => {
                            setLocalVisible(false)
                            onClose()
                        }}
                        style={{ minWidth: isMobile ? '100%' : '100%' }}
                    >
                        关闭
                    </Button>
                </div>
            </div>
        )
    }

    return (
        localVisible ? (
            <Card
                title={cardTitle}
                bordered={true}
                hoverable={true}
                style={{
                    position: 'absolute',
                    zIndex: 999,
                    width: isMobile ? '100vw' : '600px',
                    maxWidth: '100%',
                    left: isMobile ? 0 : undefined,
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                extra={addTag()}
                bodyStyle={{ padding: isMobile ? 12 : 24 }}
            >
                <div style={{
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    paddingRight: 8
                }}>
                    {tagModified()}
                </div>
            </Card>
        ) : null
    );
}
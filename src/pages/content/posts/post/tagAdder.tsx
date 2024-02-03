import React, { useEffect, useState } from "react"
import { Button, Card, Input, Space, Checkbox, Tag } from "@arco-design/web-react"
import { Tooltip } from "bizcharts"

const CheckboxGroup = Checkbox.Group

export function TagAdder({ existTags, tags, onchange, onClose, visible, cardTitle, placeholder }) {

    const [tagInputValue, setTagInputValue] = useState('')
    const [localVisible, setLocalVisible] = useState(visible)

    useEffect(() => {
        // 当外部的 visible 发生变化时，同步更新本地的状态
        setLocalVisible(visible);
    }, [visible]);

    const addNewTag = (v) => {
        const inputValue = v.target.value
        if (inputValue.trim() == '') {
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
        return (<CheckboxGroup value={tags} onChange={(v, e) => {
            onchange(v)
        }} >
            {
                options.map((item, i) => {
                    return (
                        <Checkbox key={i} value={item}>
                            {({ checked }) => {
                                return (
                                    <Tag key={i} color={checked ? 'purple' : ''} style={{ marginBottom: 5 }}>
                                        {item}
                                    </Tag>
                                );
                            }}
                        </Checkbox>
                    );
                })
            }
        </CheckboxGroup>)
    }

    function addTag() {
        return (
            <Space>
                <Input style={{ width: 350 }} placeholder={placeholder} value={tagInputValue} onChange={(v) => setTagInputValue(v)} onPressEnter={(v) => { addNewTag(v) }} />
                <Button type="text" color="#ddd" onClick={() => {
                    setLocalVisible(!visible)
                    onClose()
                }}>X</Button>
            </Space>
        )
    }

    return (
        localVisible && <Card title={cardTitle} bordered={true} hoverable={true} style={{ position: 'absolute', top: '100%', zIndex: 100, width: '100%' }} extra={addTag()}>
            {tagModified()}
        </Card>
    )
}
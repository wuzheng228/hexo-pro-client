import { BarsOutlined, DeleteOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Col, message, Popconfirm, Row } from "antd";
import ButtonGroup from "antd/es/button/button-group";
import React, { useState } from "react";
import cs from 'classnames';

export default function EditorHeader({ initTitle, isPage, isDraft, popTitle, popDes, className = '', handleChangeTitle, handleSettingClick, handleRemoveSource, handlePublish }) {

    return (
        <Row style={{ width: "100%", borderBottomColor: 'black', borderBottom: '1px solid gray', backgroundColor: 'white' }} align='middle' className={cs("editor-header", className)}>
            {/* 博客名称输入 */}
            <Col span={12}>
                <input
                    style={{ width: "100%", height: 60, border: 'none', outline: 'none', boxSizing: 'border-box', fontSize: 28, fontWeight: 500, marginLeft: 10 }}
                    value={initTitle}
                    onChange={(v) => {
                        handleChangeTitle(v.target.value)
                    }}
                />
            </Col>
            {/* 博客发布按钮 */}
            <Col span={2} offset={9} style={{ alignItems: 'center', justifyContent: 'center', paddingLeft: 50 }}>
                <ButtonGroup>
                    <Button type='default' icon={<SettingOutlined />} onClick={(e) => handleSettingClick(e)} />
                    {
                        isDraft && !isPage ?
                            <Button type='primary' onClick={handlePublish}>发布博客</Button>
                            : <Button type='default' onClick={handlePublish}>转为草稿</Button>
                    }
                    <Popconfirm
                        title={popTitle}
                        description={popDes}
                        onConfirm={() => {
                            message.info({
                                content: 'ok',
                            });
                            handleRemoveSource()
                        }}
                        onCancel={() => {
                            message.error({
                                content: 'cancel',
                            });
                        }}
                    >
                        <Button type='default' icon={<DeleteOutlined />} />
                    </Popconfirm>
                </ButtonGroup>
            </Col>
        </Row>
    )
}
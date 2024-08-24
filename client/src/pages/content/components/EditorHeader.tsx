import { BarsOutlined, DeleteOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Col, message, Popconfirm, Row } from "antd";
import ButtonGroup from "antd/es/button/button-group";
import React, { useContext, useState } from "react";
import cs from 'classnames';
import IconPin from "@/assets/pin.svg"
import IconPinFill from "@/assets/pin-fill.svg"
import { useDispatch, useSelector } from "react-redux";
import { GlobalContext } from "@/context";
import useLocale from "@/hooks/useLocale";

export default function EditorHeader({ initTitle, isPage, isDraft, popTitle, popDes, className = '', handleChangeTitle, handleSettingClick, handleRemoveSource, handlePublish, handleUnpublish }) {

    const [isPin, setIsPin] = useState(true)
    const dispatch = useDispatch();
    const locale = useLocale();

    const themeStyles = {
        light: {
            backgroundColor: "white",
            borderBottomColor: 'gray',
            inputBackgroundColor: "white",
            inputColor: "black",
            buttonBackgroundColor: "white",
            buttonColor: "black"
        },
        dark: {
            backgroundColor: "#2e2e2e",
            borderBottomColor: '#555',
            inputBackgroundColor: "#2e2e2e",
            inputColor: "white",
            buttonBackgroundColor: "#555",
            buttonColor: "white"
        }
    };

    const { theme } = useContext(GlobalContext)

    const currentTheme = themeStyles[theme];

    const handlePinClick = () => {
        setIsPin(!isPin)
        dispatch({
            type: 'toggle-vditor-toolbar-pin',
            payload: {
                vditorToolbarPin: isPin
            },
        })
        return () => {
            setIsPin(false)
            dispatch({
                type: 'toggle-vditor-toolbar-pin',
                payload: {
                    vditorToolbarPin: false
                },
            })
        }
    }

    return (
        <Row style={{
            width: "100%", borderBottomColor: currentTheme.borderBottomColor, borderBottom: '1px solid',
            backgroundColor: currentTheme.backgroundColor,
        }} align='middle' className={cs("editor-header", className)}>
            {/* 博客名称输入 */}
            <Col span={12}>
                <input
                    style={{
                        width: "100%", height: 60, border: 'none', outline: 'none', boxSizing: 'border-box', fontSize: 28, fontWeight: 500, marginLeft: 10,
                        backgroundColor: currentTheme.inputBackgroundColor,
                        color: currentTheme.inputColor
                    }}
                    value={initTitle}
                    onChange={(v) => {
                        handleChangeTitle(v.target.value)
                    }}
                />
            </Col>
            {/* 博客发布按钮 */}
            <Col span={2} offset={9} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 50 }}>
                <ButtonGroup>
                    <Button type='default' icon={isPin ? <IconPinFill /> : <IconPin />} onClick={handlePinClick} style={{ backgroundColor: currentTheme.buttonBackgroundColor, color: currentTheme.buttonColor }} />
                    <Button type='default' icon={<SettingOutlined />} onClick={(e) => handleSettingClick(e)} style={{ borderRight: 'none', backgroundColor: currentTheme.buttonBackgroundColor, color: currentTheme.buttonColor }} />
                    {
                        !isPage && (isDraft ?
                            <Button type='primary' onClick={handlePublish} style={{ zIndex: 2, border: '1px dashed', borderColor: 'gray', backgroundColor: currentTheme.buttonBackgroundColor, color: currentTheme.buttonColor }}>{locale['editor.header.publish']}</Button>
                            : <Button type='default' onClick={handleUnpublish} style={{ backgroundColor: currentTheme.buttonBackgroundColor, color: currentTheme.buttonColor }}>{locale['editor.header.unpublish']}</Button>
                        )
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
                        <Button type='default' icon={<DeleteOutlined />} style={{ borderLeft: 'none', backgroundColor: currentTheme.buttonBackgroundColor, color: currentTheme.buttonColor }} />
                    </Popconfirm>
                </ButtonGroup>
            </Col>
        </Row>
    )
}

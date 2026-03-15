import { DeleteOutlined, SettingOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons"
import { Button, Col, Popconfirm, Row, message } from "antd"
import ButtonGroup from "antd/es/button/button-group"
import React, { useContext, useState } from "react"
import cs from 'classnames'
import IconPin from "@/assets/pin.svg"
import IconPinFill from "@/assets/pin-fill.svg"
import { useDispatch } from "react-redux"
import { GlobalContext } from "@/context"
import useLocale from "@/hooks/useLocale"
import useDeviceDetect from "@/hooks/useDeviceDetect"
import { openDesktopLink } from "@/utils/desktopUtils"
import IconLink from "@/assets/link.svg"
import IconLinkLight from "@/assets/linkLight.svg"
import IconAI from "@/assets/ai.svg"

export default function EditorHeader({ initTitle, isPage, isDraft, popTitle, popDes, className = '', permalink = undefined, handleChangeTitle, handleTitleBlur = undefined, handleSettingClick, handleRemoveSource, handlePublish, handleUnpublish, handleAIClick = undefined }) {

    const [isPin, setIsPin] = useState(true)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [tempTitle, setTempTitle] = useState('')
    const dispatch = useDispatch()
    const locale = useLocale()
    const { isMobile } = useDeviceDetect()

    const themeStyles = {
        light: {
            backgroundColor: "white",
            borderBottomColor: '#edf1f7',
            inputBackgroundColor: "white",
            inputColor: "#1f2430",
            buttonBackgroundColor: "white",
            buttonColor: "#1f2430"
        },
        dark: {
            backgroundColor: "#161a22",
            borderBottomColor: '#2f3646',
            inputBackgroundColor: "#161a22",
            inputColor: "#e6ebf5",
            buttonBackgroundColor: "#1c2230",
            buttonColor: "#e6ebf5"
        }
    }

    const { theme } = useContext(GlobalContext)
    const currentTheme = themeStyles[theme]

    // 响应式样式配置
    const responsiveHeaderStyles: React.CSSProperties | null = isMobile ? {
        flexWrap: 'wrap',
    } : null

    const responsiveInputStyles = isMobile ? {
        fontSize: 20,
        marginLeft: 6,
        marginRight: 6,
        minHeight: 44
    } : {
        fontSize: 20,
        minHeight: 42,
    }

    const responsiveButtonColStyles = isMobile ? {
        marginTop: 6,
        whiteSpace: 'nowrap'
    } : {
        minHeight: 44,
    }

    const buttonBaseStyle: React.CSSProperties = {
        height: 34,
        borderRadius: 8,
        borderColor: theme === 'dark' ? '#2f3646' : '#d9dfec',
        backgroundColor: currentTheme.buttonBackgroundColor,
        color: currentTheme.buttonColor,
    }

    const handlePinClick = () => {
        const newPinState = !isPin
        setIsPin(newPinState)
        dispatch({
            type: 'toggle-vditor-toolbar-pin',
            payload: {
                vditorToolbarPin: newPinState
            },
        })
    }

    // 开始编辑标题
    const startEditTitle = () => {
        setTempTitle(initTitle)
        setIsEditingTitle(true)
    }

    // 保存标题
    const saveTitle = () => {
        if (tempTitle.trim() === '') {
            message.error('标题不能为空')
            return
        }

        handleChangeTitle(tempTitle) // 添加这行，确保父组件的标题状态更新
        setIsEditingTitle(false)
    }

    // 取消编辑
    const cancelEditTitle = () => {
        setTempTitle(initTitle)
        setIsEditingTitle(false)
    }

    // 处理标题输入变化
    const handleTitleChange = (value) => {
        setTempTitle(value)
    }

    return (
        <Row style={{
            width: "100%",
            borderBottomColor: currentTheme.borderBottomColor,
            borderBottom: '1px solid',
            backgroundColor: currentTheme.backgroundColor,
            padding: isMobile ? '8px 10px' : '10px 14px',
            ...responsiveHeaderStyles
        }} align='middle' className={cs("editor-header", className)}>
            {/* 标题输入 */}
            <Col xs={23} md={16} lg={14}>
                {isEditingTitle ? (
                    <input
                        style={{
                            width: "100%",
                            border: 'none',
                            outline: 'none',
                            boxSizing: 'border-box',
                            fontWeight: 600,
                            borderRadius: 8,
                            backgroundColor: currentTheme.inputBackgroundColor,
                            color: currentTheme.inputColor,
                            lineHeight: '1.4',
                            padding: isMobile ? '4px 6px' : '4px 8px',
                            ...responsiveInputStyles
                        }}
                        value={tempTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        onBlur={handleTitleBlur || undefined}
                        autoFocus
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            boxSizing: 'border-box',
                            fontWeight: 600,
                            color: currentTheme.inputColor,
                            lineHeight: '1.4',
                            padding: isMobile ? '4px 6px' : '4px 8px',
                            ...responsiveInputStyles
                        }}
                    >
                        {initTitle}
                    </div>
                )}
            </Col>

            {/* 操作按钮组 */}
            <Col
                xs={23}
                md={8}
                lg={10}
                offset={isMobile ? 0 : 0}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    ...responsiveButtonColStyles
                }}>
                <ButtonGroup style={{
                    width: 'auto',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    flexWrap: isMobile ? 'nowrap' : 'wrap',
                    overflowX: isMobile ? 'auto' : 'visible'
                }}>
                    {/* 标题编辑按钮 */}
                    {isEditingTitle ? (
                        <>
                            <Button
                                type='primary'
                                icon={<SaveOutlined />}
                                onClick={saveTitle}
                                style={{
                                    ...buttonBaseStyle
                                }}
                            >
                                {isMobile ? '' : locale["editor.header.edit.title.save"]}
                            </Button>
                            <Button
                                type='default'
                                onClick={cancelEditTitle}
                                style={{
                                    ...buttonBaseStyle
                                }}
                            >
                                {isMobile ? locale["editor.header.edit.title.cancel"] : locale["editor.header.edit.title.cancel"]}
                            </Button>
                        </>
                    ) : (
                        <Button
                            type='default'
                            icon={<EditOutlined />}
                            onClick={startEditTitle}
                            style={{ ...buttonBaseStyle }}
                        >
                            {isMobile ? '' : locale["editor.header.edit.title"]}
                        </Button>
                    )}

                    {/* 移动端优先显示主要操作 */}
                    {!isMobile && (
                        <>

                        </>
                    )}
                    {
                        (isPage || (!isPage && !isDraft)) && (
                            <Button
                                type="default"
                                style={{ ...buttonBaseStyle }}
                                onClick={(event) => {
                                    event.stopPropagation()
                                    openDesktopLink(permalink)
                                }}
                                icon={theme === 'dark' ? <IconLinkLight /> : <IconLink />}
                            >
                            </Button>
                        )
                    }
                    <Button type='default' icon={isPin ? <IconPinFill /> : <IconPin />}
                        onClick={handlePinClick}
                        style={{ ...buttonBaseStyle }} />
                    {handleAIClick && (
                        <Button
                            type='default'
                            icon={theme === 'dark' ? <IconAI /> : <IconAI />}
                            onClick={handleAIClick}
                            style={{ ...buttonBaseStyle }}
                            title={locale['ai.title'] || 'AI 助手'}
                        />
                    )}
                    <Button type='default' icon={<SettingOutlined />}
                        onClick={(e) => handleSettingClick(e)}
                        style={{ ...buttonBaseStyle }} />
                    {!isPage && (isDraft ?
                        <Button type='primary'
                            onClick={handlePublish}
                            style={{
                                ...buttonBaseStyle,
                                borderStyle: 'solid',
                                borderColor: '#1a66ff',
                                backgroundColor: '#1a66ff',
                                color: '#ffffff',
                            }}>
                            {isMobile ? '发布' : locale['editor.header.publish']}
                        </Button>
                        : <Button type='default'
                            onClick={handleUnpublish}
                            style={{
                                ...buttonBaseStyle,
                            }}>
                            {locale['editor.header.unpublish']}
                        </Button>
                    )}

                    <Popconfirm
                        title={popTitle}
                        description={popDes}
                        onConfirm={() => {
                            handleRemoveSource()
                        }}
                    >
                        <Button
                            type='default'
                            icon={<DeleteOutlined />}
                            style={{
                                ...buttonBaseStyle,
                                minWidth: isMobile ? '40px' : undefined,
                            }} />
                    </Popconfirm>
                </ButtonGroup>
            </Col>
        </Row>
    )
}

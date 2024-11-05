import React, { useContext, useEffect, useState } from 'react'

import Vditor from 'vditor'
import "vditor/src/assets/less/index.less"
import "./style/index.less"
import service from '@/utils/api'
import { GlobalContext } from '@/context'
import useLocale from '@/hooks/useLocale'

interface HexoProVditorProps {
    initValue: string;
    isPinToolbar: boolean;
    handleChangeContent: (content: string) => void;
    handleUploadingImage: (isUploading: boolean) => void;
}

export default function HexoProVditor({ initValue, isPinToolbar, handleChangeContent, handleUploadingImage }: HexoProVditorProps) {
    // 'emoji', 'headings', 'bold', 'italic', 'strike', '|', 'line', 'quote', 'list', 'ordered-list', 'check', 'outdent', 'indent', 'code', 'inline-code', 'insert-after', 'insert-before', 'undo', 'redo', 'upload', 'link', 'table', 'edit-mode', 'preview', 'fullscreen', 'outline', 'export'

    const t = useLocale()

    function uploadImage(image, filename) {
        const promise = new Promise((f, r) => {
            service.post('/hexopro/api/images/upload', { data: image, filename: filename }).then(res => {
                f(res.data)
            }).catch(err => {
                r(err)
            })
        })
        return promise
    }

    const [vd, setVd] = useState(undefined)
    const [isUploadingImage, setIsUPloadingImage] = useState(false)

    const [isEditorFocus, setIsEditorFocus] = useState(false)


    const { theme, lang } = useContext(GlobalContext)

    function getLocale() {
        if (lang === 'zh-CN') {
            return 'zh_CN'
        } else {
            return 'en_US'
        }
    }

    useEffect(() => {
        handleUploadingImage(isUploadingImage)
    }, [isUploadingImage, handleUploadingImage])

    useEffect(() => {
        // console.log('isPinToolbar', isPinToolbar)
        if (vd) {
            // console.log('isPinToolbar111', isPinToolbar)
            vd.updateToolbarConfig({
                pin: isPinToolbar
            })
        }
    }, [vd, isPinToolbar])

    useEffect(() => {
        // console.log('theme', theme)
        if (vd) {
            // console.log('theme111', theme)
            vd.setTheme(theme === 'dark' ? 'dark' : 'classic', theme === 'dark' ? 'dark' : 'light', theme === 'dark' ? 'native' : 'xcode')
        }
    }, [vd, theme])

    useEffect(() => {
        if (vd) {
            const toolbar = document.querySelector('.vditor-toolbar') as HTMLElement
            const vditorElement = document.getElementById('vditor') as HTMLElement
            if (toolbar && vditorElement) {
                toolbar.style.width = `${vditorElement.clientWidth}px !important`
            }

            const resizeHandler = () => {
                if (toolbar && vditorElement) {
                    toolbar.style.width = `${vditorElement.clientWidth}px`
                }
            }

            window.addEventListener('resize', resizeHandler)

            // 返回销毁逻辑
            return () => {
                window.removeEventListener('resize', resizeHandler)
            }
        }
    }, [vd])

    useEffect(() => {
        const vditor = new Vditor('vditor', {
            keydown(event) {
                if (event.shiftKey && event.key === 'Tab') {
                    // 阻止默认行为
                    event.preventDefault()
                    // 去除前方的空格如果前方大于4个空格则最多删除4个空格
                    const selection = window.getSelection()
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0)
                        const startContainer = range.startContainer
                        const parentElement = startContainer.parentElement
                        if (parentElement && (parentElement.tagName === 'P' || parentElement.tagName === 'SPAN')) {
                            const currentContent = parentElement.textContent
                            const cursorPosition = range.startOffset
                            console.log('parentElement', currentContent.slice(cursorPosition - 24, cursorPosition))
                            console.log('parentElement', cursorPosition, cursorPosition - 24)
                            if (currentContent.slice(cursorPosition - 24, cursorPosition) === '&nbsp;&nbsp;&nbsp;&nbsp;') {
                                const newContent = currentContent.slice(0, cursorPosition - 24) + currentContent.slice(cursorPosition)
                                parentElement.textContent = newContent
                                // 保存光标位置
                                const newCursorPosition = cursorPosition - 24
                                // 重新选中编辑器并恢复光标位置
                                handleChangeContent(vditor.getValue())
                                range.setStart(parentElement.firstChild, newCursorPosition) // 设置新的光标位置
                                range.collapse(true)
                                selection.removeAllRanges() // 清除所有选区
                                selection.addRange(range) // 重新选中编辑器并恢复光标位置
                            }
                        }
                    }
                    return
                }
                if (!event.shiftKey && event.key === 'Tab') {
                    event.preventDefault() // 阻止默认行为

                    const selection = window.getSelection()

                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0)
                        const startContainer = range.startContainer
                        const parentElement = startContainer.parentElement
                        console.log('parentElement', parentElement.tagName)

                        if (parentElement && (parentElement.tagName === 'P' || parentElement.tagName === 'SPAN')) {
                            // 插入4个空格
                            const spaces = '&nbsp;&nbsp;&nbsp;&nbsp;'
                            const currentContent = parentElement.textContent // 使用textContent而不是innerHTML
                            const cursorPosition = range.startOffset

                            // 插入空格
                            const newContent = currentContent.slice(0, cursorPosition) + spaces + currentContent.slice(cursorPosition)
                            parentElement.textContent = newContent

                            // 保存光标位置
                            const newCursorPosition = cursorPosition + 24

                            // 重新选中编辑器并恢复光标位置
                            handleChangeContent(vditor.getValue())
                            range.setStart(parentElement.firstChild, newCursorPosition) // 设置新的光标位置
                            range.collapse(true)

                            selection.removeAllRanges() // 清除所有选区
                            selection.addRange(range) // 重新选中编辑器并恢复光标位置
                        }
                    }
                }
            },
            fullscreen: {
                index: 100
            },
            lang: getLocale(),
            theme: 'classic',
            height: '100%',
            width: '100%',
            toolbarConfig: {
                pin: false // 确保工具栏固定
            },
            after: () => {
                // 设置初始值
                vditor.setValue(initValue)
                // 固定toolbar
                const toolbar = document.querySelector('.vditor-toolbar') as HTMLElement
                const vditorElement = document.getElementById('vditor') as HTMLElement
                if (toolbar && vditorElement) {
                    toolbar.style.width = `${vditorElement.clientWidth}px !important`
                }

                const content = document.querySelector('vditor-content') as HTMLElement
                const editorHeader = document.querySelector('.editor-header') as HTMLElement

                if (content && toolbar && editorHeader) {
                    // console.log('走到这里了')
                    content.style.cssText = `margin-top: ${toolbar.clientHeight + editorHeader.clientHeight}px !important;`
                }

                window.addEventListener('resize', () => {
                    if (toolbar && vditorElement) {
                        toolbar.style.width = `${vditorElement.clientWidth}px`
                        if (content) {
                            content.style.marginTop = `${toolbar.clientHeight + editorHeader.clientHeight}px !important;`
                        }
                    }
                })
                setVd(vditor)
            },
            focus: (v: string) => {
                setIsEditorFocus(true)
            },
            blur: (v) => {
                setIsEditorFocus(false)
            },
            upload: {
                multiple: true,
                handler: (files: File[]): Promise<string | null> => {
                    // 这里可以添加处理文件上传的逻辑
                    // console.log('files', files)

                    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp']

                    const filteredFiles = files.filter(file => allowedTypes.includes(file.type))
                    for (const file of files) {
                        if (!allowedTypes.includes(file.type)) {
                            vditor.tip(`${t['vditor.upload.invalidFileType']}: ${file.name}`, 2000)
                        }
                    }

                    for (const file of filteredFiles) {
                        setIsUPloadingImage(true)
                        const reader = new FileReader()
                        reader.onload = (event) => {
                            const filename = file.name
                            uploadImage(event.target.result, filename).then((res: { src: string, msg: string }) => {
                                // console.log('update=> ', res)
                                res['code'] = 0

                                setTimeout(() => {
                                    const currentValue = vditor.getValue()
                                    const cursorPosition = vditor.getCursorPosition()
                                    if (isEditorFocus) {
                                        vditor.setValue(currentValue + `\n![alt text](${res.src})`)
                                    } else {
                                        vditor.insertValue(`\n![alt text](${res.src})`)
                                    }
                                    // 重新渲染编辑器内容（如果需要）
                                    vditor.tip(`${t['vditor.upload.success']}: ${filename}`, 3000)
                                }, 600)
                                return null
                            }).catch((err) => {
                                vditor.tip(`${t['vditor.upload.error']}: ${err.message}`, 3000)
                                return err
                            }).finally(() => {
                                setIsUPloadingImage(false)
                            })
                        }
                        reader.readAsDataURL(file)
                    }
                    return null // 确保函数返回一个值
                }
            },
            input: (_) => {
                handleChangeContent(vditor.getValue())
            },
            toolbar: [
                // {
                //     name: 'code-theme'
                // },
                // {
                //     name: 'content-theme'
                // },
                {
                    name: 'emoji'
                },
                {
                    name: 'headings'
                },
                {
                    name: 'bold'
                },
                {
                    name: 'italic'
                },
                {
                    name: 'strike'
                },
                {
                    name: 'line'
                },
                {
                    name: 'quote'
                },
                {
                    name: 'list'
                },
                {
                    name: 'ordered-list'
                },
                {
                    name: 'check'
                },
                {
                    name: 'outdent'
                },
                {
                    name: 'indent'
                },
                {
                    name: 'code',
                    hotkey: 'Ctrl-E'
                },
                {
                    name: 'inline-code'
                },
                {
                    name: 'insert-after'
                },
                {
                    name: 'insert-before'
                },
                {
                    name: 'undo'
                },
                {
                    name: 'redo'
                },
                {
                    name: 'upload'
                },
                {
                    name: 'link'
                },
                {
                    name: 'table'
                },
                {
                    name: 'edit-mode',
                },
                {
                    name: 'preview',
                    className: 'toolbar-right'
                },
                {
                    name: 'fullscreen',
                    className: 'toolbar-right',
                    click() {
                        const toolbar = document.querySelector('.vditor-toolbar') as HTMLElement
                        const vditorElement = document.getElementById('vditor') as HTMLElement
                        if (toolbar && vditorElement) {
                            toolbar.style.width = `${vditorElement.clientWidth}px`
                        }
                    }
                },
                {
                    name: 'outline',
                    className: 'toolbar-right'
                },
                {
                    name: 'export',
                    className: 'toolbar-right'
                }
            ]
        })
        return () => {
            vd?.destroy()
            setVd(undefined)
        }
    }, [initValue, lang])

    return (
        <div id='vditorWapper' style={{ width: '100%', height: '100%', flex: 1, borderRadius: '0px' }}>
            <div
                style={{ width: '100%', height: '100%' }}
                id='vditor'
                className='vditor'>
            </div>
        </div >

    )
}
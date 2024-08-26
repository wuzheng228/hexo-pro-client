import React, { useContext, useEffect, useState } from 'react'

import Vditor from 'vditor'
import "vditor/src/assets/less/index.less"
import "./style/index.less"
import service from '@/utils/api'
import { GlobalContext } from '@/context'
import useLocale from '@/hooks/useLocale'

export default function HexoProVditor({ initValue, isPinToolbar, handleChangeContent, handleUploadingImage }) {
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
        console.log('isPinToolbar', isPinToolbar)
        if (vd) {
            console.log('isPinToolbar111', isPinToolbar)
            vd.updateToolbarConfig({
                pin: isPinToolbar
            })
        }
    }, [vd, isPinToolbar])

    useEffect(() => {
        console.log('theme', theme)
        if (vd) {
            console.log('theme111', theme)
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
                    console.log('走到这里了')
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
                error: (err: any) => {
                    console.log('err', err)
                },
                validate: (files) => {
                    console.log('validate', files)
                    return true
                },
                format: (files: File[], responseText: string): string => {
                    // 这里可以添加处理文件格式化的逻辑
                    console.log('format', files)
                    return responseText
                },
                file: (files: File[]): File[] | Promise<File[]> => {
                    console.log('file', files)
                    return null
                },
                handler: (files: File[]): Promise<string | null> => {
                    // 这里可以添加处理文件上传的逻辑
                    console.log('files', files)

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
                                console.log('update=> ', res)
                                res['code'] = 0

                                setTimeout(() => {
                                    const currentValue = vditor.getValue()
                                    const cursorPosition = vditor.getCursorPosition()
                                    console.log('cursorPosition', cursorPosition)
                                    if (isEditorFocus) {
                                        vditor.setValue(currentValue + `\n![alt text](${res.src})`)
                                    } else {
                                        vditor.insertValue(`\n![alt text](${res.src})`)
                                    }
                                    // 重新渲染编辑器内容（如果需要）
                                    vditor.tip(`${t['vditor.upload.success']}: ${filename}`, 3000)
                                }, 300)
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
            input: (v) => {
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
                    name: 'code'
                },
                {
                    name: 'inline-code'
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
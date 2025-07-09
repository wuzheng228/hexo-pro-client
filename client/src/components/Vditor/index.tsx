import React, { useContext, useEffect, useState } from 'react'

import Vditor from 'vditor'
import "vditor/src/assets/less/index.less"
import "./style/index.less"
import service from '@/utils/api'
import { GlobalContext } from '@/context'
import useLocale from '@/hooks/useLocale'
// 移除未使用的导入
// import { use } from 'marked'
// import { useDeviceDetect } from 'use-device-detection'
import useDeviceDetect from '@/hooks/useDeviceDetect'
import { Modal, Pagination, Image, Spin, Empty, Select, Row, Col, Card, Typography, Upload, Input, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

const { Text } = Typography
const { Option } = Select

interface HexoProVditorProps {
    initValue: string;
    isPinToolbar: boolean;
    handleChangeContent: (content: string) => void;
    handleUploadingImage: (isUploading: boolean) => void;
}

// 添加上传结果接口
interface UploadResult {
    url?: string;
    path?: string;
    src?: string;
    msg?: string;
    code?: number;
}

// 图片项接口
interface ImageItem {
    name: string;
    path: string;
    url: string;
    size: number;
    lastModified: string;
}

// 文件夹数据接口
interface FolderData {
    images: ImageItem[];
    folders: string[];
    total: number;
    page: number;
    pageSize: number;
}

export default function HexoProVditor({ initValue, isPinToolbar, handleChangeContent, handleUploadingImage }: HexoProVditorProps) {
    // 'emoji', 'headings', 'bold', 'italic', 'strike', '|', 'line', 'quote', 'list', 'ordered-list', 'check', 'outdent', 'indent', 'code', 'inline-code', 'insert-after', 'insert-before', 'undo', 'redo', 'upload', 'link', 'table', 'edit-mode', 'preview', 'fullscreen', 'outline', 'export'
    const { isMobile } = useDeviceDetect() // 添加设备检测
    const [imagePickerVisible, setImagePickerVisible] = useState(false)
    const [imageData, setImageData] = useState<FolderData>({
        images: [],
        folders: [],
        total: 0,
        page: 1,
        pageSize: 12
    })
    const [currentImagePage, setCurrentImagePage] = useState(1)
    const [imagePageSize, setImagePageSize] = useState(isMobile ? 8 : 12)
    const [currentImageFolder, setCurrentImageFolder] = useState('')
    const [loadingImages, setLoadingImages] = useState(false)
    // 添加上传图片相关状态
    const [uploadModalVisible, setUploadModalVisible] = useState(false)
    const [uploadFolder, setUploadFolder] = useState('')
    const [uploadFileName, setUploadFileName] = useState('')


    const t = useLocale()

    // 修改上传图片函数，添加文件夹参数
    function uploadImage(image, filename, folder = '') {
        const promise = new Promise((f, r) => {
            service.post('/hexopro/api/images/upload', {
                data: image,
                filename: filename,
                folder: folder
            }).then(res => {
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

    // 从localStorage读取编辑器模式设置
    const [editorMode, setEditorMode] = useState(() => {
        return localStorage.getItem('hexoProEditorMode') || 'ir'
    })

    // 监听localStorage中编辑器模式的变化
    useEffect(() => {
        const handleStorageChange = () => {
            const newMode = localStorage.getItem('hexoProEditorMode') || 'ir'
            if (newMode !== editorMode) {
                setEditorMode(newMode)
            }
        }

        // 监听storage事件（其他窗口的localStorage变化）
        window.addEventListener('storage', handleStorageChange)

        // 每秒检查一次当前窗口的localStorage变化
        const interval = setInterval(handleStorageChange, 1000)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            clearInterval(interval)
        }
    }, [editorMode])

    const { theme, lang } = useContext(GlobalContext)


    function getLocale() {
        if (lang === 'zh-CN') {
            return 'zh_CN'
        } else {
            return 'en_US'
        }
    }

    // 获取图片列表
    const fetchImages = async () => {
        setLoadingImages(true)
        try {
            const res = await service.get('/hexopro/api/images/list', {
                params: {
                    page: currentImagePage,
                    pageSize: imagePageSize,
                    folder: currentImageFolder
                }
            })
            setImageData(res.data)
        } catch (error) {
            console.error('获取图片列表失败', error)
        } finally {
            setLoadingImages(false)
        }
    }

    const fetchFolders = async () => {
        try {
            const res = await service.get('/hexopro/api/images/list', {
                params: {
                    page: 1,
                    pageSize: 1
                }
            })
            if (res.data && res.data.folders) {
                setImageData(prevData => ({
                    ...prevData,
                    folders: res.data.folders
                }))
            }
        } catch (error) {
            console.error('获取文件夹列表失败', error)
        }
    }


    // 处理自定义上传
    const handleCustomUpload = async (file: File) => {
        if (!file) return

        setIsUPloadingImage(true)
        const reader = new FileReader()
        reader.readAsDataURL(file)

        reader.onload = async (event) => {
            try {
                // 处理SVG文件名问题
                let filename = uploadFileName || file.name
                // 确保SVG文件有正确的扩展名
                if (file.type === 'image/svg+xml' && !filename.toLowerCase().endsWith('.svg')) {
                    filename = filename.replace(/\.[^/.]+$/, '') + '.svg'
                }

                const result = await uploadImage(event.target.result, filename, uploadFolder) as UploadResult

                console.log('result', result)

                if (vd && result) {
                    // 对图片 URL 进行编码处理
                    const encodedSrc = encodeURI(result.url)
                    vd.insertValue(`\n![${filename}](${encodedSrc})\n`)
                    vd.tip(`${t['vditor.upload.success'] || '上传成功'}: ${filename}`, 3000)
                    // 强制编辑器重新渲染
                }

                setUploadModalVisible(false)
                setUploadFileName('')
            } catch (err) {
                vd?.tip(`${t['vditor.upload.error'] || '上传失败'}: ${err.message}`, 3000)
            } finally {
                setIsUPloadingImage(false)
                setTimeout(() => {
                    vd.setValue(vd.getValue())
                }, 600)
            }
        }
    }

    // 处理图片选择
    const handleSelectImage = (image: ImageItem) => {
        if (vd) {
            // 对图片 URL 进行编码处理
            const encodedUrl = encodeURI(image.path)
            vd.insertValue(`\n![${image.name}](${encodedUrl})\n`)
            setImagePickerVisible(false)
        }
    }

    // 处理页面变化
    const handleImagePageChange = (page: number, pageSize?: number) => {
        setCurrentImagePage(page)
        if (pageSize) setImagePageSize(pageSize)
    }

    // 处理文件夹变化
    const handleImageFolderChange = (folder: string) => {
        setCurrentImageFolder(folder)
        setCurrentImagePage(1)
    }

    // 格式化文件大小
    const formatFileSize = (size: number) => {
        if (size < 1024) {
            return `${size} B`
        } else if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(2)} KB`
        } else {
            return `${(size / 1024 / 1024).toFixed(2)} MB`
        }
    }

    useEffect(() => {
        if (uploadModalVisible) {
            fetchFolders()
        }
    }, [uploadModalVisible])


    // 当图片选择器打开时加载图片
    useEffect(() => {
        if (imagePickerVisible) {
            fetchImages()
        }
    }, [imagePickerVisible, currentImagePage, imagePageSize, currentImageFolder])

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

            // 根据pin状态添加/移除相应的类名，用于CSS样式控制
            const toolbar = document.querySelector('.vditor-toolbar') as HTMLElement
            if (toolbar) {
                if (isPinToolbar) {
                    toolbar.classList.add('vditor-toolbar--pin')
                } else {
                    toolbar.classList.remove('vditor-toolbar--pin')
                }
            }
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
        if (vd) {
            vd.setValue(initValue)
        }
    }, [vd, initValue])

    useEffect(() => {
        const vditor = new Vditor('vditor', {
            mode: editorMode as 'ir' | 'wysiwyg' | 'sv', // 设置编辑器模式
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
                index: 9999
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
                if (!initValue && initValue !== '') {
                    vditor.setValue(initValue)
                }
                // 固定toolbar
                const toolbar = document.querySelector('.vditor-toolbar') as HTMLElement
                const vditorElement = document.getElementById('vditor') as HTMLElement
                if (toolbar && vditorElement) {
                    toolbar.style.width = `${vditorElement.clientWidth}px !important`

                    // 为移动设备添加专用样式
                    if (isMobile) {
                        vditorElement.classList.add('vditor-mobile')
                        toolbar.classList.add('vditor-toolbar-mobile')

                        // 移动设备下优化工具栏布局
                        const toolbarItems = toolbar.querySelectorAll('.vditor-toolbar__item')
                        toolbarItems.forEach((item) => {
                            (item as HTMLElement).style.margin = '2px'
                        })
                    }
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
                url: '/api/upload/disabled', // 设置一个不存在的URL，禁用原生上传
                multiple: true,
                handler: (files: File[]): Promise<string | null> => {
                    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml']

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
                            // 处理SVG文件名问题
                            let filename = file.name
                            // 确保SVG文件有正确的扩展名
                            if (file.type === 'image/svg+xml' && !filename.toLowerCase().endsWith('.svg')) {
                                filename = filename.replace(/\.[^/.]+$/, '') + '.svg'
                            }

                            // 粘贴图片默认上传到根目录（不指定文件夹）
                            uploadImage(event.target.result, filename).then((res: UploadResult) => {
                                res['code'] = 0

                                setTimeout(() => {
                                    const currentValue = vditor.getValue()
                                    // 对图片 URL 进行编码处理
                                    const encodedSrc = encodeURI(res.path || res.src)
                                    if (isEditorFocus) {
                                        vditor.setValue(currentValue + `\n![${filename}](${encodedSrc})`)
                                    } else {
                                        vditor.insertValue(`\n![${filename}](${encodedSrc})`)
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
            toolbar: isMobile ? [
                // 移动设备上使用简化的工具栏
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
                    name: 'code',
                    hotkey: 'Ctrl-E'
                },
                {
                    name: 'custom-upload', // 修改名称，避免与原生upload冲突
                    tip: t['vditor.upload'] || '上传',
                    icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M512 928c-28.928 0-52.416-23.488-52.416-52.416V547.072H336.96c-18.944 0-36.096-10.112-45.376-26.56-9.28-16.448-8.544-36.224 1.92-52.032L468.48 218.624C477.952 203.84 494.88 195.584 512 195.584c17.12 0 34.048 8.256 43.52 23.04l174.976 249.856c10.464 15.808 11.2 35.584 1.92 52.032-9.28 16.448-26.432 26.56-45.376 26.56H564.416v328.512c0 28.928-23.488 52.416-52.416 52.416z" fill="currentColor"></path></svg>',
                    click() {
                        // 点击上传按钮时打开上传模态框
                        setUploadModalVisible(true)
                    }
                },
                // 添加图床选择按钮
                {
                    name: 'select-image',
                    tip: t['vditor.selectImage'] || '从图床选择',
                    icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M896 0H128C57.6 0 0 57.6 0 128v768c0 70.4 57.6 128 128 128h768c70.4 0 128-57.6 128-128V128c0-70.4-57.6-128-128-128zm0 896H128V128h768v768z"></path><path d="M288 384c53 0 96-43 96-96s-43-96-96-96-96 43-96 96 43 96 96 96zm0-128c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zM704 576l-128-128-256 256-64-64L128 768h768z"></path></svg>',
                    click() {
                        setImagePickerVisible(true)
                    }
                },
                {
                    name: 'preview',
                    className: 'toolbar-right'
                }
            ] : [
                // 桌面设备使用完整工具栏
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
                    name: 'custom-upload', // 修改名称，避免与原生upload冲突
                    tip: t['vditor.upload'] || '上传',
                    icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M512 928c-28.928 0-52.416-23.488-52.416-52.416V547.072H336.96c-18.944 0-36.096-10.112-45.376-26.56-9.28-16.448-8.544-36.224 1.92-52.032L468.48 218.624C477.952 203.84 494.88 195.584 512 195.584c17.12 0 34.048 8.256 43.52 23.04l174.976 249.856c10.464 15.808 11.2 35.584 1.92 52.032-9.28 16.448-26.432 26.56-45.376 26.56H564.416v328.512c0 28.928-23.488 52.416-52.416 52.416z" fill="currentColor"></path></svg>',
                    click() {
                        // 点击上传按钮时打开上传模态框
                        setUploadModalVisible(true)
                    }
                },
                // 添加图床选择按钮
                {
                    name: 'select-image',
                    tip: t['vditor.selectImage'] || '从图床选择',
                    icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M896 0H128C57.6 0 0 57.6 0 128v768c0 70.4 57.6 128 128 128h768c70.4 0 128-57.6 128-128V128c0-70.4-57.6-128-128-128zm0 896H128V128h768v768z"></path><path d="M288 384c53 0 96-43 96-96s-43-96-96-96-96 43-96 96 43 96 96 96zm0-128c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zM704 576l-128-128-256 256-64-64L128 768h768z"></path></svg>',
                    click() {
                        setImagePickerVisible(true)
                    }
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
    }, [initValue, lang, isMobile, editorMode]) // 添加 editorMode 作为依赖

    return (
        <div id='vditorWapper' style={{ width: '100%', height: '100%', flex: 1, borderRadius: '0px' }}>
            <div
                style={{ width: '100%', height: '100%' }}
                id='vditor'
                className='vditor'>
            </div>

            {/* 图片选择模态框 */}
            <Modal
                title={t['vditor.selectImage'] || '从图床选择图片'}
                open={imagePickerVisible}
                onCancel={() => setImagePickerVisible(false)}
                footer={null}
                width={isMobile ? '95%' : 800}
                className="image-picker-modal"
            >
                <div className="image-picker-container">
                    <div className="folder-selector">
                        <Text strong>{t['content.images.currentFolder'] || '当前文件夹'}:</Text>
                        <Select
                            style={{ width: isMobile ? 200 : 300, marginLeft: 8 }}
                            value={currentImageFolder}
                            onChange={handleImageFolderChange}
                            placeholder={t['content.images.selectFolder'] || '选择文件夹'}
                        >
                            <Option value="">{t['content.images.rootFolder'] || '根目录'}</Option>
                            {imageData.folders.map(folder => (
                                <Option key={folder} value={folder}>{folder}</Option>
                            ))}
                        </Select>
                    </div>

                    <Spin spinning={loadingImages}>
                        {imageData.images.length > 0 ? (
                            <Row gutter={[16, 16]} className="image-grid">
                                {imageData.images.map(image => (
                                    <Col xs={12} sm={8} md={6} lg={6} xl={4} key={image.path}>
                                        <Card
                                            hoverable
                                            cover={
                                                <div className="image-container" onClick={() => handleSelectImage(image)}>
                                                    <Image
                                                        src={image.path}
                                                        alt={image.name}
                                                        preview={false}
                                                        fallback="data:image/png;base64,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"
                                                    />
                                                </div>
                                            }
                                        >
                                            <Card.Meta
                                                title={
                                                    <Text ellipsis={{ tooltip: image.name }}>
                                                        {image.name}
                                                    </Text>
                                                }
                                                description={formatFileSize(image.size)}
                                            />
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <Empty
                                description={t['content.images.noImages'] || '暂无图片'}
                                className="empty-images"
                            />
                        )}
                    </Spin>

                    {imageData.total > 0 && (
                        <div className="image-pagination">
                            <Pagination
                                current={currentImagePage}
                                pageSize={imagePageSize}
                                total={imageData.total}
                                onChange={handleImagePageChange}
                                showSizeChanger={false}
                                responsive
                            />
                        </div>
                    )}
                </div>
            </Modal>
            {/* 添加上传图片模态框 */}
            <Modal
                title={t['vditor.uploadImage'] || '上传图片'}
                open={uploadModalVisible}
                onCancel={() => setUploadModalVisible(false)}
                footer={null}
                width={isMobile ? '95%' : 520}
                className="upload-image-modal"
            >
                <div className="upload-form">
                    <div className="form-item" style={{ marginBottom: 16 }}>
                        <Text strong>{t['content.images.targetFolder'] || '目标文件夹'}:</Text>
                        <Select
                            style={{ width: '100%', marginTop: 8 }}
                            value={uploadFolder}
                            onChange={setUploadFolder}
                            placeholder={t['content.images.selectFolder'] || '选择文件夹'}
                        >
                            <Option value="">{t['content.images.rootFolder'] || '根目录'}</Option>
                            {imageData.folders.map(folder => (
                                <Option key={folder} value={folder}>{folder}</Option>
                            ))}
                        </Select>
                    </div>

                    <div className="form-item" style={{ marginBottom: 16 }}>
                        <Text strong>{t['content.images.customFileName'] || '自定义文件名'}:</Text>
                        <Input
                            style={{ marginTop: 8 }}
                            value={uploadFileName}
                            onChange={e => setUploadFileName(e.target.value)}
                            placeholder={t['content.images.fileNamePlaceholder'] || '留空则使用原文件名'}
                        />
                    </div>

                    <div className="form-item">
                        <Upload.Dragger
                            name="file"
                            multiple={false}
                            beforeUpload={(file) => {
                                const isImage = file.type.startsWith('image/')
                                if (!isImage) {
                                    message.error(t['vditor.upload.invalidFileType'] || '只能上传图片文件')
                                    return false
                                }
                                handleCustomUpload(file)
                                return false
                            }}
                            showUploadList={false}
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">
                                {t['content.images.dragHere'] || '拖拽图片到此处，或点击上传'}
                            </p>
                        </Upload.Dragger>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
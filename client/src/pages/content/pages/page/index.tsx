
import { service } from '@/utils/api'
import React, { useCallback, useEffect, useRef, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import _ from 'lodash'
import { PageSettings } from './pageSettings'
import { useNavigate } from "react-router-dom"
import HexoProVditor from '@/components/Vditor'
import EditorHeader from '../../components/EditorHeader'
import AIChatPanel from '@/components/AIChatPanel'
import useLocale from '@/hooks/useLocale'
import { Skeleton } from 'antd'
import styles from '../../style/index.module.less'
import { useSelector } from 'react-redux'
import { GlobalState } from '@/store'
import { GlobalContext } from '@/context'


type Page = {
    isDraft: boolean
    isDiscarded: boolean
    source: string
}

function Page() {
    const navigate = useNavigate()
    const postRef = useRef(null)
    const editorWapperRef = useRef(null)
    const { _id } = useParams()
    const [page, setPage] = useState({ isDraft: true, source: null, permalink: null })
    const [pageMetaData, setPageMetadata] = useState({ tags: [], categories: [], frontMatter: {}, source: '' })
    const [fmtKeys, setFmtKeys] = useState([])
    const [doc, setDoc] = useState('')
    const [title, setTitle] = useState('')
    const [initialRaw, setInitialRaw] = useState('')
    // const [rendered, setRendered] = useState('');
    const [update, setUpdate] = useState({})
    const [visible, setVisible] = useState(false)
    const [aiPanelVisible, setAiPanelVisible] = useState(true)
    const t = useLocale()
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [editorReady, setEditorReady] = useState(false)

    const { theme } = useContext(GlobalContext)

    const skeletonStyle = theme === 'dark' ? {
        backgroundColor: '#333', // 暗黑主题背景色
        color: '#fff' // 暗黑主题文字颜色
    } : {
        backgroundColor: '#fff', // 明亮主题背景色
        color: '#000' // 明亮主题文字颜色
    }


    const toolbarPin = useSelector((state: GlobalState) => {
        return state.vditorToolbarPin
    })

    const queryPageById = (_id) => {
        return new Promise((resolve, reject) => {
            service.get('/hexopro/api/pages/' + _id).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const postMeta = () => {
        return new Promise((resolve, reject) => {
            service.get('/hexopro/api/pageMeta/' + _id).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const fetch = () => {
        return {
            page: queryPageById(_id),
            pageMeta: postMeta()
        }
    }

    const dataDidLoad = (name, data) => {
        if (name === 'pageMeta') {
            setPageMetadata(data)
            setFmtKeys(Object.keys(data.frontMatter))
            return
        }

        if (name === 'page') {
            // console.log('dataLoad', data)
            const parts = data.raw.split('---')
            const _slice = parts[0] === '' ? 2 : 1
            const raw = parts.slice(_slice).join('---').trim()
            setTitle(data.title)
            setInitialRaw(raw)
            // setRendered(raw)
            setPage(data)
            const content = (data)._content
            setDoc(content)
        }
    }

    const handleChange = (update) => {
        // var now = moment()
        const promise = new Promise((resolve, reject) => {
            service.post('/hexopro/api/page/update', {
                _id,
                update
            }).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
        return promise
    }

    const handleChangeTitle = (v) => {
        if (v === title) {
            return
        }
        setTitle(v)
        postRef.current({ title: v })
    }

    const handleChangeContent = (text) => {
        // 同步本地状态，保证 AI 插入等场景拿到的是最新内容
        setDoc(text)
        postRef.current({ _content: text })
    }

    const removePage = async () => {
        const promise = new Promise((resolve, reject) => {
            service.get('/hexopro/api/pages/' + _id + '/remove').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
        await promise
        navigate(`/content/pages`)
    }

    const handleUpdate = (update) => {
        return new Promise((resolve, reject) => {
            service.post('/hexopro/api/page/update', { _id, update }).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }


    const handleUploadingImage = (_: boolean) => {
        // console.log('handleUploadingImage', isUploading)
    }

    const handleAIClick = () => {
        setAiPanelVisible(!aiPanelVisible)
    }

    const handleInsertContent = (content: string) => {
        const base = doc || ''
        const newContent = base + '\n\n' + content
        // 更新本地状态
        setDoc(newContent)
        // 触发编辑器内容和后端更新
        postRef.current({ _content: newContent })
    }


    useEffect(() => {
        setIsDataLoading(true)
        const fetchData = async () => {
            try {
                const items = fetch()
                const promises = Object.keys(items).map((name) => {
                    return Promise.resolve(items[name]).then((data) => {
                        const update = {}
                        update[name] = data
                        setUpdate(update)
                        if (dataDidLoad) {
                            dataDidLoad(name, data)
                        }
                    })
                })
                await Promise.all(promises)
            } finally {
                setIsDataLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleEditorReady = useCallback(() => {
        setEditorReady(true)
    }, [])

    useEffect(() => {
        const p = _.debounce((update) => {
            handleUpdate(update)
        }, 1000, { trailing: true })
        postRef.current = p
    }, [])

    // const [editorRef, editorView] = MarkDownEditor({ initialValue: doc, adminSettings: { editor: { lineNumbers: true } }, setRendered, handleChangeContent, handleScroll, forceLineNumbers: lineNumber })
    return (
        <div className={styles['editor-page']}>
            {/* 编辑器区域 */}
            <div
                className={styles['editor-layout']}
                ref={editorWapperRef}
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <Skeleton
                    paragraph={{ rows: 10 }}
                    loading={isDataLoading || !editorReady}
                    active
                    className={styles['skeleton']}
                    style={{ ...skeletonStyle }}
                />
                <EditorHeader
                    isPage={true}
                    permalink={page.permalink} // 桌面端使用需要替换域名为localhost:4000
                    isDraft={false}
                    handlePublish={() => { }}
                    handleUnpublish={() => { }}
                    className={styles['editor-header']}
                    initTitle={title}
                    popTitle={t['editor.header.pop.title']}
                    popDes={t['page.editor.header.pop.des']}
                    handleChangeTitle={handleChangeTitle}
                    handleSettingClick={(v) => setVisible(true)}
                    handleRemoveSource={removePage}
                    handleAIClick={handleAIClick}
                />
                <div className={styles['editor-main']}>
                    {!isDataLoading && editorReady && !(doc || '').trim() && (
                        <div className={styles['editor-empty-hint']}>
                            {t['editor.empty.hint'] || '提示：可以直接输入、粘贴 Markdown，或拖拽图片到编辑器，内容会自动保存。'}
                        </div>
                    )}
                    <HexoProVditor
                        initValue={doc}
                        isPinToolbar={toolbarPin}
                        handleChangeContent={handleChangeContent}
                        handleUploadingImage={handleUploadingImage}
                        onReady={handleEditorReady}
                    />
                </div>
                <PageSettings
                    visible={visible}
                    setVisible={setVisible}
                    pageMeta={pageMetaData}
                    setPageMeta={setPageMetadata}
                    handleChange={handleChange}
                />
            </div>
            {/* AI聊天面板 - 右侧侧栏 */}
            {aiPanelVisible && (
                <div className={styles['ai-panel-wrap']}>
                    <AIChatPanel
                        visible={aiPanelVisible}
                        onClose={() => setAiPanelVisible(false)}
                        onInsertContent={handleInsertContent}
                    />
                </div>
            )}
        </div>
    )
}

export default Page

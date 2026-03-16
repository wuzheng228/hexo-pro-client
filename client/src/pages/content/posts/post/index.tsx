import { service } from '@/utils/api'
import React, { useCallback, useEffect, useRef, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { message, Skeleton } from 'antd'
import ErrorDisplay from '@/components/ErrorDisplay'
import _ from 'lodash'
import { PostSettings } from './postSetting'
import { useNavigate } from "react-router-dom"
import HexoProVditor from '@/components/Vditor'
import EditorHeader from '../../components/EditorHeader'
import AIChatPanel from '@/components/AIChatPanel'
import useLocale from '@/hooks/useLocale'
import styles from '../../style/index.module.less'
import { GlobalContext } from '@/context'
import HexoProMilkdown from '@/components/MilkdownEditor'


type Post = {
    isDraft: boolean
    source: string | null
    permalink: string | null
    title: string | null
}

function Post() {
    const navigate = useNavigate()
    const postRef = useRef(null)
    const editorWapperRef = useRef(null)
    const vditorRef = useRef(null)
    const { _id } = useParams()
    const [post, setPost] = useState({ isDraft: true, source: null, permalink: null, title: null })
    const [tagsCatMeta, setTagsCatMeta] = useState({})
    const [postMetaData, setPostMetadata] = useState({ tags: [], categories: [], frontMatter: {} })
    const [doc, setDoc] = useState('')
    const [title, setTitle] = useState('')
    const [initialRaw, setInitialRaw] = useState('')
    const [rendered, setRendered] = useState('')
    const [update, setUpdate] = useState({})
    const [visible, setVisible] = useState(false)
    const [aiPanelVisible, setAiPanelVisible] = useState(false)

    const [isDataLoading, setIsDataLoading] = useState(true)
    const [editorReady, setEditorReady] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const { theme } = useContext(GlobalContext)

    const skeletonStyle = theme === 'dark' ? {
        backgroundColor: '#333', // 暗黑主题背景色
        color: '#fff' // 暗黑主题文字颜色
    } : {
        backgroundColor: '#fff', // 明亮主题背景色
        color: '#000' // 明亮主题文字颜色
    }

    const t = useLocale()

    // permailink base64位编码作为id
    const queryPostById = (_id) => {
        return new Promise((resolve, reject) => {
            service.get('/hexopro/api/posts/' + _id).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const tagsCategoriesAndMetadata = () => {
        return new Promise((resolve, reject) => {
            service.get('/hexopro/api/tags-categories-and-metadata').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const postMeta = () => {
        return new Promise((resolve, reject) => {
            service.get('/hexopro/api/postMeta/' + _id).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const settings = () => {
        return new Promise((resolve, reject) => {
            service.get('/hexopro/api/settings/list').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const fetch = () => {
        return {
            post: queryPostById(_id),
            tagsCategoriesAndMetadata: tagsCategoriesAndMetadata(),
            settings: settings(),
            postMeta: postMeta()
        }
    }

    const dataDidLoad = (name, data) => {
        if (name === 'postMeta') {
            setPostMetadata(data)
            return
        }
        if (name === 'tagsCategoriesAndMetadata') {
            setTagsCatMeta(data)
            return
        }
        if (name === 'post') {
            // console.log('dataLoad', data)
            const parts = data.raw.split('---')
            const _slice = parts[0] === '' ? 2 : 1
            const raw = parts.slice(_slice).join('---').trim()
            setTitle(data.title)
            setInitialRaw(raw)
            setRendered(raw)
            setPost(data)
            const content = (data)._content
            setDoc(content)
        }
    }

    const handleChange = (update) => {
        // console.log('update', update)
        // var now = moment()
        const promise = new Promise((resolve, reject) => {
            service.post('/hexopro/api/post/update/' + _id, update).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
        return promise
    }

    const checkTitleExists = async (title) => {
        try {
            const res = await service.get('/hexopro/api/posts/check-title', {
                params: { title, excludeId: _id }
            })
            return res.data.exists
        } catch (err) {
            console.error('检查标题失败', err)
            return false
        }
    }

    const updatePostTitleAndSource = (nextTitle: string) => {
        if (!post.source) {
            postRef.current({ title: nextTitle })
            setPost({ ...post, title: nextTitle })
            return
        }

        const parts = post.source.split('/')
        parts[parts.length - 1] = `${nextTitle}.md`
        const newSource = parts.join('/')

        postRef.current({ title: nextTitle, source: newSource })
        setPost({ ...post, title: nextTitle, source: newSource })
    }

    // 修改标题处理函数
    const handleChangeTitle = async (v) => {
        const nextTitle = String(v || '').trim()
        if (!nextTitle || nextTitle === post.title) {
            setTitle(post.title || '')
            return
        }

        const exists = await checkTitleExists(nextTitle)
        if (exists) {
            message.warning('已存在同名文章，保存时将自动添加区分字符')
            const uniqueTitle = `${nextTitle} (${Date.now()})`
            setTitle(uniqueTitle)
            updatePostTitleAndSource(uniqueTitle)
            return
        }

        setTitle(nextTitle)
        updatePostTitleAndSource(nextTitle)
    }

    // 添加标题失去焦点时的处理函数
    const handleTitleBlur = async (v) => {
        const nextTitle = String(v?.target?.value || '').trim()
        if (!nextTitle || nextTitle === post.title) {
            setTitle(post.title || '')
            return
        }

        const exists = await checkTitleExists(nextTitle)
        if (exists) {
            const uniqueTitle = `${nextTitle} (${Date.now()})`
            setTitle(uniqueTitle)
            updatePostTitleAndSource(uniqueTitle)
            message.info('已自动为重复标题添加区分字符')
            return
        }

        setTitle(nextTitle)
        updatePostTitleAndSource(nextTitle)
    }

    const handleChangeContent = (text) => {
        if (text === rendered) {
            return
        }
        // 同步本地内容（用于 AI 插入等场景）
        setRendered(text)
        setDoc(text)
        postRef.current({ _content: text })
    }

    const removeBlog = async () => {
        const promise = new Promise((resolve, reject) => {
            service.get('/hexopro/api/posts/' + _id + '/remove').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
        await promise
        if (post.isDraft) {
            navigate(`/content/posts/drafts`)
        } else {
            navigate(`/content/posts/blogs`)
        }
    }

    const publish = () => {
        const res = handlePublish()
        res.then((data: Post) => {
            setPost(data)
        }).catch(err => {
            message.error(err.message)
        })
    }

    const handlePublish = () => {
        if (!post.isDraft) {
            return
        }
        return new Promise((resolve, reject) => {
            service.post('/hexopro/api/posts/' + _id + '/publish').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const unpublish = () => {
        const res = handleUnpublish()
        res.then((data: Post) => {
            setPost(data)
        }).catch(err => {
            message.error(err.message)
        })
    }

    const handleUnpublish = () => {
        if (post.isDraft) {
            return
        }
        return new Promise((resolve, reject) => {
            service.post('/hexopro/api/posts/' + _id + '/unpublish').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const handleUpdate = (update) => {
        // console.log(update)
        return new Promise((resolve, reject) => {
            service.post('/hexopro/api/post/update/' + _id, update).then((res) => {
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
        // 在当前文档末尾插入 AI 内容，但不关闭面板
        const base = doc || ''
        const newContent = base + '\n\n' + content
        // 更新本地状态，驱动编辑器刷新
        setDoc(newContent)
        setRendered(newContent)
        // 触发后端保存
        postRef.current({ _content: newContent })
    }

    const retryFetch = () => {
        setError(null)
        fetchData()
    }

    const fetchData = async () => {
        try {
            setIsDataLoading(true)
            const items = fetch()
            const promises = Object.keys(items).map((name) => {
                return Promise.resolve(items[name]).then((data) => {
                    const update = {}
                    update[name] = data
                    setUpdate(update)
                    if (dataDidLoad) {
                        dataDidLoad(name, data)
                    }
                }).catch(err => {
                    // 捕获单个API错误但继续执行其他请求
                    console.error(`API ${name} error:`, err)
                    throw err
                })
            })

            await Promise.all(promises)
            setError(null)
        } catch (err) {
            setError(err as Error)
            message.error('加载失败: ' + (err as Error).message)
        } finally {
            setIsDataLoading(false)
        }
    }

    const handleEditorReady = useCallback(() => {
        setEditorReady(true)
    }, [])

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        const p = _.debounce((update) => {
            handleUpdate(update)
        }, 1000, { trailing: true })
        postRef.current = p
    }, [])

    return (
        <div className={styles['editor-page']}>
            {/* 编辑器区域 */}
            <div
                className={styles['editor-layout']}
                ref={editorWapperRef}
                style={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {error ? (
                    <ErrorDisplay error={error} onRetry={retryFetch} />
                ) : (
                    <>
                        <Skeleton
                            paragraph={{ rows: 10 }}
                            loading={isDataLoading || !editorReady}
                            active
                            className={styles['skeleton']}
                            style={{ ...skeletonStyle }}
                        />
                        <EditorHeader
                            isPage={false}
                            permalink={post.permalink} // 桌面端使用需要替换域名为localhost:4000
                            isDraft={post.isDraft}
                            handlePublish={publish}
                            handleUnpublish={unpublish}
                            className={styles['editor-header']}
                            initTitle={title}
                            popTitle={t['editor.header.pop.title']}
                            popDes={t['page.editor.header.pop.des']}
                            handleChangeTitle={handleChangeTitle}
                            handleTitleBlur={handleTitleBlur}
                            handleSettingClick={(_) => setVisible(true)}
                            handleRemoveSource={removeBlog}
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
                                handleChangeContent={handleChangeContent}
                                handleUploadingImage={handleUploadingImage}
                                onReady={handleEditorReady}
                            />
                        </div>
                        <PostSettings
                            visible={visible}
                            setVisible={setVisible}
                            tagCatMeta={tagsCatMeta}
                            setTagCatMeta={setTagsCatMeta}
                            postMeta={postMetaData}
                            setPostMeta={setPostMetadata}
                            handleChange={handleChange}
                        />
                    </>
                )}
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

export default Post

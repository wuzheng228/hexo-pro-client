import { service } from '@/utils/api'
import React, { useEffect, useRef, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { message, Skeleton } from 'antd'
import ErrorDisplay from '@/components/ErrorDisplay'
import _ from 'lodash'
import { PostSettings } from './postSetting'
import { useNavigate } from "react-router-dom"
import HexoProVditor from '@/components/Vditor'
import EditorHeader from '../../components/EditorHeader'
import useLocale from '@/hooks/useLocale'
import styles from '../../style/index.module.less'
import { useSelector } from 'react-redux'
import { GlobalState } from '@/store'
import { GlobalContext } from '@/context'


type Post = {
    isDraft: boolean
    source: string
}

function Post() {
    const navigate = useNavigate()
    const postRef = useRef(null)
    const editorWapperRef = useRef(null)
    const { _id } = useParams()
    const [post, setPost] = useState({ isDraft: true, source: null })
    const [tagsCatMeta, setTagsCatMeta] = useState({})
    const [postMetaData, setPostMetadata] = useState({ tags: [], categories: [], frontMatter: {} })
    const [doc, setDoc] = useState('')
    const [title, setTitle] = useState('')
    const [initialRaw, setInitialRaw] = useState('')
    const [rendered, setRendered] = useState('')
    const [update, setUpdate] = useState({})
    const [visible, setVisible] = useState(false)

    const [skeletonSize, setSkeletonSize] = useState({ width: '100%', height: '100%' })

    const [skeletonLoading, setSkeletonLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const toolbarPin = useSelector((state: GlobalState) => {
        return state.vditorToolbarPin
    })

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
            service.post('/hexopro/api/posts/' + _id, update).then((res) => {
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
        const parts = post.source.split('/')
        parts[parts.length - 1] = v + '.md'
        const newSource = parts.join('/')
        postRef.current({ title: v, source: newSource })
    }

    const handleChangeContent = (text) => {
        if (text === rendered) {
            return
        }
        setRendered(text)
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
            service.post('/hexopro/api/posts/' + _id, update).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const handleUploadingImage = (_: boolean) => {
        // console.log('handleUploadingImage', isUploading)
    }

    useEffect(() => {
        const handleResize = () => {
            if (editorWapperRef.current) {
                const { clientWidth, clientHeight } = editorWapperRef.current
                setSkeletonSize({ width: `${clientWidth + 20}px`, height: `${clientHeight + 20}px` })
            }
        }
        handleResize() // 初始化尺寸
        // editorWapperRef.current.style.overfllow = 'auto';
        window.addEventListener('resize', handleResize) // 监听窗口 resize 事件

        return () => {
            window.removeEventListener('resize', handleResize) // 清理事件监听
        }
    }, [])

    const retryFetch = () => {
        setError(null)
        fetchData()
    }

    const fetchData = async () => {
        try {
            setSkeletonLoading(true)
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
            setTimeout(() => {
                setSkeletonLoading(false)
            }, 800)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        const p = _.debounce((update) => {
            handleUpdate(update)
        }, 1000, { trailing: true, loading: true })
        postRef.current = p
    }, [])

    return (
        <div ref={editorWapperRef} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflowY: 'auto', overflowX: 'hidden' }}>
            {error ? (
                <ErrorDisplay error={error} onRetry={retryFetch} />
            ) : (
                <>
                    <Skeleton paragraph={{ rows: 10 }} loading={skeletonLoading} active className={styles['skeleton']} style={{ ...skeletonSize, ...skeletonStyle }} />
                    <EditorHeader
                        isPage={false}
                        isDraft={post.isDraft}
                        handlePublish={publish}
                        handleUnpublish={unpublish}
                        className={styles['editor-header']}
                        initTitle={title}
                        popTitle={t['editor.header.pop.title']}
                        popDes={t['page.editor.header.pop.des']}
                        handleChangeTitle={handleChangeTitle}
                        handleSettingClick={(_) => setVisible(true)}
                        handleRemoveSource={removeBlog}
                    />
                    <div style={{ width: "100%", flex: 1, padding: 0, border: 'none' }}>
                        <HexoProVditor initValue={doc} isPinToolbar={toolbarPin} handleChangeContent={handleChangeContent} handleUploadingImage={handleUploadingImage} />
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
        </div >
    )
}

export default Post
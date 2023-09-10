
import MarkDownEditor from '@/components/MarkdownEditor';
import { Button, Divider, Grid, Modal } from '@arco-design/web-react';
import axios from 'axios';
import React, { useEffect, useRef, useState, createElement, Fragment, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkGfm from 'remark-gfm'
import rehypeFormat from 'rehype-format'
import rehypeHighlight from 'rehype-highlight'
import rehypeReact from 'rehype-react';
import { remark } from 'remark';
import './style/index.css';
import { IconDelete, IconObliqueLine, IconSettings } from '@arco-design/web-react/icon';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import moment from 'moment'
import _ from 'lodash';
import { PostSettings } from './postSettings';
import { useHistory } from "react-router-dom";
import { marked, Renderer } from 'marked';
import { render } from 'react-dom';



const Row = Grid.Row;
const Col = Grid.Col;
const ButtonGroup = Button.Group;

type Post = {
    isDraft: boolean
}





function Post() {
    const history = useHistory();
    const postRef = useRef(null);
    const mouseIsOn = useRef(null);
    const { _id } = useParams();
    const [post, setPost] = useState({ isDraft: true });
    const [tagsCatMeta, setTagsCatMeta] = useState({})
    const [postMetaData, setPostMetadata] = useState({ tags: [], categories: [], frontMatter: {} })
    const [doc, setDoc] = useState('');
    const [md, setRenderedMarkdown] = useState('');
    const [title, setTitle] = useState('');
    const [initialRaw, setInitialRaw] = useState('');
    const [rendered, setRendered] = useState('');
    const [update, setUpdate] = useState({});
    const [visible, setVisible] = useState(false)
    const [lineNumber, setLineNumber] = useState(false)

    const queryPostById = (_id) => {
        return new Promise((resolve, reject) => {
            axios.get('/hexopro/api/posts/' + _id).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const tagsCategoriesAndMetadata = () => {
        return new Promise((resolve, reject) => {
            axios.get('/hexopro/api/tags-categories-and-metadata').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const postMeta = () => {
        return new Promise((resolve, reject) => {
            axios.get('/hexopro/api/postMeta/' + _id).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const settings = () => {
        return new Promise((resolve, reject) => {
            axios.get('/hexopro/api/settings/list').then((res) => {
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
        if (name == 'postMeta') {
            console.log('postMeta')
            console.log(data)
            setPostMetadata(data)
            return
        }
        if (name == 'tagsCategoriesAndMetadata') {
            setTagsCatMeta(data)
            return
        }

        if (name == 'post') {
            // console.log('dataLoad', data)
            const parts = data.raw.split('---')
            const _slice = parts[0] === '' ? 2 : 1;
            const raw = parts.slice(_slice).join('---').trim();
            setTitle(data.title)
            setInitialRaw(raw)
            setRendered(raw)
            setPost(data)
        }
    }

    const handleChange = (update) => {
        console.log('update', update)
        // var now = moment()
        const promise = new Promise((resolve, reject) => {
            axios.post('/hexopro/api/posts/' + _id, update).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
        return promise
    }

    const handleChangeTitle = (e) => {
        if (e.target.value == title) {
            return
        }
        setTitle(e.target.value)
        postRef.current({ title: e.target.value })
    }

    const handleChangeContent = (text) => {
        if (text === rendered) {
            return
        }
        setRendered(text)
        postRef.current({ _content: text })
    }

    const removeBlog = () => {
        const promise = new Promise((resolve, reject) => {
            axios.get('/hexopro/api/posts/' + _id + '/remove').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
        history.push(`/posts`);
    }

    const publish = () => {
        const res = handlePublish()
        res.then((data: Post) => {
            setPost(data)
        }).catch(err => {
            console.log(err)
        })
    }

    const handlePublish = () => {
        if (!post.isDraft) {
            return
        }
        return new Promise((resolve, reject) => {
            console.log('publish blog')
            axios.post('/hexopro/api/posts/' + _id + '/publish').then((res) => {
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
            console.log(err)
        })
    }

    const handleUnpublish = () => {
        if (post.isDraft) {
            return
        }
        return new Promise((resolve, reject) => {
            console.log('unpublish blog')
            axios.post('/hexopro/api/posts/' + _id + '/unpublish').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const handleUpdate = (update) => {
        return new Promise((resolve, reject) => {
            axios.post('/hexopro/api/posts/' + _id, update).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const handleScroll = (percent) => {
        console.log(percent)
        const height = document.getElementById("preview").getBoundingClientRect().height
        document.getElementById("preview").scrollTop = (document.getElementById("preview").scrollHeight - height) * percent
    }

    useEffect(() => {
        queryPostById(_id).then((res) => {
            if (typeof res === 'object' && res != null && '_content' in res) {
                const content = (res as { _content: string })._content;
                setDoc(content)
            }
        }).catch(err => {
            setDoc(err)
        })
    }, [])

    useEffect(() => {
        const items = fetch()
        Object.keys(items).forEach((name) => {
            Promise.resolve(items[name]).then((data) => {
                const update = {}
                update[name] = data
                setUpdate(update)
                if (dataDidLoad) {
                    dataDidLoad(name, data)
                }
            })
        })
    }, [])

    useEffect(() => {
        const p = _.debounce((update) => {
            handleUpdate(update)
        }, 1000, { trailing: true, loading: true });
        postRef.current = p
    }, []);

    const [editorRef, editorView] = MarkDownEditor({ initialValue: doc, adminSettings: { editor: { lineNumbers: true } }, setRendered, handleChangeContent, handleScroll, forceLineNumbers: lineNumber })



    useEffect(() => {
        const renderer = {
            code(code, lang) {
                const validLanguage = hljs.getLanguage(lang) ? lang : 'plaintext';
                return `<pre><code>${hljs.highlight(code, { language: validLanguage }).value}</code></pre>`
            }

        };
        marked.use({ renderer });
        marked.use({
            pedantic: false,
            gfm: true,
            breaks: true
        });
        setRenderedMarkdown(marked(rendered))
    }, [rendered])

    return (
        <div>
            <Row style={{ width: "100%", borderBottomColor: 'black', borderBottom: '1px solid gray', backgroundColor: 'white' }} align='center'>
                {/* 博客名称输入 */}
                <Col span={12}>
                    <input
                        style={{ width: "100%", height: 60, border: 'none', outline: 'none', boxSizing: 'border-box', fontSize: 28, fontWeight: 500, marginLeft: 10 }}
                        value={title}
                        onChange={(v) => handleChangeTitle(v)}
                    />
                </Col>
                {/* 博客发布按钮 */}
                <Col span={3} offset={9} style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <ButtonGroup>
                        <Button type='primary' icon={<IconObliqueLine />} onClick={() => setLineNumber(!lineNumber)} />
                        <Button type='primary' icon={<IconDelete />} onClick={removeBlog} />
                        <Button type='primary' icon={<IconSettings />} onClick={() => setVisible(true)} />
                        {
                            post.isDraft ?
                                <Button type='primary' onClick={publish}>发布博客</Button>
                                : <Button type='outline' onClick={unpublish}>转为草稿</Button>
                        }
                    </ButtonGroup>
                </Col>
            </Row>
            <Row style={{ boxSizing: 'border-box', margin: 0, backgroundColor: 'white', height: "100vh", overflow: 'hidden', width: "100%" }}>
                <Row id='editorWrapper' style={{ width: "100%" }}>
                    <Col
                        id="markdown"
                        span={12}
                        ref={editorRef}
                        // onScroll={handleMarkdownScroll}
                        onMouseEnter={() => (mouseIsOn.current = 'markdown')}
                    >
                    </Col>
                    <Col
                        id="preview"
                        style={{ overflowY: 'hidden' }}
                        span={12}
                        // onScroll={handlePreviewScroll}
                        onMouseEnter={() => (mouseIsOn.current = 'preview')}
                        dangerouslySetInnerHTML={{ __html: md }}
                    ></Col>
                </Row>
            </Row>
            <PostSettings
                visible={visible}
                setVisible={setVisible}
                tagCatMeta={tagsCatMeta}
                setTagCatMeta={setTagsCatMeta}
                postMeta={postMetaData}
                setPostMeta={setPostMetadata}
                handleChange={handleChange}
            />
        </div >
    )
}

export default Post
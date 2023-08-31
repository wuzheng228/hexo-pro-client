
import MarkDownEditor from '@/components/MarkdownEditor';
import { Button, Divider, Grid } from '@arco-design/web-react';
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
import { IconDelete, IconSettings } from '@arco-design/web-react/icon';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import moment from 'moment'
import _ from 'lodash';
import { center } from '@turf/turf';

let treeData;

const Row = Grid.Row;
const Col = Grid.Col;
const ButtonGroup = Button.Group;

type Post = {
    isDraft: boolean
}

function Post() {
    const postRef = useRef(null);
    const mouseIsOn = useRef(null);
    const { _id } = useParams();
    const [post, setPost] = useState({ isDraft: true });
    const [doc, setDoc] = useState('');
    const [title, setTitle] = useState('');
    const [initialRaw, setInitialRaw] = useState('');
    const [rendered, setRendered] = useState(null);
    const [update, setUpdate] = useState({});

    const markdownElem = document.getElementById("markdown");
    const previewElem = document.getElementById("preview");

    const defaultPlugin = () => (tree) => {
        treeData = tree; //treeData length corresponds to previewer's childNodes length
        return tree;
    };

    const computeElemsOffsetTop = () => {
        const markdownChildNodesOffsetTopList = [];
        const previewChildNodesOffsetTopList = [];

        treeData.children.forEach((child, index) => {
            if (child.type !== "element" || child.position === undefined) return;

            const pos = child.position.start.offset;
            const lineInfo = editorView.lineBlockAt(pos);
            const offsetTop = lineInfo.top;
            markdownChildNodesOffsetTopList.push(offsetTop);
            const childNode = previewElem.childNodes[index]
            if (childNode instanceof HTMLElement) {
                const listItem = childNode.offsetTop -
                    previewElem.getBoundingClientRect().top //offsetTop from the top of preview
                previewChildNodesOffsetTopList.push(
                    listItem
                );
            }
        });
        return [markdownChildNodesOffsetTopList, previewChildNodesOffsetTopList];
    };

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
            settings: settings()
        }
    }

    const dataDidLoad = (name, data) => {
        console.log('data')
        if (name != 'post') {
            return
        }

        console.log('dataLoad', data)
        const parts = data.raw.split('---')
        const _slice = parts[0] === '' ? 2 : 1;
        const raw = parts.slice(_slice).join('---').trim();
        setTitle(data.title)
        setInitialRaw(raw)
        setRendered(raw)
        setPost(data)
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

    const handlePreviewScroll = () => {
        if (mouseIsOn.current !== "preview") {
            return;
        }
        const [markdownChildNodesOffsetTopList, previewChildNodesOffsetTopList] =
            computeElemsOffsetTop();
        let scrollElemIndex;
        for (let i = 0; previewChildNodesOffsetTopList.length > i; i++) {
            if (previewElem.scrollTop < previewChildNodesOffsetTopList[i]) {
                scrollElemIndex = i - 1;
                break;
            }
        }

        if (scrollElemIndex >= 0) {
            const ratio =
                (previewElem.scrollTop -
                    previewChildNodesOffsetTopList[scrollElemIndex]) /
                (previewChildNodesOffsetTopList[scrollElemIndex + 1] -
                    previewChildNodesOffsetTopList[scrollElemIndex]);
            markdownElem.scrollTop =
                ratio *
                (markdownChildNodesOffsetTopList[scrollElemIndex + 1] -
                    markdownChildNodesOffsetTopList[scrollElemIndex]) +
                markdownChildNodesOffsetTopList[scrollElemIndex];
        }
    };

    const handleMarkdownScroll = () => {
        console.log(mouseIsOn.current);
        if (mouseIsOn.current !== "markdown") {
            return;
        }
        const [markdownChildNodesOffsetTopList, previewChildNodesOffsetTopList] =
            computeElemsOffsetTop();
        let scrollElemIndex;
        for (let i = 0; markdownChildNodesOffsetTopList.length > i; i++) {
            if (markdownElem.scrollTop < markdownChildNodesOffsetTopList[i]) {
                scrollElemIndex = i - 1;
                break;
            }
        }

        if (
            markdownElem.scrollTop >=
            markdownElem.scrollHeight - markdownElem.clientHeight //true when scroll reached the bottom
        ) {
            previewElem.scrollTop =
                previewElem.scrollHeight - previewElem.clientHeight; //scroll to the bottom
            return;
        }

        if (scrollElemIndex >= 0) {
            const ratio =
                (markdownElem.scrollTop -
                    markdownChildNodesOffsetTopList[scrollElemIndex]) /
                (markdownChildNodesOffsetTopList[scrollElemIndex + 1] -
                    markdownChildNodesOffsetTopList[scrollElemIndex]);
            previewElem.scrollTop =
                ratio *
                (previewChildNodesOffsetTopList[scrollElemIndex + 1] -
                    previewChildNodesOffsetTopList[scrollElemIndex]) +
                previewChildNodesOffsetTopList[scrollElemIndex];
        }
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
        // hljs.initHighlighting.call(() => { false });
        hljs.initHighlighting();
        hljs.highlightAll();
        const items = fetch()
        console.log('item', items)
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
        // return () => {
        //     p.cancel(); // 清除防抖函数的定时器
        // };
    }, []);

    const [editorRef, editorView] = MarkDownEditor({ initialValue: doc, adminSettings: { editor: { lineNumbers: true } }, setRendered, handleChangeContent, forceLineNumbers: true })

    const md = remark()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeFormat)
        .use(rehypeHighlight, { ignoreMissing: true, detect: true })
        .use(rehypeReact, { createElement, Fragment })
        .use(defaultPlugin)

        .processSync(rendered).result;

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
                        <Button type='primary' icon={<IconDelete />} />
                        <Button type='primary' icon={<IconSettings />} />
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
                        onScroll={handleMarkdownScroll}
                        onMouseEnter={() => (mouseIsOn.current = 'markdown')}
                    >
                    </Col>
                    <Col
                        id="preview"
                        style={{ overflowY: 'hidden' }}
                        span={12}
                        onScroll={handlePreviewScroll}
                        onMouseEnter={() => (mouseIsOn.current = 'preview')}
                    >{md}</Col>
                </Row>
            </Row>
        </div >
    )
}

export default Post
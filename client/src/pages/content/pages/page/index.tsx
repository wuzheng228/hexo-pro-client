
import MarkDownEditor from '@/components/markdownEditor';
import { service } from '@/utils/api';
import React, { useEffect, useRef, useState, createElement, Fragment, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import _ from 'lodash';
import { PageSettings } from './pageSettings';
import { useNavigate } from "react-router-dom";
import HexoProVditor from '@/components/Vditor';
import EditorHeader from '../../components/EditorHeader';
import useLocale from '@/hooks/useLocale';


type Page = {
    isDraft: boolean
    isDiscarded: boolean
    source: string
}

function Page() {
    const navigate = useNavigate();
    const postRef = useRef(null);
    const { _id } = useParams();
    const [page, setPage] = useState({ isDraft: true, source: null });
    const [pageMetaData, setPageMetadata] = useState({ tags: [], categories: [], frontMatter: {}, source: '' })
    const [fmtKeys, setFmtKeys] = useState([])
    const [doc, setDoc] = useState('');
    const [title, setTitle] = useState('');
    const [initialRaw, setInitialRaw] = useState('');
    // const [rendered, setRendered] = useState('');
    const [update, setUpdate] = useState({});
    const [visible, setVisible] = useState(false)
    const t = useLocale()

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
        if (name == 'pageMeta') {
            setPageMetadata(data)
            setFmtKeys(Object.keys(data.frontMatter))
            return
        }

        if (name == 'page') {
            // console.log('dataLoad', data)
            const parts = data.raw.split('---')
            const _slice = parts[0] === '' ? 2 : 1;
            const raw = parts.slice(_slice).join('---').trim();
            setTitle(data.title)
            setInitialRaw(raw)
            // setRendered(raw)
            setPage(data)
            const content = (data)._content;
            setDoc(content)
        }
    }

    const handleChange = (update) => {
        // var now = moment()
        const promise = new Promise((resolve, reject) => {
            service.post('/hexopro/api/pages/' + _id, update).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
        return promise
    }

    const handleChangeTitle = (v) => {
        if (v == title) {
            return
        }
        setTitle(v)
        postRef.current({ title: v })
    }

    const handleChangeContent = (text) => {
        // if (text === rendered) {
        //     return
        // }
        // setRendered(text)
        postRef.current({ _content: text })
    }

    const removePage = () => {
        const promise = new Promise((resolve, reject) => {
            service.get('/hexopro/api/pages/' + _id + '/remove').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
        navigate(`/pages`);
    }

    const publish = () => {
        const res = handlePublish()
        res.then((data: Page) => {
            setPage(data)
        }).catch(err => {
            console.log(err)
        })
    }

    const handlePublish = () => {
        if (!page.isDraft) {
            return
        }
        return new Promise((resolve, reject) => {
            console.log('publish blog')
            service.post('/hexopro/api/pages/' + _id + '/publish').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const unpublish = () => {
        const res = handleUnpublish()
        res.then((data: Page) => {
            setPage(data)
        }).catch(err => {
            console.log(err)
        })
    }

    const handleUnpublish = () => {
        if (page.isDraft) {
            return
        }
        return new Promise((resolve, reject) => {
            console.log('unpublish blog')
            service.post('/hexopro/api/pages/' + _id + '/unpublish').then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }

    const handleUpdate = (update) => {
        return new Promise((resolve, reject) => {
            service.post('/hexopro/api/pages/' + _id, update).then((res) => {
                resolve(res.data)
            }).catch(err => {
                reject(err)
            })
        })
    }


    const handleUploadingImage = (isUploading: boolean) => {
        console.log('handleUploadingImage', isUploading)
    }


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

    // const [editorRef, editorView] = MarkDownEditor({ initialValue: doc, adminSettings: { editor: { lineNumbers: true } }, setRendered, handleChangeContent, handleScroll, forceLineNumbers: lineNumber })
    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: 'blue', overflowY: 'auto' }}>
            <EditorHeader
                isPage={true}
                isDraft={false}
                handlePublish={() => { }}
                initTitle={title}
                popTitle={t['editor.header.pop.title']}
                popDes={t['page.editor.header.pop.des']}
                handleChangeTitle={handleChangeTitle}
                handleSettingClick={(v) => setVisible(true)}
                handleRemoveSource={removePage}
            />
            <div style={{ backgroundColor: 'red', width: "100%", flex: 1, padding: 0, border: 'none' }}>
                <HexoProVditor initValue={doc} handleChangeContent={handleChangeContent} handleUploadingImage={handleUploadingImage} />
            </div>
            <PageSettings
                visible={visible}
                setVisible={setVisible}
                pageMeta={pageMetaData}
                setPageMeta={setPageMetadata}
                handleChange={handleChange}
            />
        </div >
    )
}

export default Page
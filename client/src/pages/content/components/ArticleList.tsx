import { Button, Image, Popconfirm, Space, Table, TableProps, message } from "antd"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import service from "@/utils/api"
import useLocale from "@/hooks/useLocale"
import { DeleteOutlined } from "@ant-design/icons"


interface DataType {
    key: string;
    _id: string;
    cover: string;
    title: string;
    permalink: string;
    date: string;
    updated: string;
    option: string
}



function ArticleList({ published }) {

    const [postList, setPostList] = useState([])
    const [currentPage, setCurrentPage] = useState(1)

    const t = useLocale()

    const removeSource = async (item) => {
        try {
            // 执行删除操作
            await service.get('/hexopro/api/posts/' + item._id + '/remove');

            // 重新查询数据并更新列表
            const res = await service.get('/hexopro/api/posts/list?published=' + published);
            const result = res.data.map((obj, i) => {
                return { _id: obj._id, title: obj.title, cover: obj.cover, date: obj.date, permalink: obj.permalink, updated: obj.updated, key: i + 1 };
            });

            // 更新列表
            setPostList(result);

            // 保持当前页码
            setCurrentPage(currentPage);
        } catch (err) {
            message.error(err.message)
        }
    }

    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current)
    }

    const columns: TableProps<DataType>['columns'] = [
        {
            key: 'cover',
            title: t['content.articleList.table.cover'],
            dataIndex: 'cover',
            render: (col, item, index) => {
                return (<Image width={64} height={42.56} src={item.cover} />)
            }
        },
        {
            key: 'title',
            title: t['content.articleList.table.title'],
            dataIndex: 'title',
        },
        {
            key: 'permalink',
            title: t['content.articleList.table.permalink'],
            dataIndex: 'permalink',
            render: (col, item, index) => {
                return (<a href={decodeURIComponent(item.permalink)} target='_blank' rel="noreferrer">{decodeURIComponent(item.permalink)}</a>)
            }
        },
        {
            key: 'date',
            title: t['content.articleList.table.date'],
            dataIndex: 'date',
        },
        {
            key: 'updated',
            title: t['content.articleList.table.updated'],
            dataIndex: 'updated',
        },
        {
            key: 'option',
            title: t['content.articleList.table.option'],
            dataIndex: 'option',
            render: (col, item, index) => {
                return (
                    <Space>
                        <Link to={`/post/${item._id}`}>
                            <Button type='primary' size="small">{t['content.articleList.btn.edit']}</Button>
                        </Link>
                        <Popconfirm
                            title={t['editor.header.pop.title']}
                            description={t['list.editor.header.pop.des']}
                            onConfirm={() => {
                                message.info({
                                    content: 'ok',
                                })
                                removeSource(item)
                            }}
                            onCancel={() => {
                                message.error({
                                    content: 'cancel',
                                })
                            }}
                        >
                            <Button type='dashed' size="small">{t['content.articleList.btn.delete']}</Button>
                        </Popconfirm>
                    </Space>

                )
            }
        }
    ]

    const queryPosts = () => {
        service.get('/hexopro/api/posts/list?published=' + published)
            .then(res => {
                const result = res.data.map((obj, i) => {
                    return { _id: obj._id, title: obj.title, cover: obj.cover, date: obj.date, permalink: obj.permalink, updated: obj.updated, key: i + 1 }
                })
                setPostList(result)
            })
    }

    useEffect(() => {
        queryPosts()
    }, [])

    return (
        <Table dataSource={postList} columns={columns} pagination={{ current: currentPage }} onChange={handleTableChange} />
    )
}

export default ArticleList
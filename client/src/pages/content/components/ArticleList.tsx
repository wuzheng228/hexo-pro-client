import { Button, Image, Space, Table, TableProps } from "antd";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import service from "@/utils/api";
import useLocale from "@/hooks/useLocale";


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

    const t = useLocale()

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
                return (<a href={decodeURIComponent(item.permalink)} target='_blank'>{decodeURIComponent(item.permalink)}</a>)
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
                });
                setPostList(result)
            })
    }

    useEffect(() => {
        queryPosts()
    }, [])

    return (
        <Table dataSource={postList} columns={columns} />
    )
}

export default ArticleList
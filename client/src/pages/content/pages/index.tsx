import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import service from '@/utils/api'
import { Link } from 'react-router-dom'
import _ from 'lodash'
// import { GlobalState } from '@/store';
import { Button, Card, Image, Input, Space, Table, TableColumnProps, TableProps } from 'antd'
import useLocale from '@/hooks/useLocale'


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


export default function Pages() {
    // const userInfo = useSelector((state: GlobalState) => state.posts);
    const inputRef = useRef(null)
    const [pageList, setPageList] = useState([])
    const t = useLocale()

    const queryPages = () => {
        service.get('/hexopro/api/pages/list?deleted=' + false)
            .then(res => {
                const result = res.data.map((obj, i) => {
                    return { _id: obj._id, title: obj.title, cover: obj.cover, date: obj.date, permalink: obj.permalink, updated: obj.updated, key: i + 1 }
                })
                setPageList(result)
            })
    }

    const columns: TableProps<DataType>['columns'] = [
        {
            title: t['content.articleList.table.cover'],
            dataIndex: 'cover',
            render: (col, item, index) => {
                return (<Image width={64} height={42.56} src={item.cover} />)
            }
        },
        {
            title: t['content.articleList.table.title'],
            dataIndex: 'title',
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => {
                return (
                    <div className='arco-table-custom-filter'>
                        <Input.Search
                            ref={inputRef}
                            placeholder='Please enter name'
                            value={selectedKeys[0] || ''}
                            onChange={(value) => {
                                setSelectedKeys(value.target.value ? [value.target.value] : [])
                            }}
                            onSearch={() => {
                                confirm()
                            }}
                        />
                    </div>
                )
            },
            onFilter: (value, row) => (value ? row.title.indexOf(value as string) !== -1 : true),
            onFilterDropdownVisibleChange: (visible) => {
                if (visible) {
                    setTimeout(() => inputRef.current.focus(), 150)
                }
            },
        },
        {
            title: t['content.articleList.table.permalink'],
            dataIndex: 'permalink',
            render: (col, item, index) => {
                return (<a href={decodeURIComponent(item.permalink)} target='_blank' rel="noreferrer">{decodeURIComponent(item.permalink)}</a>)
            }
        },
        {
            title: t['content.articleList.table.date'],
            dataIndex: 'date',
        },
        {
            title: t['content.articleList.table.updated'],
            dataIndex: 'updated',
        },
        {
            title: t['content.articleList.table.option'],
            dataIndex: 'option',
            render: (col, item, index) => {
                return (
                    <Space>
                        <Link to={`/page/${item._id}`}>
                            <Button type='primary' >{t['content.articleList.btn.edit']}</Button>
                        </Link>
                    </Space>

                )
            }
        }
    ]

    useEffect(() => {
        queryPages()
        return () => {
            // 在组件卸载时执行清理操作，取消异步任务等
        }
    }, [])

    return (
        <div>
            <Card style={{ height: '100%' }}>
                <Table columns={columns} dataSource={pageList} />
            </Card>
        </div>

    )

}
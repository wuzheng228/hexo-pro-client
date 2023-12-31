import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, TableColumnProps, Table, Image, Breadcrumb, Input, Space, Link as Lk } from '@arco-design/web-react';
import service from '@/utils/api';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import { GlobalState } from '@/store';


export default function Pages() {
    const userInfo = useSelector((state: GlobalState) => state.posts);
    const dispatch = useDispatch();
    const inputRef = useRef(null)
    const [pageList, setPageList] = useState([])

    const queryPages = () => {
        service.get('/hexopro/api/pages/list?deleted=' + false)
            .then(res => {
                const result = res.data.map((obj, i) => {
                    return { _id: obj._id, title: obj.title, cover: obj.cover, date: obj.date, permalink: obj.permalink, updated: obj.updated, key: i + 1 }
                });
                setPageList(result)
            })
    }

    const columns: TableColumnProps[] = [
        {
            title: '封面',
            dataIndex: 'cover',
            render: (col, item, index) => {
                return (<Image width={64} height={42.56} src={item.cover} />)
            }
        },
        {
            title: '博客名称',
            dataIndex: 'title',
            filterDropdown: ({ filterKeys, setFilterKeys, confirm }) => {
                return (
                    <div className='arco-table-custom-filter'>
                        <Input.Search
                            ref={inputRef}
                            searchButton
                            placeholder='Please enter name'
                            value={filterKeys[0] || ''}
                            onChange={(value) => {
                                setFilterKeys(value ? [value] : []);
                            }}
                            onSearch={() => {
                                confirm();
                            }}
                        />
                    </div>
                );
            },
            onFilter: (value, row) => (value ? row.title.indexOf(value) !== -1 : true),
            onFilterDropdownVisibleChange: (visible) => {
                if (visible) {
                    setTimeout(() => inputRef.current.focus(), 150);
                }
            },
        },
        {
            title: '链接',
            dataIndex: 'permalink',
            render: (col, item, index) => {
                return (<Lk href={decodeURIComponent(item.permalink)} icon target='_blank'>{decodeURIComponent(item.permalink)}</Lk>)
            }
        },
        {
            title: '发布时间',
            dataIndex: 'date',
        },
        {
            title: '更新时间',
            dataIndex: 'updated',
        },
        {
            title: '操作',
            dataIndex: 'option',
            render: (col, item, index) => {
                return (
                    <Space>
                        <Link to={`/page/${item._id}`}>
                            <Button type='primary' size='mini' >编辑</Button>
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
        };
    }, []);

    return (
        <div>
            <Card style={{ height: '100%' }}>
                <Table columns={columns} data={pageList} />
            </Card>
        </div>

    );

}
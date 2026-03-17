import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Empty, Input, Modal, Radio, Space, Table, Tag, message } from 'antd'
import { get, post } from '../../../utils/api'
import useLocale from '../../../hooks/useLocale'

type RecycleItem = {
    _id: string
    type: 'post' | 'page'
    title: string
    permalink: string
    originalSource: string
    discardedPath: string
    isDraft?: boolean
    deletedAt: string
}

export default function RecyclePage() {
    const locale = useLocale()
    const [loading, setLoading] = useState(false)
    const [list, setList] = useState<RecycleItem[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(12)
    const [type, setType] = useState<'all' | 'post' | 'page'>('all')
    const [query, setQuery] = useState('')
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const columns = useMemo(() => ([
        { title: locale['recycle.table.type'], dataIndex: 'type', key: 'type', width: 100, render: (t: string) => t === 'post' ? <Tag color="blue">{locale['navbar.search.tag.post']}</Tag> : <Tag color="purple">{locale['navbar.search.tag.page']}</Tag> },
        { title: locale['content.articleList.table.title'], dataIndex: 'title', key: 'title' },
        { title: locale['recycle.table.source'], dataIndex: 'originalSource', key: 'originalSource' },
        { title: locale['recycle.table.deletedAt'], dataIndex: 'deletedAt', key: 'deletedAt' },
        {
            title: locale['content.articleList.table.option'], key: 'action', width: 220, render: (_: any, record: RecycleItem) => (
                <Space>
                    <Button size="small" onClick={() => onRestore(record)}>{locale['recycle.action.restore']}</Button>
                    <Button danger size="small" onClick={() => onDelete(record)}>{locale['recycle.action.delete']}</Button>
                </Space>
            )
        }
    ]), [locale])

    function fetchList() {
        setLoading(true)
        const params = new URLSearchParams({ type, page: String(page), pageSize: String(pageSize) })
        if (query.trim()) params.set('query', query.trim())
        get(`/hexopro/api/recycle/list?${params.toString()}`, {}).then((res: any) => {
            setList(res.data?.data || [])
            setTotal(res.data?.total || 0)
        }).catch((err: any) => {
            message.error(err.message)
        }).finally(() => setLoading(false))
    }

    useEffect(() => { fetchList() }, [type, page, pageSize])

    function onRestore(item?: RecycleItem) {
        const ids = item ? [item._id] : (selectedRowKeys as string[])
        if (ids.length === 0) return

        let strategy: 'keepBoth' | 'overwrite' | 'rename' = 'keepBoth'
        Modal.confirm({
            title: locale['recycle.restore.title'],
            content: (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>{locale['recycle.restore.desc']}</div>
                    <Radio.Group defaultValue={strategy} onChange={(e) => { strategy = e.target.value }}>
                        <Radio value="keepBoth">{locale['recycle.strategy.keepBoth']}</Radio>
                        <Radio value="overwrite">{locale['recycle.strategy.overwrite']}</Radio>
                        <Radio value="rename">{locale['recycle.strategy.rename']}</Radio>
                    </Radio.Group>
                </Space>
            ),
            onOk: async () => {
                try {
                    for (const id of ids) {
                        await post('/hexopro/api/recycle/restore', { id, conflictStrategy: strategy }, {})
                    }
                    message.success(locale['recycle.restore.success'])
                    setSelectedRowKeys([])
                    fetchList()
                } catch (e: any) {
                    message.error(e.message || locale['recycle.restore.failed'])
                }
            }
        })
    }

    function onDelete(item?: RecycleItem) {
        const ids = item ? [item._id] : (selectedRowKeys as string[])
        if (ids.length === 0) return
        Modal.confirm({
            title: locale['recycle.delete.title'],
            content: locale['recycle.delete.desc'],
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    for (const id of ids) {
                        await post('/hexopro/api/recycle/delete', { id }, {})
                    }
                    message.success(locale['recycle.delete.success'])
                    setSelectedRowKeys([])
                    fetchList()
                } catch (e: any) {
                    message.error(e.message || locale['recycle.delete.failed'])
                }
            }
        })
    }

    function onEmpty() {
        Modal.confirm({
            title: locale['recycle.empty.title'],
            content: locale['recycle.empty.desc'],
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await post('/hexopro/api/recycle/empty', { type }, {})
                    message.success(locale['recycle.empty.success'])
                    setSelectedRowKeys([])
                    setPage(1)
                    fetchList()
                } catch (e: any) {
                    message.error(e.message || locale['recycle.empty.failed'])
                }
            }
        })
    }

    return (
        <Card title={locale['menu.recycle']} bordered={false}>
            <Space style={{ marginBottom: 12 }} wrap>
                <Radio.Group value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}>
                    <Radio.Button value="all">{locale['recycle.filter.all']}</Radio.Button>
                    <Radio.Button value="post">{locale['navbar.search.tag.post']}</Radio.Button>
                    <Radio.Button value="page">{locale['navbar.search.tag.page']}</Radio.Button>
                </Radio.Group>
                <Input.Search style={{ width: 280 }} placeholder={locale['recycle.search.placeholder']} value={query} onChange={(e) => setQuery(e.target.value)} onSearch={() => { setPage(1); fetchList() }} allowClear />
                <Button onClick={() => onRestore()} disabled={selectedRowKeys.length === 0}>{locale['recycle.action.batchRestore']}</Button>
                <Button danger onClick={() => onDelete()} disabled={selectedRowKeys.length === 0}>{locale['recycle.action.batchDelete']}</Button>
                <Button danger onClick={onEmpty}>{locale['recycle.action.empty']}</Button>
            </Space>
            <Table
                rowKey="_id"
                loading={loading}
                dataSource={list}
                columns={columns}
                pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }}
                rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                locale={{ emptyText: <Empty description={locale['universal.empty']} /> }}
            />
        </Card>
    )
}



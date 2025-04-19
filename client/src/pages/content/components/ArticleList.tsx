import { Button, Image, Popconfirm, Space, TableProps, message, Row, Col, Card, Pagination, Dropdown, Typography } from "antd"
import { EllipsisOutlined, LinkOutlined } from "@ant-design/icons"
import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import service from "@/utils/api"
import useLocale from "@/hooks/useLocale"
import useDeviceDetect from "@/hooks/useDeviceDetect"
import { use } from "marked"


const { Text } = Typography;

interface Props {
    published?: boolean; // 保持可选状态
    isPage?: boolean;
    showPublishStatus?: boolean;
}

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



function ArticleList({ published, isPage = false, showPublishStatus = true }) {
    const isMobile = useDeviceDetect()
    const [postList, setPostList] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(isMobile ? 6 : 12) // 移动端使用较小的 pageSize
    const [total, setTotal] = useState(0)
    const navigate = useNavigate();

    const t = useLocale()

    const removeSource = async (item) => {
        try {
            // 执行删除操作
            const deleteApiPath = isPage ? '/hexopro/api/pages' : '/hexopro/api/posts';
            await service.get(`${deleteApiPath}/${base64Encode(item.permalink)}/remove`)

            // 重新查询数据并更新列表
            const listApiPath = isPage ? '/hexopro/api/pages/list' : '/hexopro/api/posts/list';
            const res = await service.get(listApiPath, { params: { published: published, page: currentPage, pageSize: pageSize } })
            const result = res.data.data.map((obj, i) => {
                return { _id: obj._id, title: obj.title, cover: obj.cover, date: obj.date, permalink: obj.permalink, updated: obj.updated, key: i + 1 }
            })

            // 更新列表
            setPostList(result)

            // 保持当前页码
            setCurrentPage(currentPage)
        } catch (err) {
            message.error(err.message)
        }
    }

    const handleTableChange = (pagination) => {
        setCurrentPage(pagination)
    }

    const queryPosts = () => {
        const listApiPath = isPage ? '/hexopro/api/pages/list' : '/hexopro/api/posts/list';
        service.get(listApiPath, { params: { published: published, page: currentPage, pageSize: pageSize } })
            .then(res => {
                const result = res.data.data.map((obj, i) => {
                    setTotal(res.data.total)
                    return { _id: obj._id, slug: obj.slug, title: obj.title, cover: obj.cover, date: obj.date, permalink: obj.permalink, source: obj.source, updated: obj.updated, key: i + 1 }
                })
                setPostList(result)
            })
    }

    // 添加 Base64 编码函数
    function base64Encode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    useEffect(() => {
        queryPosts()
    }, [])

    useEffect(() => {
        queryPosts()
    }, [currentPage, pageSize])

    useEffect(() => {
        setPageSize(isMobile ? 6 : 12)
    }, [isMobile])

    return (
        <div style={{
            padding: '16px 8px',
            // maxWidth: 1200,
            margin: '0 auto'
        }}>
            <Row gutter={[16, 16]}>
                {postList.map(item => (
                    <Col key={item._id} xs={24} sm={12} md={8} lg={8} xl={8}>
                        <Card
                            hoverable
                            cover={item.cover ? <Image
                                src={item.cover}
                                alt={item.title}
                                style={{
                                    height: 200,
                                    objectFit: 'cover',
                                    borderBottom: '1px solid #f0f0f0'
                                }}
                                preview={false}
                            /> : null}
                            style={{
                                transition: 'all 0.3s',
                                borderRadius: 8,
                                position: 'relative'
                            }}
                            onClick={() => !isPage ? navigate(`/post/${base64Encode(item.permalink)}`) : navigate(`/page/${base64Encode(item.permalink)}`)} // 使用 navigate 函数
                        >
                            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                                <Space>
                                    <Button
                                        type="text"
                                        style={{ color: 'rgba(0, 0, 0, 0.45)' }}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            window.open(item.permalink, '_blank');
                                        }}
                                        icon={<LinkOutlined />}
                                    >
                                    </Button>
                                    <Dropdown
                                        menu={{
                                            items: [
                                                {
                                                    key: 'edit',
                                                    label: (
                                                        <Link to={isPage ? `/page/${base64Encode(item.permalink)}/edit` : `/post/${base64Encode(item.permalink)}`} onClick={(event) => event.stopPropagation()}>
                                                            {t['content.articleList.btn.edit']}
                                                        </Link>
                                                    )
                                                },
                                                {
                                                    key: 'delete',
                                                    label: (
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <Popconfirm
                                                                title={t['editor.header.pop.title']}
                                                                description={t['list.editor.header.pop.des']}
                                                                onConfirm={(event) => { 
                                                                    if(event && event.stopPropagation) event.stopPropagation();
                                                                    removeSource(item) 
                                                                }}
                                                            >
                                                                <Text type="danger" onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    event.preventDefault();
                                                                }}>
                                                                    {t['content.articleList.btn.delete']}
                                                                </Text>
                                                            </Popconfirm>
                                                        </div>
                                                    )
                                                }
                                            ]
                                        }}
                                        placement="bottomRight"
                                    >
                                        <Button
                                            type="text"
                                            icon={<EllipsisOutlined />}
                                            style={{ color: 'rgba(0, 0, 0, 0.45)' }}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                            }}
                                        />
                                    </Dropdown>
                                </Space>
                            </div>

                            <Card.Meta
                                title={<Text ellipsis={{tooltip: item.title}} style={{maxWidth: 'calc(100% - 80px)'}}>{item.title}</Text>}
                                description={
                                    <div style={{ marginTop: 8 }}>
                                        <div>{t['content.articleList.table.date']}: {item.date}</div>
                                        <div style={{ marginTop: 4 }}>{t['content.articleList.table.updated']}: {item.updated}</div>
                                        {showPublishStatus && (
                                            <div style={{ marginTop: 4 }}>
                                                {published ? t['content.status.published'] : t['content.status.draft']}
                                            </div>
                                        )}
                                    </div>
                                }
                            />
                        </Card>
                    </Col>
                ))}
            </Row>
            <div style={{
                marginTop: 24,
                textAlign: 'center',
                padding: '16px 0',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Pagination
                    onChange={handleTableChange}
                    current={currentPage}
                    total={total}
                    pageSize={pageSize}
                    showSizeChanger={false}
                    responsive
                />
            </div>
        </div>
    )
}

export default ArticleList
import { Button, Image, Popconfirm, Space, TableProps, message, Row, Col, Card, Pagination, Dropdown, Typography, Modal, Form, Input } from "antd"
import { EllipsisOutlined, SendOutlined, RollbackOutlined } from "@ant-design/icons"
import React, { useContext, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import service from "@/utils/api"
import useLocale from "@/hooks/useLocale"
import useDeviceDetect from "@/hooks/useDeviceDetect"
import { use } from "marked"
import { GlobalContext } from "@/context"
import IconLink from "@/assets/link.svg"
import IconLinkLight from "@/assets/linkLight.svg"
import Iconllipsis from "@/assets/ellipsis.svg"
import IconllipsisLight from "@/assets/ellipsisLight.svg"

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
    const { isMobile } = useDeviceDetect()
    const { theme } = useContext(GlobalContext)
    const [postList, setPostList] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(isMobile ? 6 : 9) // 移动端使用较小的 pageSize
    const [total, setTotal] = useState(0)
    const navigate = useNavigate();

    // 新增状态管理封面设置对话框
    const [coverModalVisible, setCoverModalVisible] = useState(false);
    const [currentPost, setCurrentPost] = useState(null);
    const [form] = Form.useForm();
    // 添加一个状态来强制更新预览
    const [previewUrl, setPreviewUrl] = useState('');

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

    const openCoverModal = (item, e) => {
        e.stopPropagation();
        setCurrentPost(item);
        setCoverModalVisible(true);
        // 重置预览URL
        setPreviewUrl('');
        // 如果当前文章有封面，则设置为初始值
        if (item.cover) {
            form.setFieldsValue({ value: item.cover });
            setPreviewUrl(item.cover);
        }
    }

    const handleCoverSubmit = async () => {
        service.post('/hexopro/api/updateFrontMatter', {
            permalink: base64Encode(currentPost.permalink),
            key: form.getFieldValue('key'),
            value: form.getFieldValue('value')
        }).then(res => {
            if (res.status === 200) {
                message.success('封面设置成功')
                setCoverModalVisible(false)
                queryPosts()
            } else {
                message.error('封面设置失败')
            }
        })
    }

    // 添加发布和撤销发布的处理函数
    const handlePublish = async (item, e) => {
        e.stopPropagation();
        try {
            const publishApiPath = '/hexopro/api/posts/' + base64Encode(item.permalink) + '/publish';
            const res = await service.get(publishApiPath);
            if (res.status === 200) {
                message.success(t['content.articleList.publish.success'] || '文章发布成功');
                queryPosts();
            }
        } catch (err) {
            message.error(err.message || t['content.articleList.publish.error'] || '发布失败');
        }
    }

    const handleUnpublish = async (item, e) => {
        e.stopPropagation();
        try {
            const unpublishApiPath = '/hexopro/api/posts/' + base64Encode(item.permalink) + '/unpublish';
            const res = await service.get(unpublishApiPath);
            if (res.status === 200) {
                message.success(t['content.articleList.unpublish.success'] || '文章已撤回到草稿箱');
                queryPosts();
            }
        } catch (err) {
            message.error(err.message || t['content.articleList.unpublish.error'] || '撤回失败');
        }
    }

    const queryPosts = () => {
        console.log('queryPosts', pageSize)
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
        console.log('isMobile', typeof (isMobile))
        console.log('pageSize', isMobile ? 6 : 9)
        setPageSize(isMobile ? 6 : 9)
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
                                    height: 190,
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
                            onClick={() => !isPage ? navigate(`/post/${base64Encode(item.permalink)}`) : navigate(`/page/${base64Encode(item.permalink)}`)}
                        >
                            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                                <Space>
                                    {/* 添加发布/撤销发布按钮 */}
                                    {!isPage && (
                                        published ? (
                                            <Button
                                                type="text"
                                                style={{ color: 'rgba(0, 0, 0, 0.45)' }}
                                                onClick={(e) => handleUnpublish(item, e)}
                                                icon={<RollbackOutlined />}
                                                title={t['content.articleList.btn.unpublish'] || '撤回到草稿箱'}
                                            />
                                        ) : (
                                            <Button
                                                type="text"
                                                style={{ color: 'rgba(0, 0, 0, 0.45)' }}
                                                onClick={(e) => handlePublish(item, e)}
                                                icon={<SendOutlined />}
                                                title={t['content.articleList.btn.publish'] || '发布文章'}
                                            />
                                        )
                                    )}
                                    <Button
                                        type="text"
                                        style={{ color: 'rgba(0, 0, 0, 0.45)' }}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            window.open(item.permalink, '_blank');
                                        }}
                                        icon={theme === 'dark' ? <IconLinkLight /> : <IconLink />}
                                    >
                                    </Button>
                                    {/* 其他按钮保持不变 */}
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
                                                    key: 'setCover',
                                                    label: (
                                                        <div onClick={(e) => openCoverModal(item, e)}>
                                                            {t['content.articleList.btn.setCover'] || '封面'}
                                                        </div>
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
                                                                    if (event && event.stopPropagation) event.stopPropagation();
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
                                            icon={theme === 'dark' ? <IconllipsisLight /> : <Iconllipsis />}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                            }}
                                        />
                                    </Dropdown>
                                </Space>
                            </div>

                            <Card.Meta
                                title={<Text ellipsis={{ tooltip: item.title }} style={{ maxWidth: 'calc(100% - 80px)' }}>{item.title}</Text>}
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

            {/* 封面设置对话框 */}
            <Modal
                title={t['content.articleList.cover.title'] || '封面'}
                open={coverModalVisible}
                onOk={handleCoverSubmit}
                onCancel={() => setCoverModalVisible(false)}
                okText={t['content.articleList.cover.ok'] || '确定'}
                cancelText={t['content.articleList.cover.cancel'] || '取消'}
                width={isMobile ? '90%' : 520}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ key: 'cover', value: '' }}
                >
                    <Form.Item
                        name="key"
                        label={t['content.articleList.cover.keyLabel'] || '属性名称'}
                        rules={[{ required: true, message: t['content.articleList.cover.keyRequired'] || '请输入属性名称' }]}
                    >
                        <Input placeholder={t['content.articleList.cover.keyPlaceholder'] || '例如: cover'} />
                    </Form.Item>
                    // 在Modal部分修改Form.Item
                    <Form.Item
                        name="value"
                        label={t['content.articleList.cover.valueLabel'] || '图片URL'}
                        rules={[{ required: true, message: t['content.articleList.cover.valueRequired'] || '请输入图片URL' }]}
                    >
                        <Input
                            placeholder={t['content.articleList.cover.valuePlaceholder'] || '例如: https://example.com/image.jpg'}
                            onChange={(e) => {
                                // 当输入值变化时，更新预览URL
                                setPreviewUrl(e.target.value);
                            }}
                            onPaste={(e) => {
                                // 粘贴时立即更新预览URL
                                setTimeout(() => {
                                    const pastedValue = form.getFieldValue('value');
                                    setPreviewUrl(pastedValue);
                                }, 0);
                            }}
                        />
                    </Form.Item>
                    {/* 使用previewUrl状态而不是form.getFieldValue('value')来控制预览 */}
                    {previewUrl && (
                        <div style={{ marginTop: 16 }}>
                            <p>{t['content.articleList.cover.preview'] || '预览'}:</p>
                            <div style={{ position: 'relative' }}>
                                <Image
                                    src={previewUrl}
                                    alt="预览"
                                    style={{ maxWidth: '100%', maxHeight: 200 }}
                                    fallback="data:image/png;base64,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"
                                    onError={(e) => {
                                        message.error('图片链接无效，请检查URL');
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    textAlign: 'center',
                                    padding: '8px',
                                    display: 'none' // 默认隐藏，图片加载失败时显示
                                }}
                                    id="image-error-message">
                                    <Text type="danger">图片链接无效，请检查URL</Text>
                                </div>
                            </div>
                        </div>
                    )}
                </Form>
            </Modal>

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
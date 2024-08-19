import React, { useContext, useState } from "react";
import styles from './style/index.module.less'
import Logo from '@/assets/logo.svg'
import { Avatar, Button, Dropdown, Input, List, MenuProps, Modal, theme as antTheme } from "antd";
import { DownOutlined, MoonOutlined, PoweroffOutlined, SearchOutlined, SunFilled } from "@ant-design/icons";
import useLocale from "@/hooks/useLocale";
import { useSelector } from "react-redux";
import { GlobalState } from "@/store";
import service from "@/utils/api";
import { parseDateTime } from "@/utils/dateTimeUtils";
import { useNavigate } from "react-router-dom";
import useStorage from "@/utils/useStorage";
import { GlobalContext } from "@/context";

export default function Navbar() {
    const navigate = useNavigate()
    const userInfo = useSelector((state: GlobalState) => state.userInfo);
    const { theme, setTheme } = useContext(GlobalContext);
    const locale = useLocale()
    const [_, setUserStatus] = useStorage('userStatus');

    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [target, setTarget] = useState('Post')
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [searchInfoList, setSearchInfoList] = useState([])

    const writeDropList: MenuProps['items'] = [
        {
            key: '1',
            label: (
                <div>
                    写文章
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <div>
                    新页面
                </div>
            ),
        }
    ];

    const settingDropList: MenuProps['items'] = [
        {
            key: '1',
            label: (
                <div>
                    <PoweroffOutlined /> {locale['navbar.logout']}
                </div>
            ),
        }
    ]

    const handleCreateBlog: MenuProps['onClick'] = ({ key }) => {
        console.log('create blog')
        if (key === '1') {
            setOpen(true)
            setTarget('Post')
        } else if (key === '2') {
            console.log('create page')
            setOpen(true)
            setTarget('Page')
        }
    }

    const handleLogout: MenuProps['onClick'] = ({ key }) => {
        if (key === '1') {
            console.log('logout')
            setUserStatus('logout');
            window.location.href = '/pro/login';
        }
    }

    const onCancel = () => {
        setOpen(false)
    }

    const checkTitle = (title: string) => {
        if (!title || title.trim() === '' || title.length > 100) {
            return false
        }
        return true
    }

    const newPost = () => {
        if (!checkTitle(title)) {
            return
        }
        service.post('/hexopro/api/posts/new', { title: title }).then((res) => {
            const post = res.data
            post.date = parseDateTime(post.date)
            post.updated = parseDateTime(post.updated)
            navigate(`/post/${post._id}`);
        })
        setOpen(false)
    }

    function newPage() {
        if (!checkTitle(title)) return
        service.post('/hexopro/api/pages/new', { title: title }).then((res) => {
            const post = res.data
            post.date = parseDateTime(post.date)
            post.updated = parseDateTime(post.updated)
            navigate(`/page/${post._id}`);
        })
        setOpen(false)
    }

    const onSubmit = () => {
        console.log('submit', title)
        if (target === 'Post') {
            console.log('create article')
            newPost()
        } else if (target === 'Page') {
            console.log('create page')
            newPage()
        }
    }

    const onSearchClick = () => {
        setIsSearchModalOpen(true)
    }

    const handleSearchModalOK = () => {

    }

    function searchBlog(searchValue: string) {
        service.post('/hexopro/api/blog/search', { searchPattern: searchValue })
            .then(res => {
                const payLoad = res.data
                if (res.status == 200 && payLoad.code == 0) {
                    setSearchInfoList(payLoad.data)
                }
            }).catch(err => {

            })
    }

    const onSearchModalChange = (v) => {
        setSearchValue(v.target.value)
        // searchBlog(v.target.value)
    }

    const onSearchModalInput = (v) => {
        searchBlog(v.target.value)
    }

    const onClickSerchitem = (item) => {
        if (!item.isPage) {
            navigate(`/post/${item.id}`);
        } else {
            navigate(`/page/${item.id}`);
        }
    }

    return (
        <div className={`${styles.navbar} ${styles[theme]}`}>
            {/* 左侧 */}
            <div className={styles.left}>
                <div className={styles.logo}>
                    <Logo />
                    <div className={styles['logo-name']}>Hexo Pro</div>
                </div>
            </div>
            {/* 右侧 */}
            <ul className={styles.right}>
                <li>
                    <Button type="default" shape="circle" icon={<SearchOutlined />} onClick={onSearchClick} />
                </li>
                <li>
                    <Button type="default" shape="circle" icon={theme === 'dark' ? <SunFilled /> : <MoonOutlined />}
                        onClick={theme === 'light' ? () => setTheme('dark') : () => setTheme('light')}
                    />
                </li>
                <li >
                    <Dropdown menu={{ items: writeDropList, onClick: handleCreateBlog }}>
                        <Button type="default">{locale['navbar.create']}<DownOutlined /></Button>
                    </Dropdown>
                </li>
                {
                    userInfo && <li>
                        <Dropdown menu={{ items: settingDropList, onClick: handleLogout }}>
                            <Avatar size={32} style={{ cursor: "pointer" }} src={userInfo.avatar} />
                        </Dropdown>
                    </li>
                }
            </ul>
            <Modal
                open={open}
                title={locale['navbar.modal.title']}
                onCancel={onCancel}
                footer={
                    [
                        <Button key="back" onClick={onCancel}>{locale['navbar.modal.cancel']}</Button>,
                        <Button key="submit" type="primary" onClick={onSubmit}>{locale['navbar.modal.submit']}</Button>,
                    ]
                }
            >
                <Input placeholder={locale['navbar.modal.input.placeholder']} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Modal>
            <Modal width={700} title={locale['navbar.search.modal.title']} open={isSearchModalOpen} footer={[]} onCancel={() => setIsSearchModalOpen(false)}>
                <div>
                    <Input value={searchValue} placeholder={locale['navbar.search.modal.input.placeholder']}
                        onChange={onSearchModalChange}
                        onInput={onSearchModalInput}
                    />
                </div>
                <div>
                    <List
                        dataSource={searchInfoList}
                        renderItem={(item) => (
                            <List.Item>
                                <div>
                                    <div className={styles.searchListItemWapper}>
                                        <div className={styles.searchListTitlePrefix}></div>
                                        <span className={styles.searchListTitle} onClick={() => onClickSerchitem(item)}>{item.title}</span>
                                    </div>
                                    <div dangerouslySetInnerHTML={{ __html: item.context }}></div>
                                </div>
                            </List.Item>
                        )}
                    />
                </div>
            </Modal >
        </div >
    )
}

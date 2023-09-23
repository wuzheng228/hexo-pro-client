import React, { useContext, useEffect, useState, } from 'react';
import { connect } from 'react-redux';
import {
  Tooltip,
  Input,
  Avatar,
  Select,
  Dropdown,
  Menu,
  Divider,
  Message,
  Button,
  Modal,
} from '@arco-design/web-react';
import {
  IconLanguage,
  IconNotification,
  IconSunFill,
  IconMoonFill,
  IconUser,
  IconSettings,
  IconPoweroff,
  IconExperiment,
  IconDashboard,
  IconInteraction,
  IconTag,
  IconDown,
} from '@arco-design/web-react/icon';
import { useHistory } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { GlobalState } from '@/store';
import { GlobalContext } from '@/context';
import useLocale from '@/utils/useLocale';
import Logo from '@/assets/logo.svg';
import MessageBox from '@/components/MessageBox';
import IconButton from './IconButton';
import Settings from '../Settings';
import styles from './style/index.module.less';
import defaultLocale from '@/locale';
import useStorage from '@/utils/useStorage';
import { generatePermission } from '@/routes';
import { service } from '../../utils/api'
import { parseDateTime } from '@/utils/dateTimeUtils';

const mapStateToProps = (state) => {
  return state
}

function Navbar({ show }: { show: boolean }) {
  const history = useHistory();
  const t = useLocale();
  const userInfo = useSelector((state: GlobalState) => state.userInfo);
  const [postTitle, setPostTitle] = useState('Untitled');
  const [target, setTarget] = useState('Post')
  const [visible, setVisible] = useState(false);
  // const posts = useSelector((state: GlobalState) => state.posts);
  const dispatch = useDispatch();

  const [_, setUserStatus] = useStorage('userStatus');
  const [role, setRole] = useStorage('userRole', 'admin');

  const { setLang, lang, theme, setTheme } = useContext(GlobalContext);

  function logout() {
    setUserStatus('logout');
    window.location.href = '/login';
  }

  function onMenuItemClick(key) {
    if (key === 'logout') {
      logout();
    } else {
      Message.info(`You clicked ${key}`);
    }
  }

  function checkTitle(v) {
    if (!v || v.length == 0 || v.length < 3 || v.length > 32) {
      Message.error('标题长度不能小于3大于32!')
      return false
    }
    return true
  }

  function newPost() {
    if (!checkTitle(postTitle)) return
    service.post('/hexopro/api/posts/new', { title: postTitle }).then((res) => {
      const post = res.data
      post.date = parseDateTime(post.date)
      post.updated = parseDateTime(post.updated)
      history.push(`/post/${post._id}`);
    })
    setVisible(false)
  }

  function newPage() {
    if (!checkTitle(postTitle)) return
    service.post('/hexopro/api/pages/new', { title: postTitle }).then((res) => {
      const post = res.data
      post.date = parseDateTime(post.date)
      post.updated = parseDateTime(post.updated)
      history.push(`/page/${post._id}`);
    })
    setVisible(false)
  }

  useEffect(() => {
    dispatch({
      type: 'update-userInfo',
      payload: {
        userInfo: {
          ...userInfo,
          permissions: generatePermission(role),
        },
      },
    });
  }, [role]);

  if (!show) {
    return (
      <div className={styles['fixed-settings']}>
        <Settings
          trigger={
            <Button icon={<IconSettings />} type="primary" size="large" />
          }
        />
      </div>
    );
  }

  const handleChangeRole = () => {
    const newRole = role === 'admin' ? 'user' : 'admin';
    setRole(newRole);
  };

  const droplist = (
    <Menu onClickMenuItem={onMenuItemClick}>
      <Menu.SubMenu
        key="role"
        title={
          <>
            <IconUser className={styles['dropdown-icon']} />
            <span className={styles['user-role']}>
              {role === 'admin'
                ? t['menu.user.role.admin']
                : t['menu.user.role.user']}
            </span>
          </>
        }
      >
        {/* <Menu.Item onClick={handleChangeRole} key="switch role">
          <IconTag className={styles['dropdown-icon']} />
          {t['menu.user.switchRoles']}
        </Menu.Item> */}
      </Menu.SubMenu>
      <Menu.Item key="setting">
        <IconSettings className={styles['dropdown-icon']} />
        {t['menu.user.setting']}
      </Menu.Item>
      <Menu.SubMenu
        key="more"
        title={
          <div style={{ width: 80 }}>
            <IconExperiment className={styles['dropdown-icon']} />
            {t['message.seeMore']}
          </div>
        }
      >
        <Menu.Item key="workplace">
          <IconDashboard className={styles['dropdown-icon']} />
          {t['menu.dashboard.workplace']}
        </Menu.Item>
      </Menu.SubMenu>

      <Divider style={{ margin: '4px 0' }} />
      <Menu.Item key="logout">
        <IconPoweroff className={styles['dropdown-icon']} />
        {t['navbar.logout']}
      </Menu.Item>
    </Menu>
  );

  const writeDropList = (
    <Menu>
      <Menu.Item key='1' onClick={() => {
        setVisible(true)
        setTarget('Post')
      }}>写文章</Menu.Item>
      <Menu.Item key='2' onClick={() => {
        setVisible(true)
        setTarget('Page')
      }}>新页面</Menu.Item>
    </Menu>
  );


  return (
    <div className={styles.navbar}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <Logo />
          <div className={styles['logo-name']}>Hexo Pro</div>
        </div>
      </div>
      <ul className={styles.right}>
        {/* <li>
          <Input.Search
            className={styles.round}
            placeholder={t['navbar.search.placeholder']}
          />
        </li> */}
        <li>
          <Dropdown droplist={writeDropList} trigger='click'>
            <Button type='primary' >创作<IconDown /></Button>
          </Dropdown>
        </li>
        <li>
          <Select
            triggerElement={<IconButton icon={<IconLanguage />} />}
            options={[
              { label: '中文', value: 'zh-CN' },
              { label: 'English', value: 'en-US' },
            ]}
            value={lang}
            triggerProps={{
              autoAlignPopupWidth: false,
              autoAlignPopupMinWidth: true,
              position: 'br',
            }}
            trigger="hover"
            onChange={(value) => {
              setLang(value);
              const nextLang = defaultLocale[value];
              Message.info(`${nextLang['message.lang.tips']}${value}`);
            }}
          />
        </li>
        {/* <li>
          <MessageBox>
            <IconButton icon={<IconNotification />} />
          </MessageBox>
        </li> */}
        <li>
          <Tooltip
            content={
              theme === 'light'
                ? t['settings.navbar.theme.toDark']
                : t['settings.navbar.theme.toLight']
            }
          >
            <IconButton
              icon={theme !== 'dark' ? <IconMoonFill /> : <IconSunFill />}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            />
          </Tooltip>
        </li>
        <Settings />
        {userInfo && (
          <li>
            {/* <Dropdown droplist={droplist} position="br"> */}
            <Avatar size={32} style={{ cursor: 'pointer' }}>
              <img alt="avatar" src={userInfo.avatar} />
            </Avatar>
            {/* </Dropdown> */}
          </li>
        )}
      </ul>
      <Modal
        title='标题'
        visible={visible}
        onOk={() => {
          if (target == 'Post') {
            newPost()
          } else {
            newPage()
          }
        }}
        onCancel={() => setVisible(false)}
        autoFocus={false}
        focusLock={true}
      >
        <p>
          <Input style={{ width: '100%' }} allowClear placeholder='请输入标题' value={postTitle} onChange={setPostTitle} />
        </p>
      </Modal>
    </div>
  );
}

export default connect(mapStateToProps)(Navbar);

import React, { useEffect, useRef } from 'react';
import { Card, Button, TableColumnProps, Table, Image, Breadcrumb, Input } from '@arco-design/web-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import _ from 'lodash';

function Posts() {
  const inputRef = useRef(null)
  const [postsList, setPostsList] = React.useState(null)

  const queryPosts = () => {
    axios.get('/hexopro/api/posts/list')
      .then(res => {
        console.log(res)
        const result = res.data.map((obj, i) => {
          return { ...obj, key: i + 1 }
        });
        setPostsList(result)
      })
  }

  const columns: TableColumnProps[] = [
    {
      title: '封面',
      dataIndex: 'cover',
      render: (col, item, index) => {
        return (<Image width={200} height={133} src={item.cover} />)

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
        return (<span>{decodeURIComponent(item.permalink)}</span>)
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
          <Link to={`/post/${item._id}`}>
            <Button type='primary' size='mini' >编辑</Button>
          </Link>
        )
      }
    }
  ]

  useEffect(() => {
    queryPosts()
  }, []);

  return (
    <div>
      <Card style={{ height: '100%' }}>
        <Table columns={columns} data={postsList} />
      </Card>
    </div>

  );
}

export default Posts;

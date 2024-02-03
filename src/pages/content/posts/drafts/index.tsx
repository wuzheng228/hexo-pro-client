import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, TableColumnProps, Table, Image, Breadcrumb, Input, Space } from '@arco-design/web-react';
import service from '@/utils/api';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import { GlobalState } from '@/store';
import ArticleList from '../component/ArticleList';

function Drafts() {

  return (
    <div>
      <div>
        <ArticleList published={false} />
      </div>
    </div>

  );
}

export default Drafts;

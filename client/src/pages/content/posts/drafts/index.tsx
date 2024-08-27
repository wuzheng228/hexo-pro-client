import React from 'react'
import _ from 'lodash'
import ArticleList from '../../components/ArticleList'
import service from '@/utils/api'
import { useNavigate } from 'react-router-dom'
function Drafts() {
    return (
        <div>
            <div>
                <ArticleList published={false} />
            </div>
        </div>

    )
}

export default Drafts

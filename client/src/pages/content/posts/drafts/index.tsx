import React from 'react'
import ArticleList from '../../components/ArticleList'
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

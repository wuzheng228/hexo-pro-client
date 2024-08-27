import React from "react"
import ArticleList from "../../components/ArticleList"
import service from "@/utils/api"

export default function Blog() {


    return (
        <ArticleList published={true} />
    )
}
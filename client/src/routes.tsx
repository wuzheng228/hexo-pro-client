import React from "react"
import { useMemo, useState } from "react"
import useLocale from "./hooks/useLocale"
import Dashboard from "./pages/dashboard"

export type IRoute = {
  name: string
  key: string
  icon?: React.ReactNode,
  children?: IRoute[]
}


// export const routes: IRoute[] = [
//     {
//         key: 'posts',
//         name: 'menu.posts',
//         children: [
//             {
//                 name: 'menu.posts.blogs',
//                 key: 'content/posts/blogs',
//             },
//             {
//                 name: 'menu.posts.drafts',
//                 key: 'content/posts/drafts',
//             }
//         ],
//     },
//     {
//         name: 'menu.pages',
//         key: 'content/pages',
//     }
// ]

// // // 自定义钩子函数
// const useRoute = (): [IRoute[], string] => {

//     const [finalRoutes] = useState(routes)

//     const defaultRoute = useMemo(() => {
//         const first = finalRoutes[0]
//         if (first) {
//             const firstRoute = first?.children?.[0].key || first.key
//             return firstRoute
//         }
//         return ''
//     }, [finalRoutes])


//     return [finalRoutes, defaultRoute]
// }

export default function useRoute() {
  const t = useLocale()
  const routes = [
    {
      key: 'dashboard',
      name:'menu.dashboard',
    },
    {
      key: 'posts',
      name: 'menu.posts',
      children: [
        {
          name: 'menu.posts.blogs',
          key: 'content/posts/blogs',
        },
        {
          name: 'menu.posts.drafts',
          key: 'content/posts/drafts',
        }
      ],
    },
    {
      name: 'menu.pages',
      key: 'content/pages',
    },
    // 添加图床管理路由
    {
      name: 'menu.content.images',
      key: 'content/images',
    },
    // 添加YAML管理路由
    {
      name: 'menu.content.yaml',
      key: 'content/yaml',
    },
    // 添加部署管理路由
    {
      name: 'menu.deploy',
      key: 'deploy',
    }
  ]

  const [finalRoutes] = useState(routes)

  const defaultRoute = useMemo(() => {
    const first = finalRoutes[0]
    if (first) {
      const firstRoute = first?.children?.[0].key || first.key
      return firstRoute
    }
    return ''
  }, [finalRoutes])


  return [routes, defaultRoute]
}


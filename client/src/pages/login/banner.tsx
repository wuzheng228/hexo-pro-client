import React from "react"
import { Carousel } from "antd"
import styles from './style/index.module.less'

export default function LoginBanner() {
    const data = [
        {
            slogan: '思之所及，文之所至',
            subSlogan: 'Think it. Write it',
            image:
                'http://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/6c85f43aed61e320ebec194e6a78d6d3.png~tplv-uwbnlip3yd-png.png',
        }
    ]

    return (
        <Carousel className={styles["carousel"]} dots={false}>
            {
                data.map((item, index) => (
                    <div key={`${index}`} >
                        <div className={styles["carousel-item"]}>
                            <div className={styles["carousel-title"]}>{item.slogan}</div>
                            <div className={styles["carousel-sub-title"]}>{item.subSlogan}</div>
                            <img
                                alt="banner-image"
                                className={styles["carousel-image"]}
                                src={item.image}
                            />
                        </div>
                    </div>
                ))
            }
        </Carousel>
    )
}

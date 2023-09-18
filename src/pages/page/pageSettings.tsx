import React, { useEffect, useState } from "react";
import { Button, Checkbox, Grid, Modal, Space, Tag, Tooltip } from "@arco-design/web-react";
import { FrontMatterAdder } from "./frontMatterAdder";

const Row = Grid.Row;
const Col = Grid.Col;
const CheckboxGroup = Checkbox.Group

export function PageSettings({ visible, setVisible, pageMeta, setPageMeta, handleChange }) {
    // 添加使用的状态
    const [fmOpenStat, setFmOpenStat] = useState(false)
    const [originFms, setOriginFms] = useState([])


    return (
        <Modal
            title={
                <div style={{ textAlign: 'left' }}>
                    文章属性
                </div>
            }
            visible={visible}
            onCancel={() => {
                setVisible(false);
                console.log('cancel', originFms)
                setPageMeta({ ...pageMeta, frontMatter: originFms })
            }}
            onOk={() => {
                setVisible(false);
                handleChange({ frontMatter: pageMeta.frontMatter })
            }}
            afterOpen={() => {

                setOriginFms(pageMeta.frontMatter)
            }}
            style={{ width: 800 }}
        >
            <Row style={{ marginTop: 15, marginBottom: 15 }}>
                <Col>
                    <Space style={{ width: '100', flexWrap: 'wrap' }}>
                        {
                            /* 遍历渲染已有的fontMatter */
                            Object.keys(pageMeta.frontMatter).map((item, index) => {
                                return (
                                    <Tooltip key={index} content={!pageMeta.frontMatter[item] ? 'unset' : pageMeta.frontMatter[item]}>
                                        <Tag key={index} color="blue" style={{ marginBottom: 5 }}>{item}</Tag>
                                    </Tooltip>

                                )
                            })
                        }
                        <Button type='dashed'
                            onClick={() => {
                                setFmOpenStat(!fmOpenStat)
                            }}
                        >+自定义frontMatter</Button>
                    </Space>

                    {
                        /* todo 打开添加标签的界面 */
                        <FrontMatterAdder existFrontMatter={originFms} onClose={() => { setFmOpenStat(false) }} visible={fmOpenStat} title={'Font-Matter'} frontMatter={pageMeta.frontMatter} onChange={
                            (v) => {
                                const meta = { ...pageMeta, frontMatter: v }
                                setPageMeta(meta)
                                console.log(meta)
                            }
                        } />
                    }
                </Col>
            </Row>
        </Modal>
    )
}
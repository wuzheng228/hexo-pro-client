import React from 'react'
import { Modal, Pagination, Spin } from 'antd'
import type { ImageItem } from '../hooks/useImagePicker'

type Props = {
  title: string
  open: boolean
  loading: boolean
  images: ImageItem[]
  currentPage: number
  pageSize: number
  total: number
  emptyText: string
  onCancel: () => void
  onSelect: (imageUrl: string) => void
  onPageChange: (page: number) => void
}

const ImagePickerModal: React.FC<Props> = ({
  title,
  open,
  loading,
  images,
  currentPage,
  pageSize,
  total,
  emptyText,
  onCancel,
  onSelect,
  onPageChange,
}) => {
  return (
    <Modal title={title} open={open} onCancel={onCancel} footer={null} width={800}>
      <Spin spinning={loading}>
        {images.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              {images.map((image) => {
                const src = (image.url || image.path || '') as string
                const key = (image.path || image.url || image.name || src) as string
                return (
                  <div
                    key={key}
                    style={{
                      cursor: 'pointer',
                      border: '1px solid #f0f0f0',
                      borderRadius: '4px',
                      padding: '8px',
                      width: '120px',
                      height: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                    onClick={() => onSelect(src)}
                  >
                    <img
                      src={src}
                      alt={(image.name || '') as string}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                )
              })}
            </div>
            <div style={{ textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={onPageChange}
                showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <p>{emptyText}</p>
          </div>
        )}
      </Spin>
    </Modal>
  )
}

export default ImagePickerModal


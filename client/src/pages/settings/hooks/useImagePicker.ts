import { useCallback, useState } from 'react'
import service from '@/utils/api'

export type ImageItem = {
  name?: string
  path?: string
  url?: string
  [key: string]: any
}

type UseImagePickerResult = {
  open: boolean
  setOpen: (open: boolean) => void
  images: ImageItem[]
  loading: boolean
  currentPage: number
  pageSize: number
  total: number
  openPicker: () => Promise<void>
  fetchPage: (page: number) => Promise<void>
}

export function useImagePicker(pageSizeInitial = 12): UseImagePickerResult {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(pageSizeInitial)
  const [total, setTotal] = useState(0)

  const fetchPage = useCallback(
    async (page: number) => {
      setLoading(true)
      try {
        const res = await service.get('/hexopro/api/images/list', {
          params: { page, pageSize, folder: '' },
        })

        const timestamp = Date.now()
        const rawImages: ImageItem[] = res?.data?.images || []
        const mapped = rawImages.map((img) => {
          const src = img.url || img.path || ''
          const cacheBusted = src
            ? `${src}${src.includes('?') ? '&' : '?'}_t=${timestamp}`
            : src
          return {
            ...img,
            url: cacheBusted,
          }
        })

        setImages(mapped)
        setTotal(res?.data?.total || 0)
        setCurrentPage(page)
      } catch (e) {
        setImages([])
        setTotal(0)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [pageSize],
  )

  const openPicker = useCallback(async () => {
    setOpen(true)
    await fetchPage(1)
  }, [fetchPage])

  return {
    open,
    setOpen,
    images,
    loading,
    currentPage,
    pageSize,
    total,
    openPicker,
    fetchPage,
  }
}


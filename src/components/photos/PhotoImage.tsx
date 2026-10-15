import { useEffect, useRef, useState } from 'react'
import {
  createPhotoObjectUrl,
  revokePhotoObjectUrl,
} from '../../services/photoService'

interface PhotoImageProps {
  alt: string
  blob: Blob
  className?: string
}

const blobKeys = new WeakMap<Blob, number>()
let nextBlobKey = 0

function getBlobKey(blob: Blob): number {
  const existing = blobKeys.get(blob)
  if (existing !== undefined) return existing
  const key = nextBlobKey++
  blobKeys.set(blob, key)
  return key
}

function PhotoImageContent({ alt, blob, className }: PhotoImageProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const objectUrlRef = useRef<string | undefined>(undefined)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const objectUrl = createPhotoObjectUrl(blob)
    objectUrlRef.current = objectUrl
    if (imageRef.current) imageRef.current.src = objectUrl
    return () => {
      if (objectUrlRef.current) revokePhotoObjectUrl(objectUrlRef.current)
      objectUrlRef.current = undefined
    }
  }, [blob])

  if (failed) {
    return <div className={`grid place-items-center bg-slate-100 p-3 text-center text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300 ${className}`} role="alert">{alt}を読み込めませんでした。</div>
  }

  return <img alt={alt} className={className} onError={() => {
    if (objectUrlRef.current) revokePhotoObjectUrl(objectUrlRef.current)
    objectUrlRef.current = undefined
    setFailed(true)
  }} ref={imageRef} />
}

export function PhotoImage(props: PhotoImageProps) {
  return <PhotoImageContent key={getBlobKey(props.blob)} {...props} />
}


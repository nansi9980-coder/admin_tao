const MAX_HERO_BYTES = 4 * 1024 * 1024
const MAX_WIDTH = 1920
const MAX_HEIGHT = 1080
const JPEG_QUALITY = 0.82

/**
 * Réduit une image avant upload (évite les 413 sur l'API).
 * @returns {Promise<File>}
 */
export async function compressImageForUpload(file, { maxBytes = MAX_HERO_BYTES } = {}) {
  if (!file?.type?.startsWith('image/')) return file
  if (file.size <= maxBytes) return file

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  let { width, height } = bitmap
  const scale = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height)
  width = Math.max(1, Math.round(width * scale))
  height = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  let quality = JPEG_QUALITY
  let blob = await canvasToBlob(canvas, quality)
  while (blob && blob.size > maxBytes && quality > 0.45) {
    quality -= 0.1
    blob = await canvasToBlob(canvas, quality)
  }

  if (!blob || blob.size >= file.size) return file

  const baseName = (file.name || 'image').replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  })
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

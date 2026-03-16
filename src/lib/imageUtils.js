/** Compress an image File or Blob to ≤200KB and ≤800px on either dimension.
 *  Returns a Blob (image/jpeg). */
export async function compressImage(file) {
  const MAX_PX = 800
  const MAX_BYTES = 200 * 1024

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        const ratio = Math.min(MAX_PX / width, MAX_PX / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Iteratively reduce quality until under MAX_BYTES
      let quality = 0.85
      const tryEncode = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Canvas toBlob failed')); return }
            if (blob.size <= MAX_BYTES || quality <= 0.1) {
              resolve(blob)
            } else {
              quality = Math.max(quality - 0.1, 0.1)
              tryEncode()
            }
          },
          'image/jpeg',
          quality
        )
      }
      tryEncode()
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')) }
    img.src = objectUrl
  })
}

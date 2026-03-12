// Client-side EXIF extraction using exifr
// Called from the upload form after the user selects a file
export async function extractExif(file: File): Promise<{
  date_taken: string | null
  camera: string | null
  lens: string | null
}> {
  try {
    const exifr = await import('exifr')
    const data = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'Make', 'Model', 'LensModel'],
    })
    if (!data) return { date_taken: null, camera: null, lens: null }

    const date = data.DateTimeOriginal
      ? new Date(data.DateTimeOriginal).toISOString().split('T')[0]
      : null

    const camera =
      data.Make && data.Model
        ? `${data.Make} ${data.Model}`.trim()
        : data.Model ?? null

    return { date_taken: date, camera, lens: data.LensModel ?? null }
  } catch {
    return { date_taken: null, camera: null, lens: null }
  }
}

import express, { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { HttpError } from '../lib/safe-path.js'
import { buildObjectKey, objectExists, putObject, publicUrl } from '../lib/r2.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
})

export const uploadRouter: Router = express.Router()

const ALLOWED_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
  '.avif',
  '.ico',
])

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
}

uploadRouter.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, 'No file uploaded (field "file")')
    const original = req.file.originalname || 'image.png'
    let ext = path.extname(original).toLowerCase()
    if (!ext && req.file.mimetype) {
      const fromMime = Object.entries(MIME_BY_EXT).find(([, v]) => v === req.file!.mimetype)
      if (fromMime) ext = fromMime[0]
    }
    if (!ext) ext = '.png'
    if (!ALLOWED_EXT.has(ext)) {
      throw new HttpError(400, `Unsupported file type: ${ext}`)
    }
    const buf = req.file.buffer
    const key = buildObjectKey(buf, ext)
    const url = publicUrl(key)

    if (await objectExists(key)) {
      res.json({ ok: true, url, key, deduped: true })
      return
    }
    const contentType = MIME_BY_EXT[ext] || req.file.mimetype || 'application/octet-stream'
    await putObject(key, buf, contentType)
    res.json({ ok: true, url, key, deduped: false })
  } catch (e) {
    next(e)
  }
})

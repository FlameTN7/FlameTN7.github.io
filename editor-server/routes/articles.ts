import express, { Router } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { DOCS_DIR, VITEPRESS_DIR, DRAFTS_DIR } from '../lib/paths.js'
import {
  HttpError,
  assertValidCategory,
  assertValidFilename,
  resolveArticlePath,
  resolveCategoryDir,
} from '../lib/safe-path.js'
import { parseFrontmatter } from '../lib/frontmatter.js'

export const articlesRouter: Router = express.Router()

async function listCategories(): Promise<string[]> {
  const entries = await fs.readdir(DOCS_DIR, { withFileTypes: true })
  const out: string[] = []
  for (const e of entries) {
    if (!e.isDirectory()) continue
    if (e.name.startsWith('.')) continue
    const abs = path.join(DOCS_DIR, e.name)
    if (abs === VITEPRESS_DIR) continue
    // include if at least one .md exists or dir is empty (newly created)
    try {
      const inner = await fs.readdir(abs)
      const hasMd = inner.some((f) => f.endsWith('.md'))
      if (hasMd || inner.length === 0) out.push(e.name)
    } catch {
      // ignore
    }
  }
  return out.sort()
}

articlesRouter.get('/categories', async (_req, res, next) => {
  try {
    res.json({ categories: await listCategories() })
  } catch (e) {
    next(e)
  }
})

articlesRouter.post('/categories', async (req, res, next) => {
  try {
    const { name } = req.body as { name?: string }
    if (!name) throw new HttpError(400, 'name is required')
    assertValidCategory(name)
    const dir = resolveCategoryDir(name)
    await fs.mkdir(dir, { recursive: true })
    res.json({ ok: true, name })
  } catch (e) {
    next(e)
  }
})

articlesRouter.get('/categories/:category/articles', async (req, res, next) => {
  try {
    const { category } = req.params
    assertValidCategory(category)
    const dir = resolveCategoryDir(category)
    let entries: string[] = []
    try {
      entries = await fs.readdir(dir)
    } catch {
      throw new HttpError(404, 'Category not found')
    }
    const articles = []
    for (const f of entries) {
      if (!f.endsWith('.md')) continue
      const abs = path.join(dir, f)
      const stat = await fs.stat(abs)
      let title = f.replace(/\.md$/, '')
      let updated: string | undefined
      try {
        const raw = await fs.readFile(abs, 'utf8')
        const { data } = parseFrontmatter(raw)
        if (data.title) title = String(data.title)
        if (data.updated) updated = String(data.updated)
      } catch {
        // ignore parse errors
      }
      articles.push({
        filename: f,
        title,
        updated,
        mtime: stat.mtimeMs,
        size: stat.size,
      })
    }
    articles.sort((a, b) => b.mtime - a.mtime)
    res.json({ category, articles })
  } catch (e) {
    next(e)
  }
})

articlesRouter.get('/articles/:category/:filename', async (req, res, next) => {
  try {
    const { category, filename } = req.params
    const abs = resolveArticlePath(category, filename)
    const raw = await fs.readFile(abs, 'utf8').catch(() => {
      throw new HttpError(404, 'Article not found')
    })
    const stat = await fs.stat(abs)
    res.json({ content: raw, mtime: stat.mtimeMs })
  } catch (e) {
    next(e)
  }
})

articlesRouter.put('/articles/:category/:filename', async (req, res, next) => {
  try {
    const { category, filename } = req.params
    const { content, expectedMtime, create } = req.body as {
      content?: string
      expectedMtime?: number
      create?: boolean
    }
    if (typeof content !== 'string') throw new HttpError(400, 'content is required')
    const abs = resolveArticlePath(category, filename)
    await fs.mkdir(path.dirname(abs), { recursive: true })

    let exists = true
    try {
      await fs.access(abs)
    } catch {
      exists = false
    }

    if (!exists && !create) {
      throw new HttpError(404, 'Article does not exist; pass create:true to create')
    }
    if (exists && create) {
      throw new HttpError(409, 'Article already exists')
    }
    if (exists && typeof expectedMtime === 'number') {
      const stat = await fs.stat(abs)
      if (Math.abs(stat.mtimeMs - expectedMtime) > 1) {
        throw new HttpError(409, 'File was modified externally', )
      }
    }

    await fs.writeFile(abs, content, 'utf8')
    const stat = await fs.stat(abs)
    res.json({ ok: true, mtime: stat.mtimeMs })
  } catch (e) {
    next(e)
  }
})

articlesRouter.delete('/articles/:category/:filename', async (req, res, next) => {
  try {
    const { category, filename } = req.params
    const abs = resolveArticlePath(category, filename)
    await fs.unlink(abs).catch(() => {
      throw new HttpError(404, 'Article not found')
    })
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

articlesRouter.post('/articles/:category/:filename/move', async (req, res, next) => {
  try {
    const { category, filename } = req.params
    const { toCategory, toFilename } = req.body as {
      toCategory?: string
      toFilename?: string
    }
    if (!toCategory) throw new HttpError(400, 'toCategory is required')
    const src = resolveArticlePath(category, filename)
    const dest = resolveArticlePath(toCategory, toFilename || filename)
    await fs.mkdir(path.dirname(dest), { recursive: true })
    try {
      await fs.access(dest)
      throw new HttpError(409, 'Destination already exists')
    } catch (err) {
      if (err instanceof HttpError) throw err
    }
    await fs.rename(src, dest)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

articlesRouter.put('/drafts/:key', async (req, res, next) => {
  try {
    const { key } = req.params
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) throw new HttpError(400, 'invalid draft key')
    const { content } = req.body as { content?: string }
    if (typeof content !== 'string') throw new HttpError(400, 'content required')
    await fs.mkdir(DRAFTS_DIR, { recursive: true })
    await fs.writeFile(path.join(DRAFTS_DIR, key + '.draft.md'), content, 'utf8')
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

articlesRouter.get('/drafts/:key', async (req, res, next) => {
  try {
    const { key } = req.params
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) throw new HttpError(400, 'invalid draft key')
    const p = path.join(DRAFTS_DIR, key + '.draft.md')
    try {
      const content = await fs.readFile(p, 'utf8')
      const stat = await fs.stat(p)
      res.json({ content, mtime: stat.mtimeMs })
    } catch {
      res.json({ content: null })
    }
  } catch (e) {
    next(e)
  }
})

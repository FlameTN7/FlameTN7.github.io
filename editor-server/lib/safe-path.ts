import path from 'node:path'
import { DOCS_DIR, VITEPRESS_DIR } from './paths.js'

const FILENAME_RE = /^[a-zA-Z0-9._-]+$/
const CATEGORY_RE = /^[a-z0-9-]+$/

export function assertValidCategory(category: string) {
  if (!category || !CATEGORY_RE.test(category) || category.startsWith('.')) {
    throw new HttpError(400, `Invalid category name: ${category}`)
  }
  if (category === 'vitepress' || category === '.vitepress') {
    throw new HttpError(400, 'Reserved category')
  }
}

export function assertValidFilename(filename: string) {
  if (!filename || !FILENAME_RE.test(filename) || filename.startsWith('.')) {
    throw new HttpError(400, `Invalid filename: ${filename}`)
  }
  if (!filename.endsWith('.md')) {
    throw new HttpError(400, 'Filename must end with .md')
  }
}

export function resolveArticlePath(category: string, filename: string): string {
  assertValidCategory(category)
  assertValidFilename(filename)
  const target = path.resolve(DOCS_DIR, category, filename)
  const docsResolved = path.resolve(DOCS_DIR) + path.sep
  if (!target.startsWith(docsResolved)) {
    throw new HttpError(400, 'Path escape detected')
  }
  if (target.startsWith(path.resolve(VITEPRESS_DIR) + path.sep)) {
    throw new HttpError(400, 'Cannot operate inside .vitepress')
  }
  return target
}

export function resolveCategoryDir(category: string): string {
  assertValidCategory(category)
  const target = path.resolve(DOCS_DIR, category)
  const docsResolved = path.resolve(DOCS_DIR) + path.sep
  if (!target.startsWith(docsResolved)) {
    throw new HttpError(400, 'Path escape detected')
  }
  return target
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

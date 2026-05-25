import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const ROOT_DIR = path.resolve(__dirname, '..', '..')
export const DOCS_DIR = path.join(ROOT_DIR, 'docs')
export const VITEPRESS_DIR = path.join(DOCS_DIR, '.vitepress')
export const CONFIG_PATH = path.join(VITEPRESS_DIR, 'config.ts')
export const DRAFTS_DIR = path.join(__dirname, '..', '.drafts')
export const BACKUPS_DIR = path.join(__dirname, '..', '.backups')

export const PORT = Number(process.env.EDITOR_PORT || 5174)

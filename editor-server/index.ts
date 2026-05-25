import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

import express from 'express'
import cors from 'cors'
import { articlesRouter } from './routes/articles.js'
import { uploadRouter } from './routes/upload.js'
import { sidebarRouter } from './routes/sidebar.js'
import { HttpError } from './lib/safe-path.js'
import { PORT } from './lib/paths.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: Date.now() })
})

app.use('/api', articlesRouter)
app.use('/api', uploadRouter)
app.use('/api', sidebarRouter)

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[editor-server] error:', err)
    res.status(500).json({ error: msg })
  },
)

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[editor-server] listening on http://0.0.0.0:${PORT}`)
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[editor-server] ✖ 端口 ${PORT} 已被占用 —— 旧的 editor:server 可能还在跑。\n` +
        `  Windows: netstat -ano | findstr :${PORT}    然后 taskkill /F /PID <PID>\n` +
        `  macOS/Linux: lsof -i :${PORT}    然后 kill <PID>\n` +
        `  或修改 editor-server/.env 的 EDITOR_PORT 换一个端口。\n`,
    )
    process.exit(1)
  }
  console.error('[editor-server] server error:', err)
  process.exit(1)
})

// Graceful shutdown so the port is reliably released on Ctrl+C / kill.
function shutdown(reason: string) {
  console.log(`[editor-server] shutting down (${reason}) ...`)
  server.close(() => process.exit(0))
  // hard timeout in case close hangs
  setTimeout(() => process.exit(0), 3000).unref()
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGHUP', () => shutdown('SIGHUP'))

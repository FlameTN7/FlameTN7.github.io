import express, { Router } from 'express'
import { HttpError } from '../lib/safe-path.js'
import { readSidebar, writeSidebar, SidebarGroup } from '../lib/sidebar-edit.js'

export const sidebarRouter: Router = express.Router()

sidebarRouter.get('/sidebar', async (_req, res, next) => {
  try {
    res.json({ groups: await readSidebar() })
  } catch (e) {
    next(e)
  }
})

sidebarRouter.put('/sidebar', async (req, res, next) => {
  try {
    const { groups } = req.body as { groups?: SidebarGroup[] }
    if (!Array.isArray(groups)) throw new HttpError(400, 'groups array is required')
    for (const g of groups) {
      if (typeof g?.text !== 'string') throw new HttpError(400, 'group.text must be a string')
      if (!Array.isArray(g.items)) throw new HttpError(400, 'group.items must be an array')
      for (const it of g.items) {
        if (typeof it?.text !== 'string' || typeof it?.link !== 'string') {
          throw new HttpError(400, 'item.text and item.link must be strings')
        }
        if (!it.link.startsWith('/')) {
          throw new HttpError(400, `item.link must start with /: ${it.link}`)
        }
      }
    }
    await writeSidebar(groups)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

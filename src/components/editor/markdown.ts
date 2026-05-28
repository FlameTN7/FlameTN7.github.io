import MarkdownIt from 'markdown-it'
import type { Token } from 'markdown-it/index.js'
import mdContainer from 'markdown-it-container'
import { full as emojiPlugin } from 'markdown-it-emoji'
import taskListsPlugin from 'markdown-it-task-lists'

const CONTAINER_TYPES = ['tip', 'warning', 'danger', 'info', 'details'] as const
type ContainerType = (typeof CONTAINER_TYPES)[number]

const DEFAULT_TITLE: Record<ContainerType, string> = {
  tip: 'TIP',
  warning: 'WARNING',
  danger: 'DANGER',
  info: 'INFO',
  details: 'Details',
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function registerCustomContainer(md: MarkdownIt, type: ContainerType) {
  // @ts-expect-error markdown-it-container type doesn't perfectly match v14 MarkdownIt
  md.use(mdContainer, type, {
    validate(params: string) {
      return params.trim().startsWith(type)
    },
    render(tokens: Token[], idx: number) {
      const token = tokens[idx]
      if (!token) return ''
      const info = token.info.trim().slice(type.length).trim()
      const title = info || DEFAULT_TITLE[type]
      const renderedTitle = md.renderInline(title)
      if (token.nesting === 1) {
        if (type === 'details') {
          return `<details class="custom-block details"><summary>${renderedTitle}</summary>\n`
        }
        return `<div class="custom-block ${type}"><p class="custom-block-title">${renderedTitle}</p>\n`
      }
      return type === 'details' ? '</details>\n' : '</div>\n'
    },
  })
}

interface CodeGroupBlock {
  label: string
  lang: string
  code: string
}

function registerCodeGroup(md: MarkdownIt) {
  // @ts-expect-error markdown-it-container type doesn't perfectly match v14 MarkdownIt
  md.use(mdContainer, 'code-group', {
    validate(params: string) {
      return params.trim().startsWith('code-group')
    },
    render(tokens: Token[], idx: number) {
      const token = tokens[idx]
      if (!token || token.nesting !== 1) return ''
      const blocks: CodeGroupBlock[] = []
      for (let i = idx + 1; i < tokens.length; i++) {
        const t = tokens[i]
        if (!t) continue
        if (t.type === 'container_code-group_close') break
        if (t.type === 'fence') {
          const m = t.info.match(/^([^\s[]*)\s*\[([^\]]+)\]/)
          if (m) blocks.push({ lang: m[1] || '', label: m[2] || '', code: t.content.replace(/\n$/, '') })
        }
      }
      let html =
        '<div class="vp-code-group"><div class="tabs">' +
        blocks
          .map(
            (b, i) =>
              `<input type="radio" name="cg-${idx}" id="cg-${idx}-${i}"${
                i === 0 ? ' checked' : ''
              }/><label for="cg-${idx}-${i}">${escapeHtml(b.label)}</label>`,
          )
          .join('') +
        '</div><div class="blocks">'
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i]
        if (!b) continue
        const lang = b.lang || 'text'
        const rendered = `<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(b.code)}</code></pre>`
        html += `<div class="language-${escapeHtml(lang)}${i === 0 ? ' active' : ''}">${rendered}</div>`
      }
      html += '</div></div><!--cg-skip-start-->'
      return html
    },
  })

  // swallow the original close token (mark end of inner-fence skip zone)
  const origClose = md.renderer.rules['container_code-group_close']
  md.renderer.rules['container_code-group_close'] = (...args) => {
    const out = origClose ? origClose(...args) : ''
    return out + '<!--cg-skip-end-->'
  }
}

function postCleanCodeGroup(html: string): string {
  return html.replace(/<!--cg-skip-start-->[\s\S]*?<!--cg-skip-end-->/g, '')
}

let mermaidCounter = 0

function registerMermaidFence(md: MarkdownIt) {
  const defaultFence = md.renderer.rules.fence!
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    if (token.info.trim().startsWith('mermaid')) {
      const id = `mermaid-${++mermaidCounter}`
      const encoded = encodeURIComponent(token.content)
      return `<div class="mermaid-block" data-mermaid-id="${id}" data-mermaid-src="${encoded}"></div>\n`
    }
    return defaultFence(tokens, idx, options, env, self)
  }
}

export function createPreviewMarkdown(): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: false,
    typographer: false,
  })
  for (const t of CONTAINER_TYPES) registerCustomContainer(md, t)
  registerCodeGroup(md)
  registerMermaidFence(md)
  md.use(emojiPlugin)
  md.use(taskListsPlugin, { enabled: true })
  return md
}

const FM_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/

export function renderMarkdown(md: MarkdownIt, raw: string): string {
  const body = raw.replace(FM_RE, '')
  return postCleanCodeGroup(md.render(body))
}

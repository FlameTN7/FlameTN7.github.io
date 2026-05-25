export interface Frontmatter {
  title?: string
  published?: string
  updated?: string
  description?: string
  tags?: string[]
  [key: string]: unknown
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const m = raw.match(FM_RE)
  if (!m) return { data: {}, body: raw }
  const yaml = m[1]
  const data = parseSimpleYaml(yaml)
  const body = raw.slice(m[0].length)
  return { data, body }
}

function parseSimpleYaml(src: string): Frontmatter {
  const result: Frontmatter = {}
  const lines = src.split(/\r?\n/)
  let currentKey: string | null = null
  let currentArr: string[] | null = null

  for (const line of lines) {
    if (!line.trim()) continue
    const listItem = line.match(/^\s+-\s+(.*)$/)
    if (listItem && currentArr) {
      currentArr.push(stripQuotes(listItem[1].trim()))
      continue
    }
    const kv = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/)
    if (kv) {
      currentKey = kv[1]
      const valRaw = kv[2].trim()
      if (valRaw === '') {
        currentArr = []
        result[currentKey] = currentArr
      } else {
        result[currentKey] = stripQuotes(valRaw)
        currentArr = null
      }
    }
  }
  return result
}

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  return s
}

export function serializeFrontmatter(data: Frontmatter): string {
  const lines: string[] = ['---']
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) {
      lines.push(`${k}:`)
      for (const item of v) lines.push(`  - ${item}`)
    } else if (v == null || v === '') {
      lines.push(`${k}: `)
    } else {
      lines.push(`${k}: ${v}`)
    }
  }
  lines.push('---')
  return lines.join('\n') + '\n'
}

export function withFrontmatter(data: Frontmatter, body: string): string {
  const bodyNorm = body.startsWith('\n') ? body : '\n' + body
  return serializeFrontmatter(data) + bodyNorm
}

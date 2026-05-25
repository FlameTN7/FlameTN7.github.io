import fs from 'node:fs/promises'
import path from 'node:path'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
import _generate from '@babel/generator'
import type { Visitor, NodePath } from '@babel/traverse'
import type { GeneratorOptions, GeneratorResult } from '@babel/generator'
import * as t from '@babel/types'
import { CONFIG_PATH, BACKUPS_DIR } from './paths.js'

// @babel/traverse and @babel/generator are CJS modules; with nodenext/strict
// resolution the namespace default surface isn't callable.
type TraverseFn = (ast: t.File, visitor: Visitor) => void
type GenerateFn = (ast: t.Node, opts?: GeneratorOptions) => GeneratorResult
const traverse: TraverseFn =
  (_traverse as unknown as { default?: TraverseFn }).default ??
  (_traverse as unknown as TraverseFn)
const generate: GenerateFn =
  (_generate as unknown as { default?: GenerateFn }).default ??
  (_generate as unknown as GenerateFn)

export interface SidebarItem {
  text: string
  link: string
}

export interface SidebarGroup {
  text: string
  items: SidebarItem[]
}

function parseConfig(source: string) {
  return parse(source, {
    sourceType: 'module',
    plugins: ['typescript'],
  })
}

function findSidebarArray(ast: t.File): t.ArrayExpression | null {
  let target: t.ArrayExpression | null = null
  traverse(ast, {
    ObjectProperty(p: NodePath<t.ObjectProperty>) {
      if (target) return
      const key = p.node.key
      const isSidebar =
        (t.isIdentifier(key) && key.name === 'sidebar') ||
        (t.isStringLiteral(key) && key.value === 'sidebar')
      if (!isSidebar) return
      const parentObj = p.findParent((pp: NodePath) => pp.isObjectExpression())
      if (!parentObj) return
      const grandProp = parentObj.parentPath
      if (
        grandProp &&
        grandProp.isObjectProperty() &&
        ((t.isIdentifier(grandProp.node.key) && grandProp.node.key.name === 'themeConfig') ||
          (t.isStringLiteral(grandProp.node.key) && grandProp.node.key.value === 'themeConfig'))
      ) {
        if (t.isArrayExpression(p.node.value)) {
          target = p.node.value
        }
      }
    },
  })
  return target
}

export async function readSidebar(): Promise<SidebarGroup[]> {
  const source = await fs.readFile(CONFIG_PATH, 'utf8')
  const ast = parseConfig(source)
  const arr = findSidebarArray(ast)
  if (!arr) return []
  const groups: SidebarGroup[] = []
  for (const el of arr.elements) {
    if (!el || !t.isObjectExpression(el)) continue
    let text = ''
    const items: SidebarItem[] = []
    for (const prop of el.properties) {
      if (!t.isObjectProperty(prop)) continue
      const key = prop.key
      const keyName = t.isIdentifier(key) ? key.name : t.isStringLiteral(key) ? key.value : ''
      if (keyName === 'text' && t.isStringLiteral(prop.value)) {
        text = prop.value.value
      } else if (keyName === 'items' && t.isArrayExpression(prop.value)) {
        for (const ie of prop.value.elements) {
          if (!ie || !t.isObjectExpression(ie)) continue
          let itext = ''
          let ilink = ''
          for (const ip of ie.properties) {
            if (!t.isObjectProperty(ip)) continue
            const ikey = t.isIdentifier(ip.key)
              ? ip.key.name
              : t.isStringLiteral(ip.key)
                ? ip.key.value
                : ''
            if (ikey === 'text' && t.isStringLiteral(ip.value)) itext = ip.value.value
            if (ikey === 'link' && t.isStringLiteral(ip.value)) ilink = ip.value.value
          }
          if (itext && ilink) items.push({ text: itext, link: ilink })
        }
      }
    }
    if (text) groups.push({ text, items })
  }
  return groups
}

function buildSidebarAst(groups: SidebarGroup[]): t.ArrayExpression {
  return t.arrayExpression(
    groups.map((g) =>
      t.objectExpression([
        t.objectProperty(t.identifier('text'), t.stringLiteral(g.text)),
        t.objectProperty(
          t.identifier('items'),
          t.arrayExpression(
            g.items.map((it) =>
              t.objectExpression([
                t.objectProperty(t.identifier('text'), t.stringLiteral(it.text)),
                t.objectProperty(t.identifier('link'), t.stringLiteral(it.link)),
              ]),
            ),
          ),
        ),
      ]),
    ),
  )
}

async function backupConfig(source: string) {
  await fs.mkdir(BACKUPS_DIR, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  await fs.writeFile(path.join(BACKUPS_DIR, `config.${ts}.ts`), source, 'utf8')
}

/**
 * Render the sidebar array as a source snippet matching the project's style:
 * single quotes, no trailing semicolons inside the array, 2-space indent at
 * the array's column. We hand-render to avoid touching unrelated code.
 */
function renderSidebar(groups: SidebarGroup[], baseIndent: string): string {
  const indent = baseIndent
  const innerIndent = baseIndent + '  '
  const itemIndent = baseIndent + '    '
  const linkIndent = baseIndent + '      '
  const sq = (s: string) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
  const lines: string[] = ['[']
  for (const g of groups) {
    lines.push(`${innerIndent}{`)
    lines.push(`${itemIndent}text: ${sq(g.text)},`)
    if (g.items.length === 0) {
      lines.push(`${itemIndent}items: [],`)
    } else {
      lines.push(`${itemIndent}items: [`)
      for (const it of g.items) {
        lines.push(`${linkIndent}{ text: ${sq(it.text)}, link: ${sq(it.link)} },`)
      }
      lines.push(`${itemIndent}],`)
    }
    lines.push(`${innerIndent}},`)
  }
  lines.push(`${indent}]`)
  return lines.join('\n')
}

export async function writeSidebar(groups: SidebarGroup[]): Promise<void> {
  const source = await fs.readFile(CONFIG_PATH, 'utf8')
  const ast = parseConfig(source)
  const arr = findSidebarArray(ast)
  if (!arr) throw new Error('sidebar array not found in config.ts')

  const startOff = arr.start
  const endOff = arr.end
  if (startOff == null || endOff == null) {
    throw new Error('sidebar array location unavailable; cannot perform surgical edit')
  }

  // Detect indentation of the line where the sidebar array begins
  const lineStart = source.lastIndexOf('\n', startOff) + 1
  const before = source.slice(lineStart, startOff)
  // before looks like "    sidebar: " — extract the leading whitespace
  const indentMatch = before.match(/^(\s*)/)
  const baseIndent = indentMatch ? indentMatch[1] : '    '

  const snippet = renderSidebar(groups, baseIndent)
  const newSource = source.slice(0, startOff) + snippet + source.slice(endOff)

  // Verify the edited source still parses
  try {
    parseConfig(newSource)
  } catch (e) {
    throw new Error(`Refusing to write: edited config.ts no longer parses: ${(e as Error).message}`)
  }

  await backupConfig(source)
  await fs.writeFile(CONFIG_PATH, newSource, 'utf8')
}

// re-export generate/traverse so unused-import warnings don't fire — they are
// used by findSidebarArray (traverse) and reserved for future structural edits.
void generate

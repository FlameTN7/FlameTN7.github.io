import type { EditorView } from '@codemirror/view'

/**
 * Insert text at cursor / selection. If selectInside is provided, the final
 * selection is set to a sub-range of the inserted text.
 */
export function insertAtCursor(
  view: EditorView,
  text: string,
  opts: { selectFrom?: number; selectTo?: number } = {},
) {
  const { from, to } = view.state.selection.main
  view.dispatch({
    changes: { from, to, insert: text },
    selection:
      opts.selectFrom !== undefined && opts.selectTo !== undefined
        ? {
            anchor: from + opts.selectFrom,
            head: from + opts.selectTo,
          }
        : { anchor: from + text.length },
    scrollIntoView: true,
  })
  view.focus()
}

/** Wrap current selection with prefix/suffix. If no selection, insert placeholder. */
export function wrapSelection(
  view: EditorView,
  prefix: string,
  suffix: string,
  placeholder = '',
) {
  const { from, to } = view.state.selection.main
  const selected = view.state.doc.sliceString(from, to)
  const inner = selected || placeholder
  const insert = prefix + inner + suffix
  view.dispatch({
    changes: { from, to, insert },
    selection: selected
      ? { anchor: from + prefix.length, head: from + prefix.length + inner.length }
      : { anchor: from + prefix.length + inner.length },
    scrollIntoView: true,
  })
  view.focus()
}

export function insertContainer(view: EditorView, type: string, title = '') {
  const titlePart = title ? ' ' + title : ''
  const text = `:::${type}${titlePart}\n\n:::\n`
  // place cursor on the empty middle line
  const cursorOffset = `:::${type}${titlePart}\n`.length
  insertAtCursor(view, text, { selectFrom: cursorOffset, selectTo: cursorOffset })
}

export function insertCodeGroup(
  view: EditorView,
  blocks: { label: string; lang: string; code?: string }[],
) {
  const inner = blocks
    .map(
      (b) =>
        '```' +
        (b.lang || 'bash') +
        ' [' +
        b.label +
        ']\n' +
        (b.code ?? '') +
        '\n```',
    )
    .join('\n')
  const text = '::: code-group\n\n' + inner + '\n\n:::\n'
  insertAtCursor(view, text)
}

export function insertTable(view: EditorView, rows: number, cols: number, align: 'left' | 'center' | 'right' = 'left') {
  const sep = align === 'left' ? ':---' : align === 'right' ? '---:' : ':---:'
  const head = '| ' + Array.from({ length: cols }, (_, i) => `表头${i + 1}`).join(' | ') + ' |'
  const div = '| ' + Array.from({ length: cols }, () => sep).join(' | ') + ' |'
  const body = Array.from(
    { length: rows },
    () => '| ' + Array.from({ length: cols }, () => ' ').join(' | ') + ' |',
  ).join('\n')
  insertAtCursor(view, [head, div, body, ''].join('\n'))
}

export function insertHeading(view: EditorView, level: number) {
  const prefix = '#'.repeat(level) + ' '
  const { from } = view.state.selection.main
  const lineStart = view.state.doc.lineAt(from).from
  view.dispatch({
    changes: { from: lineStart, to: lineStart, insert: prefix },
    selection: { anchor: from + prefix.length },
  })
  view.focus()
}

export function insertHr(view: EditorView) {
  insertAtCursor(view, '\n---\n\n')
}

export function insertSoftBreak(view: EditorView) {
  insertAtCursor(view, '<br>')
}

export function insertTaskList(view: EditorView) {
  insertAtCursor(view, '- [ ] \n- [ ] \n- [x] \n')
}

export function todayDateString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function frontmatterTemplate(title = '', tags: string[] = []): string {
  const today = todayDateString()
  const tagLines = tags.length
    ? tags.map((t) => `  - ${t}`).join('\n')
    : '  - '
  return `---
title: ${title}
published: ${today}
updated: ${today}
description: ${title}
tags:
${tagLines}
---

`
}

import type { EditorView } from '@codemirror/view'
import { api } from '@/components/editor/api'
import { useEditorStore } from '@/stores/editor'

function generatePlaceholderId(): string {
  return Math.random().toString(36).slice(2, 8)
}

export interface UploadController {
  /** Initiate an upload at the current cursor position. Inserts placeholder, replaces with URL on success. */
  uploadFile(view: EditorView, file: File): Promise<void>
}

export function useImageUpload(): UploadController {
  const store = useEditorStore()

  async function uploadFile(view: EditorView, file: File) {
    if (!file.type.startsWith('image/')) {
      store.notify('仅支持图片文件', 'error')
      return
    }
    const id = generatePlaceholderId()
    const placeholder = `![上传中…${id}](uploading)`
    // insert placeholder at current cursor
    const { from } = view.state.selection.main
    view.dispatch({
      changes: { from, to: from, insert: placeholder },
      selection: { anchor: from + placeholder.length },
    })

    try {
      const res = await api.upload(file)
      const finalMd = `![](${res.url})`
      replacePlaceholder(view, placeholder, finalMd)
      store.notify(res.deduped ? '图片已存在(去重)，链接已插入' : '上传成功', 'success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      replacePlaceholder(view, placeholder, `<!-- 上传失败:${msg} -->`)
      store.notify(`上传失败: ${msg}`, 'error')
    }
  }

  return { uploadFile }
}

function replacePlaceholder(view: EditorView, placeholder: string, replacement: string) {
  const doc = view.state.doc.toString()
  const idx = doc.indexOf(placeholder)
  if (idx === -1) return
  view.dispatch({
    changes: { from: idx, to: idx + placeholder.length, insert: replacement },
  })
}

export function extractImageFiles(items: DataTransferItemList | null): File[] {
  if (!items) return []
  const out: File[] = []
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (!it) continue
    if (it.kind === 'file') {
      const f = it.getAsFile()
      if (f && f.type.startsWith('image/')) out.push(f)
    }
  }
  return out
}

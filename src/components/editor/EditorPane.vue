<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { EditorState, type Extension } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'

const props = defineProps<{
  modelValue: string
  readonly?: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'ready', view: EditorView): void
  (e: 'paste', ev: ClipboardEvent): void
  (e: 'drop', ev: DragEvent): void
}>()

const host = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null
let internalUpdate = false

function createView(initial: string): EditorView {
  const extensions: Extension[] = [
    lineNumbers(),
    history(),
    highlightActiveLine(),
    markdown(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.lineWrapping,
    EditorView.theme(
      {
        '&': {
          height: '100%',
          fontSize: '14px',
          backgroundColor: 'transparent',
          color: '#e2e8f0',
        },
        '.cm-scroller': {
          fontFamily:
            "'JetBrains Mono','Fira Code',Consolas,'Microsoft YaHei',monospace",
          lineHeight: '1.6',
        },
        '.cm-content': { caretColor: '#00f2ff' },
        '.cm-gutters': {
          backgroundColor: 'transparent',
          color: '#475569',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        },
        '.cm-activeLine': { backgroundColor: 'rgba(0, 242, 255, 0.04)' },
        '.cm-activeLineGutter': { backgroundColor: 'rgba(0, 242, 255, 0.04)' },
        '.cm-selectionBackground, ::selection': {
          backgroundColor: 'rgba(0, 242, 255, 0.2) !important',
        },
        '.cm-cursor': { borderLeftColor: '#00f2ff' },
      },
      { dark: true },
    ),
    EditorView.updateListener.of((u) => {
      if (u.docChanged && !internalUpdate) {
        emit('update:modelValue', u.state.doc.toString())
      }
    }),
    EditorView.domEventHandlers({
      paste: (ev) => {
        emit('paste', ev)
      },
      drop: (ev) => {
        emit('drop', ev)
      },
    }),
  ]
  if (props.readonly) {
    extensions.push(EditorState.readOnly.of(true))
  }
  return new EditorView({
    state: EditorState.create({ doc: initial, extensions }),
    parent: host.value!,
  })
}

onMounted(() => {
  view = createView(props.modelValue)
  emit('ready', view)
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

watch(
  () => props.modelValue,
  (val) => {
    if (!view) return
    const current = view.state.doc.toString()
    if (val === current) return
    internalUpdate = true
    view.dispatch({
      changes: { from: 0, to: current.length, insert: val },
    })
    internalUpdate = false
  },
)

defineExpose({
  getView: () => view,
})
</script>

<template>
  <div ref="host" class="h-full w-full overflow-hidden"></div>
</template>

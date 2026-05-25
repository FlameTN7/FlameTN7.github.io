<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { EditorView } from '@codemirror/view'
import { Save, FilePlus2, Files, Edit3, Eye, ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useEditorStore } from '@/stores/editor'
import FileTree from './FileTree.vue'
import EditorPane from './EditorPane.vue'
import PreviewPane from './PreviewPane.vue'
import Toolbar from './Toolbar.vue'
import ContainerDialog from './ContainerDialog.vue'
import TableDialog from './TableDialog.vue'
import { insertCodeGroup, insertTable } from './insert'
import { useImageUpload, extractImageFiles } from './useImageUpload'
import { useSplitter } from './useSplitter'
import { api } from './api'

const store = useEditorStore()
const router = useRouter()
const view = shallowRef<EditorView | null>(null)
const cgOpen = ref(false)
const tableOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const { uploadFile } = useImageUpload()

// Drag-resizable panes (desktop only). Widths persist in localStorage.
const filesSplit = useSplitter({
  storageKey: 'editor.filesWidth',
  defaultPx: 260,
  minPx: 160,
  maxPx: 520,
})
const previewSplit = useSplitter({
  storageKey: 'editor.previewWidth',
  defaultPx: 520,
  minPx: 280,
  maxPx: 1200,
  reverse: true,
})

const filesPanelStyle = computed(() =>
  isMobile.value ? '' : `flex: 0 0 ${filesSplit.width.value}px;`,
)
const previewPanelStyle = computed(() =>
  isMobile.value ? '' : `flex: 0 0 ${previewSplit.width.value}px;`,
)

const isMobile = ref(false)
function detect() {
  isMobile.value = window.innerWidth < 768
}
onMounted(() => {
  detect()
  window.addEventListener('resize', detect)
})
onBeforeUnmount(() => window.removeEventListener('resize', detect))

const editorContent = computed({
  get: () => store.content,
  set: (v: string) => {
    store.content = v
  },
})

function onReady(v: EditorView) {
  view.value = v
}

function onCgConfirm(blocks: { label: string; lang: string }[]) {
  if (view.value) insertCodeGroup(view.value, blocks)
  cgOpen.value = false
}

function onTableConfirm(p: { rows: number; cols: number; align: 'left' | 'center' | 'right' }) {
  if (view.value) insertTable(view.value, p.rows, p.cols, p.align)
  tableOpen.value = false
}

function pickImage() {
  fileInput.value?.click()
}

async function onFilePicked(e: Event) {
  const inp = e.target as HTMLInputElement
  if (!inp.files || !view.value) return
  for (const f of Array.from(inp.files)) {
    await uploadFile(view.value, f)
  }
  inp.value = ''
}

async function onPaste(ev: ClipboardEvent) {
  if (!view.value) return
  const files = extractImageFiles(ev.clipboardData?.items || null)
  if (!files.length) return
  ev.preventDefault()
  for (const f of files) await uploadFile(view.value, f)
}

async function onDrop(ev: DragEvent) {
  if (!view.value) return
  const files = extractImageFiles(ev.dataTransfer?.items || null)
  if (!files.length) return
  ev.preventDefault()
  for (const f of files) await uploadFile(view.value, f)
}

async function save() {
  if (!store.currentFilename) {
    store.notify('未打开任何文章', 'error')
    return
  }
  try {
    await store.save()
  } catch {
    // notify already done in store
  }
}

// keyboard shortcut: Ctrl/Cmd+S
function onKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    save()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// "Draft saved Xs ago" label — updates every 5s so it stays fresh.
const _now = ref(Date.now())
let nowTimer: number | null = null
onMounted(() => {
  nowTimer = window.setInterval(() => {
    _now.value = Date.now()
  }, 5000)
})
onBeforeUnmount(() => {
  if (nowTimer) clearInterval(nowTimer)
})

function formatDraftTime(ts: number): string {
  const diff = Math.max(0, _now.value - ts)
  const sec = Math.floor(diff / 1000)
  if (sec < 5) return '刚刚'
  if (sec < 60) return `${sec}秒前`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  return `${hr}小时前`
}

// Auto-save draft to backend:
//  - 5s after last keystroke (debounced, fast capture for short pauses)
//  - and every 60s unconditionally while dirty (covers long uninterrupted typing)
//  - 5s after last keystroke (debounced, fast capture for short pauses)
//  - and every 60s unconditionally while dirty (covers long uninterrupted typing)
let draftDebounceTimer: number | null = null
let draftPeriodicTimer: number | null = null
let lastSavedDraft = ''

function draftKey(): string | null {
  if (!store.currentCategory || !store.currentFilename) return null
  return `${store.currentCategory}__${store.currentFilename.replace(/\.md$/, '')}`
}

async function flushDraft() {
  const key = draftKey()
  if (!key || !store.isDirty) return
  if (store.content === lastSavedDraft) return
  const snapshot = store.content
  try {
    await api.saveDraft(key, snapshot)
    lastSavedDraft = snapshot
    store.lastDraftAt = Date.now()
  } catch {
    /* silent - draft save is best-effort */
  }
}

watch(
  () => store.content,
  () => {
    if (draftDebounceTimer) clearTimeout(draftDebounceTimer)
    draftDebounceTimer = window.setTimeout(flushDraft, 5000)
  },
)

// reset baseline draft tracking whenever the open file changes
watch(
  () => store.currentFilename,
  () => {
    lastSavedDraft = store.content
  },
)

onMounted(() => {
  draftPeriodicTimer = window.setInterval(flushDraft, 60_000)
})
onBeforeUnmount(() => {
  if (draftPeriodicTimer) clearInterval(draftPeriodicTimer)
  if (draftDebounceTimer) clearTimeout(draftDebounceTimer)
  // best-effort final flush on unmount
  flushDraft()
})

// Warn before navigating away if dirty
function onBeforeUnload(e: BeforeUnloadEvent) {
  if (store.isDirty) {
    e.preventDefault()
    e.returnValue = ''
  }
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <div class="root">
    <!-- Top bar -->
    <header class="topbar">
      <button class="back" @click="router.push('/')" title="返回主页">
        <ArrowLeft :size="16" />
      </button>
      <div class="title">
        <span class="brand">Ling 编辑器</span>
        <span v-if="store.currentFilename" class="filename">
          · {{ store.currentCategory }}/{{ store.currentFilename }}
          <span v-if="store.isDirty" class="dirty" title="有未保存的修改">●</span>
          <span v-if="store.lastDraftAt && store.isDirty" class="draft-hint">
            草稿 {{ formatDraftTime(store.lastDraftAt) }}
          </span>
        </span>
      </div>
      <div class="actions">
        <button class="act" @click="save" :disabled="!store.currentFilename || store.saving">
          <Save :size="14" /> {{ store.saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </header>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="store.message" :class="['toast', store.messageType]">
        {{ store.message }}
      </div>
    </transition>

    <!-- Mobile tab bar -->
    <div v-if="isMobile" class="mtabs">
      <button :class="{ on: store.mobileView === 'files' }" @click="store.mobileView = 'files'">
        <Files :size="14" /> 文件
      </button>
      <button :class="{ on: store.mobileView === 'edit' }" @click="store.mobileView = 'edit'">
        <Edit3 :size="14" /> 编辑
      </button>
      <button :class="{ on: store.mobileView === 'preview' }" @click="store.mobileView = 'preview'">
        <Eye :size="14" /> 预览
      </button>
    </div>

    <!-- Main grid -->
    <div :class="['main', { mobile: isMobile }]">
      <section
        v-if="!isMobile || store.mobileView === 'files'"
        class="panel files-panel"
        :style="filesPanelStyle"
      >
        <FileTree />
      </section>

      <div
        v-if="!isMobile"
        class="splitter"
        title="拖拽调整文件树宽度，双击重置"
        @mousedown.prevent="filesSplit.startDrag"
        @touchstart.prevent="filesSplit.startDrag"
        @dblclick="filesSplit.resetWidth"
      ></div>

      <section
        v-if="!isMobile || store.mobileView === 'edit'"
        class="panel edit-panel"
      >
        <Toolbar
          :view="view"
          @open-code-group="cgOpen = true"
          @open-table="tableOpen = true"
          @pick-image="pickImage"
        />
        <div class="edit-host">
          <EditorPane
            v-model="editorContent"
            @ready="onReady"
            @paste="onPaste"
            @drop="onDrop"
          />
        </div>
      </section>

      <div
        v-if="!isMobile"
        class="splitter"
        title="拖拽调整预览宽度，双击重置"
        @mousedown.prevent="previewSplit.startDrag"
        @touchstart.prevent="previewSplit.startDrag"
        @dblclick="previewSplit.resetWidth"
      ></div>

      <section
        v-if="!isMobile || store.mobileView === 'preview'"
        class="panel preview-panel"
        :style="previewPanelStyle"
      >
        <PreviewPane :content="store.content" />
      </section>
    </div>

    <!-- mobile bottom quick actions -->
    <div v-if="isMobile && store.mobileView === 'edit'" class="mfab">
      <button @click="pickImage" title="图片"><FilePlus2 :size="16" /></button>
      <button @click="save" :disabled="!store.currentFilename"><Save :size="16" /></button>
    </div>

    <ContainerDialog v-if="cgOpen" @close="cgOpen = false" @confirm="onCgConfirm" />
    <TableDialog v-if="tableOpen" @close="tableOpen = false" @confirm="onTableConfirm" />
    <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFilePicked" />
  </div>
</template>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #050509;
  color: #e2e8f0;
  overflow: hidden;
}
.topbar {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  background: rgba(15, 18, 25, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  gap: 12px;
  flex-shrink: 0;
}
.back {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 6px 8px;
  color: #cbd5e1;
  cursor: pointer;
}
.back:hover {
  color: #00f2ff;
  border-color: rgba(0, 242, 255, 0.4);
}
.title {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 8px;
  overflow: hidden;
}
.brand {
  font-weight: 700;
  color: #00f2ff;
  text-shadow: 0 0 12px rgba(0, 242, 255, 0.3);
}
.filename {
  color: #94a3b8;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dirty {
  color: #facc15;
  margin-left: 4px;
}
.draft-hint {
  color: #475569;
  font-size: 11px;
  margin-left: 8px;
}
.actions .act {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 242, 255, 0.1);
  color: #00f2ff;
  border: 1px solid rgba(0, 242, 255, 0.3);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}
.actions .act:hover:not(:disabled) {
  background: rgba(0, 242, 255, 0.2);
}
.actions .act:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid;
  backdrop-filter: blur(10px);
}
.toast.info {
  background: rgba(100, 116, 139, 0.2);
  border-color: rgba(148, 163, 184, 0.4);
  color: #cbd5e1;
}
.toast.success {
  background: rgba(0, 242, 255, 0.15);
  border-color: rgba(0, 242, 255, 0.4);
  color: #00f2ff;
}
.toast.error {
  background: rgba(248, 113, 113, 0.15);
  border-color: rgba(248, 113, 113, 0.4);
  color: #f87171;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s;
}

.main {
  flex: 1;
  display: flex;
  min-height: 0;
  min-width: 0;
}
.main.mobile {
  flex-direction: column;
}
.panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.edit-panel {
  flex: 1 1 auto;
  min-width: 200px;
}
.main.mobile .panel {
  flex: 1 1 auto;
  width: 100%;
}
.splitter {
  flex: 0 0 6px;
  background: rgba(255, 255, 255, 0.03);
  cursor: col-resize;
  position: relative;
  transition: background 0.15s;
}
.splitter:hover,
.splitter:active {
  background: rgba(0, 242, 255, 0.3);
}
.splitter::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 28px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 1px;
}
.splitter:hover::after {
  background: rgba(0, 242, 255, 0.6);
}
.edit-host {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.mtabs {
  display: flex;
  background: rgba(15, 18, 25, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.mtabs button {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: transparent;
  border: 0;
  padding: 10px 8px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.mtabs button.on {
  color: #00f2ff;
  border-bottom-color: #00f2ff;
  background: rgba(0, 242, 255, 0.05);
}

.mfab {
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 50;
}
.mfab button {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: rgba(0, 242, 255, 0.2);
  border: 1px solid rgba(0, 242, 255, 0.4);
  color: #00f2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 242, 255, 0.2);
}
.mfab button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>

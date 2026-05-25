<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EditorView } from '@codemirror/view'
import {
  Bold,
  Italic,
  Code,
  Link,
  Image,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  CornerDownLeft,
  ListChecks,
  Table as TableIcon,
  Lightbulb,
  AlertTriangle,
  ShieldAlert,
  Info,
  ChevronDown,
  Layers,
  Smile,
  FileText,
} from 'lucide-vue-next'
import {
  wrapSelection,
  insertAtCursor,
  insertContainer,
  insertHeading,
  insertHr,
  insertSoftBreak,
  insertTaskList,
  frontmatterTemplate,
} from './insert'
import { EMOJI_LIST } from './emoji-list'

const props = defineProps<{
  view: EditorView | null
}>()
const emit = defineEmits<{
  (e: 'openCodeGroup'): void
  (e: 'openTable'): void
  (e: 'pickImage'): void
}>()

const showEmoji = ref(false)
const showHeading = ref(false)
const emojiSearch = ref('')

const emojiFiltered = computed(() => {
  const q = emojiSearch.value.trim().toLowerCase()
  if (!q) return EMOJI_LIST
  return EMOJI_LIST.filter((e) => e.name.includes(q) || e.char.includes(q))
})

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || '')
const mod = isMac ? '⌘' : 'Ctrl'

function withView(fn: (v: EditorView) => void) {
  if (props.view) fn(props.view)
}

function applyHeading(lv: number) {
  withView((v) => insertHeading(v, lv))
  showHeading.value = false
}

function applyEmoji(code: string) {
  withView((v) => insertAtCursor(v, code))
}

function toggleEmoji() {
  showHeading.value = false
  showEmoji.value = !showEmoji.value
}

function toggleHeading() {
  showEmoji.value = false
  showHeading.value = !showHeading.value
}

function closeMenus() {
  showEmoji.value = false
  showHeading.value = false
}

// Hotkeys: register via window-level keydown so they work even when CodeMirror
// has focus. Browser-default shortcuts (Ctrl+B etc.) are pre-empted.
function bind(eventModifier: (e: KeyboardEvent) => boolean, key: string, fn: () => void) {
  return (e: KeyboardEvent) => {
    if (!eventModifier(e)) return
    if (e.key.toLowerCase() !== key) return
    e.preventDefault()
    fn()
  }
}
const mainMod = (e: KeyboardEvent) => (isMac ? e.metaKey : e.ctrlKey) && !e.altKey
const mainModShift = (e: KeyboardEvent) =>
  (isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && !e.altKey

const handlers = [
  bind(mainMod, 'b', () => withView((v) => wrapSelection(v, '**', '**', '粗体'))),
  bind(mainMod, 'i', () => withView((v) => wrapSelection(v, '*', '*', '斜体'))),
  bind(mainMod, 'e', () => withView((v) => wrapSelection(v, '`', '`', 'code'))),
  bind(mainMod, 'k', () => withView((v) => wrapSelection(v, '[', '](https://)', '链接文字'))),
  // Ctrl/Cmd+Enter inserts <br>
  bind(mainMod, 'enter', () => withView(insertSoftBreak)),
  // Ctrl/Cmd+H inserts horizontal rule (avoid Ctrl+R = reload)
  bind(mainModShift, 'h', () => withView(insertHr)),
  bind(mainModShift, '1', () => withView((v) => insertHeading(v, 1))),
  bind(mainModShift, '2', () => withView((v) => insertHeading(v, 2))),
  bind(mainModShift, '3', () => withView((v) => insertHeading(v, 3))),
  bind(mainModShift, '4', () => withView((v) => insertHeading(v, 4))),
  // Ctrl/Cmd+Shift+T = tip container (T for tip)
  bind(mainModShift, 't', () => withView((v) => insertContainer(v, 'tip'))),
  // Ctrl/Cmd+Shift+W = warning
  bind(mainModShift, 'w', () => withView((v) => insertContainer(v, 'warning'))),
  // Ctrl/Cmd+Shift+D = danger
  bind(mainModShift, 'd', () => withView((v) => insertContainer(v, 'danger'))),
  // Ctrl/Cmd+Shift+I = info
  bind(mainModShift, 'i', () => withView((v) => insertContainer(v, 'info'))),
  // Ctrl/Cmd+Shift+E = details (e = expand)
  bind(mainModShift, 'e', () => withView((v) => insertContainer(v, 'details', '点击展开'))),
  // Ctrl/Cmd+Shift+G = code-group
  bind(mainModShift, 'g', () => emit('openCodeGroup')),
  // Ctrl/Cmd+Shift+L = table (L for layout)
  bind(mainModShift, 'l', () => emit('openTable')),
  // Ctrl/Cmd+Shift+U = upload image (U for upload)
  bind(mainModShift, 'u', () => emit('pickImage')),
]

function onWindowKey(e: KeyboardEvent) {
  for (const h of handlers) h(e)
}

import { onMounted, onBeforeUnmount } from 'vue'
onMounted(() => window.addEventListener('keydown', onWindowKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onWindowKey))
</script>

<template>
  <div class="toolbar">
    <!-- Most common quick actions (front-loaded) -->
    <button
      class="tb-btn"
      @click="withView(insertSoftBreak)"
      :title="`软换行 <br> (${mod}+Enter)`"
    >
      <CornerDownLeft :size="16" />
    </button>
    <button class="tb-btn" @click="withView(insertHr)" :title="`分隔线 (${mod}+Shift+H)`">
      <Minus :size="16" />
    </button>
    <button class="tb-btn accent" @click="emit('pickImage')" :title="`上传图片 (${mod}+Shift+U)`">
      <Image :size="16" />
    </button>

    <div class="divider" />

    <!-- Inline formatting -->
    <button
      class="tb-btn"
      @click="withView((v) => wrapSelection(v, '**', '**', '粗体'))"
      :title="`粗体 (${mod}+B)`"
    >
      <Bold :size="16" />
    </button>
    <button
      class="tb-btn"
      @click="withView((v) => wrapSelection(v, '*', '*', '斜体'))"
      :title="`斜体 (${mod}+I)`"
    >
      <Italic :size="16" />
    </button>
    <button
      class="tb-btn"
      @click="withView((v) => wrapSelection(v, '`', '`', 'code'))"
      :title="`行内代码 (${mod}+E)`"
    >
      <Code :size="16" />
    </button>
    <button
      class="tb-btn"
      @click="withView((v) => wrapSelection(v, '[', '](https://)', '链接文字'))"
      :title="`链接 (${mod}+K)`"
    >
      <Link :size="16" />
    </button>

    <div class="divider" />

    <!-- Heading dropdown -->
    <div class="group">
      <button class="tb-btn" @click.stop="toggleHeading" :title="`标题 (${mod}+Shift+1~4)`">
        <Heading1 :size="16" />
        <ChevronDown :size="12" />
      </button>
      <div v-if="showHeading" class="dropdown">
        <button
          class="dd-item"
          v-for="lv in [1, 2, 3, 4]"
          :key="lv"
          @click="applyHeading(lv)"
        >
          <component :is="lv === 1 ? Heading1 : lv === 2 ? Heading2 : Heading3" :size="14" />
          H{{ lv }}
          <span class="kbd">{{ mod }}+⇧+{{ lv }}</span>
        </button>
      </div>
    </div>

    <div class="divider" />

    <!-- Containers -->
    <button
      class="tb-btn tip"
      @click="withView((v) => insertContainer(v, 'tip'))"
      :title="`tip (${mod}+Shift+T)`"
    >
      <Lightbulb :size="15" />
      <span class="lbl">tip</span>
    </button>
    <button
      class="tb-btn warn"
      @click="withView((v) => insertContainer(v, 'warning'))"
      :title="`warning (${mod}+Shift+W)`"
    >
      <AlertTriangle :size="15" />
      <span class="lbl">warn</span>
    </button>
    <button
      class="tb-btn danger"
      @click="withView((v) => insertContainer(v, 'danger'))"
      :title="`danger (${mod}+Shift+D)`"
    >
      <ShieldAlert :size="15" />
      <span class="lbl">danger</span>
    </button>
    <button
      class="tb-btn info"
      @click="withView((v) => insertContainer(v, 'info'))"
      :title="`info (${mod}+Shift+I)`"
    >
      <Info :size="15" />
      <span class="lbl">info</span>
    </button>
    <button
      class="tb-btn purple"
      @click="withView((v) => insertContainer(v, 'details', '点击展开'))"
      :title="`details (${mod}+Shift+E)`"
    >
      <ChevronDown :size="15" />
      <span class="lbl">details</span>
    </button>

    <div class="divider" />

    <button class="tb-btn accent" @click="emit('openCodeGroup')" :title="`代码组 (${mod}+Shift+G)`">
      <Layers :size="16" />
      <span class="lbl">code-group</span>
    </button>
    <button class="tb-btn" @click="emit('openTable')" :title="`表格 (${mod}+Shift+L)`">
      <TableIcon :size="16" />
    </button>
    <button class="tb-btn" @click="withView(insertTaskList)" title="任务列表">
      <ListChecks :size="16" />
    </button>

    <div class="divider" />

    <button
      class="tb-btn"
      @click="withView((v) => insertAtCursor(v, frontmatterTemplate()))"
      title="插入 frontmatter 模板"
    >
      <FileText :size="16" />
      <span class="lbl">FM</span>
    </button>

    <!-- Emoji dropdown -->
    <div class="group">
      <button class="tb-btn" @click.stop="toggleEmoji" title="Emoji">
        <Smile :size="16" />
        <ChevronDown :size="12" />
      </button>
      <div v-if="showEmoji" class="dropdown emoji-panel">
        <input
          v-model="emojiSearch"
          class="emoji-search"
          placeholder="搜索 emoji (如 smile / 笑)"
          autofocus
        />
        <div class="emoji-grid">
          <button
            v-for="e in emojiFiltered"
            :key="e.code"
            class="emoji-item"
            :title="e.code + ' — ' + e.name"
            @click="applyEmoji(e.code)"
          >
            {{ e.char }}
          </button>
          <div v-if="!emojiFiltered.length" class="emoji-empty">无匹配</div>
        </div>
      </div>
    </div>

    <div
      v-if="showEmoji || showHeading"
      class="catcher"
      @click="closeMenus"
    />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  background: rgba(20, 20, 25, 0.6);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  overflow-x: auto;
  scrollbar-width: thin;
  flex-wrap: nowrap;
  position: relative;
  z-index: 30;
}
.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.tb-btn:hover {
  background: rgba(0, 242, 255, 0.1);
  border-color: rgba(0, 242, 255, 0.3);
  color: #00f2ff;
}
.tb-btn.accent {
  border-color: rgba(0, 242, 255, 0.3);
  color: #00f2ff;
}
.tb-btn.tip:hover { color: #00f2ff; border-color: rgba(0, 242, 255, 0.4); }
.tb-btn.warn:hover { color: #facc15; border-color: rgba(250, 204, 21, 0.4); }
.tb-btn.danger:hover { color: #f87171; border-color: rgba(248, 113, 113, 0.4); }
.tb-btn.info:hover { color: #94a3b8; }
.tb-btn.purple:hover { color: #bd00ff; border-color: rgba(189, 0, 255, 0.4); }
.lbl { font-size: 11px; letter-spacing: 0.02em; }
.divider {
  width: 1px;
  align-self: stretch;
  background: rgba(255, 255, 255, 0.06);
  margin: 4px 4px;
}
.group { position: relative; }
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: rgba(15, 18, 25, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 4px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 160px;
  backdrop-filter: blur(20px);
}
.dd-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: transparent;
  border: 0;
  color: #cbd5e1;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  text-align: left;
}
.dd-item:hover { background: rgba(0, 242, 255, 0.1); color: #00f2ff; }
.kbd {
  margin-left: auto;
  font-size: 10px;
  color: #64748b;
  font-family: 'JetBrains Mono', monospace;
  padding: 1px 4px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 3px;
}

.emoji-panel {
  width: 320px;
  max-height: 360px;
  padding: 8px;
  gap: 6px;
}
.emoji-search {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  font-size: 12px;
  padding: 5px 8px;
  border-radius: 4px;
  outline: none;
}
.emoji-search:focus {
  border-color: rgba(0, 242, 255, 0.4);
}
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  overflow-y: auto;
  max-height: 290px;
  padding: 2px;
}
.emoji-item {
  background: transparent;
  border: 0;
  font-size: 18px;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  line-height: 1;
}
.emoji-item:hover {
  background: rgba(0, 242, 255, 0.1);
}
.emoji-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #64748b;
  font-size: 12px;
  padding: 20px;
}

.catcher {
  position: fixed;
  inset: 0;
  z-index: 40;
}
</style>

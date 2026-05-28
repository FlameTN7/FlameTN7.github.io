<script setup lang="ts">
import { computed, shallowRef, watch, nextTick, onMounted, useTemplateRef } from 'vue'
import { createPreviewMarkdown, renderMarkdown } from './markdown'
import { computeWordStats } from './stats'
import mermaid from 'mermaid'

const props = defineProps<{ content: string }>()
const md = shallowRef(createPreviewMarkdown())
const previewRef = useTemplateRef<HTMLElement>('previewEl')

const html = computed(() => renderMarkdown(md.value, props.content))
const stats = computed(() => computeWordStats(props.content))

let mermaidInitialized = false

function initMermaid() {
  if (mermaidInitialized) return
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#1e293b',
      primaryTextColor: '#e2e8f0',
      primaryBorderColor: '#00f2ff',
      lineColor: '#64748b',
      secondaryColor: '#0f172a',
      tertiaryColor: '#1e293b',
      noteTextColor: '#e2e8f0',
      noteBkgColor: '#1e293b',
      noteBorderColor: '#334155',
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    },
    flowchart: { curve: 'basis' },
    sequence: { mirrorActors: false },
  })
  mermaidInitialized = true
}

async function renderMermaidBlocks() {
  await nextTick()
  const el = previewRef.value
  if (!el) return
  const blocks = el.querySelectorAll('.mermaid-block')
  for (const block of blocks) {
    const id = block.getAttribute('data-mermaid-id')
    const src = block.getAttribute('data-mermaid-src')
    if (!id || !src) continue
    // Skip if already rendered
    if (block.querySelector('svg')) continue
    try {
      const code = decodeURIComponent(src)
      const { svg } = await mermaid.render(id + '-svg', code)
      block.innerHTML = svg
    } catch {
      block.innerHTML = `<pre class="mermaid-error" style="color:#f87171;font-size:0.85em;padding:12px;background:rgba(248,113,113,0.1);border-radius:6px;border:1px solid rgba(248,113,113,0.3)">Mermaid 渲染失败</pre>`
    }
  }
}

onMounted(() => {
  initMermaid()
  renderMermaidBlocks()
})

watch(
  () => props.content,
  () => {
    renderMermaidBlocks()
  },
)
</script>

<template>
  <div class="preview-wrap h-full overflow-auto">
    <div class="preview-stats">
      字数 <span>{{ stats.wordCount }}</span> · 阅读约
      <span>{{ stats.readingTime || '<1' }}</span> 分钟
    </div>
  <div ref="previewEl" class="vp-doc-emulate" v-html="html"></div>
  </div>
</template>

<style scoped>
.preview-wrap {
  padding: 24px 28px 80px;
  background: rgba(8, 10, 14, 0.6);
  color: #e2e8f0;
}
.preview-stats {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
}
.preview-stats span {
  color: #00f2ff;
}

/* ----- Article typography ----- */
.vp-doc-emulate :deep(h1),
.vp-doc-emulate :deep(h2),
.vp-doc-emulate :deep(h3),
.vp-doc-emulate :deep(h4) {
  font-weight: 700;
  color: #f1f5f9;
  margin: 1.5em 0 0.6em;
  line-height: 1.3;
}
.vp-doc-emulate :deep(h1) {
  font-size: 1.9em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.3em;
}
.vp-doc-emulate :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 0.3em;
}
.vp-doc-emulate :deep(h3) {
  font-size: 1.25em;
}
.vp-doc-emulate :deep(h4) {
  font-size: 1.1em;
}
.vp-doc-emulate :deep(p) {
  margin: 0.8em 0;
  line-height: 1.75;
}
.vp-doc-emulate :deep(a) {
  color: #00f2ff;
  text-decoration: underline;
  text-decoration-color: rgba(0, 242, 255, 0.4);
  text-underline-offset: 3px;
}
.vp-doc-emulate :deep(a:hover) {
  color: #35e1ff;
}
.vp-doc-emulate :deep(strong) {
  color: #f1f5f9;
}
.vp-doc-emulate :deep(em) {
  color: #cbd5e1;
}
.vp-doc-emulate :deep(hr) {
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 1.6em 0;
}
.vp-doc-emulate :deep(blockquote) {
  border-left: 3px solid #00f2ff;
  padding: 0.4em 1em;
  margin: 1em 0;
  background: rgba(0, 242, 255, 0.04);
  color: #94a3b8;
  border-radius: 0 6px 6px 0;
}
.vp-doc-emulate :deep(ul),
.vp-doc-emulate :deep(ol) {
  padding-left: 1.4em;
  margin: 0.8em 0;
}
.vp-doc-emulate :deep(li) {
  margin: 0.3em 0;
  line-height: 1.7;
}
.vp-doc-emulate :deep(img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 0.6em 0;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* ----- Inline code & code blocks ----- */
.vp-doc-emulate :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Microsoft YaHei', monospace;
  font-size: 0.875em;
  padding: 0.15em 0.4em;
  background: rgba(0, 242, 255, 0.1);
  color: #67e8f9;
  border-radius: 4px;
}
.vp-doc-emulate :deep(pre) {
  background: rgba(0, 0, 0, 0.5);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin: 1em 0;
}
.vp-doc-emulate :deep(pre code) {
  background: transparent;
  color: #e2e8f0;
  padding: 0;
  font-size: 0.85em;
  line-height: 1.6;
}

/* ----- Tables ----- */
.vp-doc-emulate :deep(table) {
  border-collapse: collapse;
  margin: 1em 0;
  display: block;
  overflow-x: auto;
}
.vp-doc-emulate :deep(th),
.vp-doc-emulate :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 14px;
}
.vp-doc-emulate :deep(th) {
  background: rgba(0, 242, 255, 0.08);
  color: #f1f5f9;
  font-weight: 600;
}
.vp-doc-emulate :deep(tr:nth-child(even) td) {
  background: rgba(255, 255, 255, 0.02);
}

/* ----- Custom blocks (tip/warning/danger/info/details) ----- */
.vp-doc-emulate :deep(.custom-block) {
  border-left: 4px solid;
  border-radius: 6px;
  padding: 14px 18px;
  margin: 1em 0;
  background: rgba(255, 255, 255, 0.03);
  font-size: 0.95em;
}
.vp-doc-emulate :deep(.custom-block .custom-block-title) {
  font-weight: 700;
  margin: 0 0 0.4em;
  font-size: 0.9em;
  letter-spacing: 0.04em;
}
.vp-doc-emulate :deep(.custom-block.tip) {
  border-color: #00f2ff;
  background: rgba(0, 242, 255, 0.08);
}
.vp-doc-emulate :deep(.custom-block.tip .custom-block-title) {
  color: #00f2ff;
}
.vp-doc-emulate :deep(.custom-block.info) {
  border-color: #64748b;
  background: rgba(100, 116, 139, 0.12);
}
.vp-doc-emulate :deep(.custom-block.info .custom-block-title) {
  color: #94a3b8;
}
.vp-doc-emulate :deep(.custom-block.warning) {
  border-color: #facc15;
  background: rgba(250, 204, 21, 0.08);
}
.vp-doc-emulate :deep(.custom-block.warning .custom-block-title) {
  color: #facc15;
}
.vp-doc-emulate :deep(.custom-block.danger) {
  border-color: #f87171;
  background: rgba(248, 113, 113, 0.1);
}
.vp-doc-emulate :deep(.custom-block.danger .custom-block-title) {
  color: #f87171;
}
.vp-doc-emulate :deep(.custom-block.details) {
  border-color: #bd00ff;
  background: rgba(189, 0, 255, 0.06);
}
.vp-doc-emulate :deep(.custom-block.details > summary) {
  cursor: pointer;
  color: #bd00ff;
  font-weight: 700;
  margin-bottom: 0.4em;
  outline: none;
}

/* ----- Code group (tabs) ----- */
.vp-doc-emulate :deep(.vp-code-group) {
  margin: 1em 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.vp-doc-emulate :deep(.vp-code-group .tabs) {
  display: flex;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0 8px;
}
.vp-doc-emulate :deep(.vp-code-group .tabs input[type='radio']) {
  display: none;
}
.vp-doc-emulate :deep(.vp-code-group .tabs label) {
  cursor: pointer;
  padding: 8px 14px;
  font-size: 0.85em;
  color: #94a3b8;
  border-bottom: 2px solid transparent;
  user-select: none;
}
.vp-doc-emulate :deep(.vp-code-group .tabs input:checked + label) {
  color: #00f2ff;
  border-bottom-color: #00f2ff;
}
.vp-doc-emulate :deep(.vp-code-group .blocks > div) {
  display: none;
}
.vp-doc-emulate :deep(.vp-code-group .blocks > div.active) {
  display: block;
}
.vp-doc-emulate :deep(.vp-code-group .blocks pre) {
  margin: 0;
  border-radius: 0;
  border: none;
}

/* Tabs cross-show logic: any checked radio toggles its corresponding block */
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(1):checked) .blocks > div:nth-child(1)),
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(2):checked) .blocks > div:nth-child(2)),
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(3):checked) .blocks > div:nth-child(3)),
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(4):checked) .blocks > div:nth-child(4)),
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(5):checked) .blocks > div:nth-child(5)),
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(6):checked) .blocks > div:nth-child(6)) {
  display: block;
}
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:checked) .blocks > div) {
  display: none;
}
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(1):checked) .blocks > div:nth-child(1)),
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(2):checked) .blocks > div:nth-child(2)),
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(3):checked) .blocks > div:nth-child(3)),
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(4):checked) .blocks > div:nth-child(4)),
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(5):checked) .blocks > div:nth-child(5)),
.vp-doc-emulate :deep(.vp-code-group:has(.tabs input:nth-of-type(6):checked) .blocks > div:nth-child(6)) {
  display: block;
}

/* Task lists */
.vp-doc-emulate :deep(.task-list-item) {
  list-style: none;
}
.vp-doc-emulate :deep(.task-list-item-checkbox) {
  margin-right: 0.4em;
  accent-color: #00f2ff;
}

/* ----- Mermaid blocks ----- */
.vp-doc-emulate :deep(.mermaid-block) {
  display: flex;
  justify-content: center;
  margin: 1.2em 0;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow-x: auto;
}
.vp-doc-emulate :deep(.mermaid-block svg) {
  max-width: 100%;
  height: auto;
}

/* ----- Inline code inside custom blocks ----- */
.vp-doc-emulate :deep(.custom-block code) {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Microsoft YaHei', monospace;
  font-size: 0.85em;
  padding: 0.15em 0.4em;
  background: rgba(0, 242, 255, 0.12);
  color: #67e8f9;
  border-radius: 4px;
}
.vp-doc-emulate :deep(.custom-block.warning code) {
  background: rgba(250, 204, 21, 0.15);
  color: #facc15;
}
.vp-doc-emulate :deep(.custom-block.danger code) {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}
.vp-doc-emulate :deep(.custom-block.info code) {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}
.vp-doc-emulate :deep(.custom-block.details code) {
  background: rgba(189, 0, 255, 0.15);
  color: #d946ef;
}
</style>

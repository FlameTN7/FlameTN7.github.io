<script setup lang="ts">
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const title = ref('')
const filename = ref('')
const category = ref(store.currentCategory || store.categories[0] || 'tutorial')
const newCategory = ref('')
const sidebarGroupMode = ref<'existing' | 'new' | 'none'>('existing')
const existingGroup = ref(store.sidebar[0]?.text || '')
const newGroup = ref('')
const sidebarItemText = ref('')
const tagsRaw = ref('')
const busy = ref(false)
const error = ref('')

const slugAutoFill = computed(() => {
  if (filename.value) return filename.value
  return title.value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
})

async function submit() {
  error.value = ''
  if (!title.value.trim()) return (error.value = '请输入标题')
  const fn = (filename.value || slugAutoFill.value).trim()
  if (!fn) return (error.value = '请输入文件名(slug)')
  const finalFilename = fn.endsWith('.md') ? fn : fn + '.md'
  if (!/^[a-zA-Z0-9._-]+$/.test(finalFilename)) {
    return (error.value = '文件名只能含字母数字与 . _ -')
  }

  let cat = category.value
  if (cat === '__new__') {
    if (!newCategory.value.trim()) return (error.value = '请输入新分类名')
    cat = newCategory.value.trim()
    if (!/^[a-z0-9-]+$/.test(cat)) {
      return (error.value = '新分类名只能含小写字母、数字和短横线')
    }
  }

  let sidebarGroup: string | null = null
  if (sidebarGroupMode.value === 'existing') {
    sidebarGroup = existingGroup.value || null
  } else if (sidebarGroupMode.value === 'new') {
    if (!newGroup.value.trim()) return (error.value = '请输入新分组名')
    sidebarGroup = newGroup.value.trim()
  }

  busy.value = true
  try {
    if (category.value === '__new__') {
      await store.createCategory(cat)
    }
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const todayStr = `${y}-${m}-${d}`
    const tags = tagsRaw.value
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const tagLines = tags.length ? tags.map((t) => `  - ${t}`).join('\n') : '  - '
    const content = `---
title: ${title.value}
published: ${todayStr}
updated: ${todayStr}
description: ${title.value}
tags:
${tagLines}
---

# **${title.value}**

`
    await store.createArticle(
      cat,
      finalFilename,
      content,
      sidebarGroup
        ? { groupText: sidebarGroup, itemText: sidebarItemText.value.trim() || title.value }
        : null,
    )
    emit('created')
    emit('close')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mask" @click.self="emit('close')">
    <div class="modal">
      <div class="head">
        <h3>新建文章</h3>
        <button @click="emit('close')" class="x"><X :size="16" /></button>
      </div>
      <div class="body">
        <label>
          <span>标题</span>
          <input v-model="title" placeholder="文章标题" />
        </label>
        <label>
          <span>文件名 (slug)</span>
          <input v-model="filename" :placeholder="slugAutoFill || 'my-article'" />
        </label>
        <label>
          <span>分类</span>
          <select v-model="category">
            <option v-for="c in store.categories" :key="c" :value="c">{{ c }}</option>
            <option value="__new__">+ 新建分类</option>
          </select>
        </label>
        <label v-if="category === '__new__'">
          <span>新分类名</span>
          <input v-model="newCategory" placeholder="kebab-case，如 notes" />
        </label>
        <label>
          <span>标签 (逗号分隔)</span>
          <input v-model="tagsRaw" placeholder="Rabi-Ribi, 联机" />
        </label>
        <div class="divider"></div>
        <label>
          <span>Sidebar 分组</span>
          <select v-model="sidebarGroupMode">
            <option value="existing">归入已有分组</option>
            <option value="new">新建分组</option>
            <option value="none">不加入 sidebar</option>
          </select>
        </label>
        <label v-if="sidebarGroupMode === 'existing'">
          <span>选择分组</span>
          <select v-model="existingGroup">
            <option v-for="g in store.sidebar" :key="g.text" :value="g.text">{{ g.text }}</option>
            <option v-if="!store.sidebar.length" disabled>(尚无分组)</option>
          </select>
        </label>
        <label v-if="sidebarGroupMode === 'new'">
          <span>新分组名</span>
          <input v-model="newGroup" placeholder="如 Rabi-Ribi" />
        </label>
        <label v-if="sidebarGroupMode !== 'none'">
          <span>Sidebar 链接文本</span>
          <input v-model="sidebarItemText" :placeholder="title || '默认与标题相同'" />
        </label>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
      <div class="foot">
        <button class="cancel" @click="emit('close')">取消</button>
        <button class="confirm" :disabled="busy" @click="submit">
          {{ busy ? '创建中...' : '创建' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  width: min(480px, 92vw);
  background: rgba(15, 18, 25, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.head {
  display: flex;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  align-items: center;
}
h3 {
  margin: 0;
  color: #f1f5f9;
  font-size: 15px;
}
.x {
  background: transparent;
  border: 0;
  color: #94a3b8;
  cursor: pointer;
}
.body {
  padding: 16px 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #94a3b8;
}
input,
select {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 6px 10px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
}
input:focus,
select:focus {
  border-color: rgba(0, 242, 255, 0.5);
}
.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 6px 0;
}
.error {
  margin: 4px 0 0;
  color: #f87171;
  font-size: 12px;
}
.foot {
  padding: 12px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.foot button {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
}
.cancel {
  background: rgba(255, 255, 255, 0.04);
  color: #cbd5e1;
  border-color: rgba(255, 255, 255, 0.08);
}
.confirm {
  background: rgba(0, 242, 255, 0.15);
  color: #00f2ff;
  border-color: rgba(0, 242, 255, 0.4);
}
.confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

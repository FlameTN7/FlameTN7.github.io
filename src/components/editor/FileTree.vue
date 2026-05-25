<script setup lang="ts">
import { ref } from 'vue'
import { FileText, Plus, Trash2, Folder, FolderPlus } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editor'
import NewArticleDialog from './NewArticleDialog.vue'

const store = useEditorStore()
const showNew = ref(false)

async function onCategoryChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  if (v === '__new__') {
    const name = prompt('新分类名 (kebab-case，如 notes)：')?.trim()
    if (!name) {
      ;(e.target as HTMLSelectElement).value = store.currentCategory || ''
      return
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      alert('只能包含小写字母、数字、短横线')
      ;(e.target as HTMLSelectElement).value = store.currentCategory || ''
      return
    }
    try {
      await store.createCategory(name)
    } catch (err) {
      alert((err as Error).message)
    }
  } else {
    await store.selectCategory(v)
  }
}

function fmtDate(s?: string) {
  return s ? s.split(' ')[0] : ''
}
</script>

<template>
  <aside class="filetree h-full flex flex-col">
    <div class="head">
      <div class="cat-row">
        <Folder :size="14" class="text-cyan-400" />
        <select
          :value="store.currentCategory || ''"
          @change="onCategoryChange"
          class="cat-select"
        >
          <option v-for="c in store.categories" :key="c" :value="c">{{ c }}</option>
          <option value="__new__">+ 新建分类</option>
        </select>
      </div>
      <button class="new-btn" @click="showNew = true" title="新建文章">
        <Plus :size="14" /> 新文章
      </button>
    </div>

    <ul class="list">
      <li
        v-for="a in store.articles"
        :key="a.filename"
        :class="['item', { active: a.filename === store.currentFilename }]"
      >
        <button class="item-main" @click="store.openArticle(a.filename)">
          <FileText :size="13" class="ic" />
          <div class="meta">
            <div class="title">{{ a.title }}</div>
            <div class="sub">
              <span>{{ a.filename }}</span>
              <span v-if="a.updated">· {{ fmtDate(a.updated) }}</span>
            </div>
          </div>
        </button>
        <button class="del-btn" @click="store.deleteArticle(a.filename)" title="删除">
          <Trash2 :size="13" />
        </button>
      </li>
      <li v-if="!store.articles.length" class="empty">
        <FolderPlus :size="24" />
        <p>分类为空,点击 "新文章" 创建</p>
      </li>
    </ul>

    <NewArticleDialog
      v-if="showNew"
      @close="showNew = false"
      @created="showNew = false"
    />
  </aside>
</template>

<style scoped>
.filetree {
  background: rgba(15, 18, 25, 0.5);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  width: 100%;
}
.head {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.cat-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cat-select {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 5px 8px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
}
.cat-select:focus {
  border-color: rgba(0, 242, 255, 0.4);
}
.new-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 242, 255, 0.1);
  color: #00f2ff;
  border: 1px solid rgba(0, 242, 255, 0.3);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}
.new-btn:hover {
  background: rgba(0, 242, 255, 0.2);
}
.list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  flex: 1;
}
.item {
  display: flex;
  align-items: stretch;
  gap: 2px;
  border-radius: 6px;
  margin-bottom: 2px;
  overflow: hidden;
}
.item:hover {
  background: rgba(255, 255, 255, 0.04);
}
.item.active {
  background: rgba(0, 242, 255, 0.08);
}
.item-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 0;
  color: #cbd5e1;
  padding: 8px 10px;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
}
.ic {
  color: #64748b;
  flex-shrink: 0;
}
.item.active .ic,
.item.active .title {
  color: #00f2ff;
}
.meta {
  flex: 1;
  overflow: hidden;
}
.title {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub {
  font-size: 11px;
  color: #64748b;
  display: flex;
  gap: 4px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.del-btn {
  background: transparent;
  border: 0;
  color: #475569;
  padding: 6px 8px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}
.item:hover .del-btn {
  opacity: 1;
}
.del-btn:hover {
  color: #f87171;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  color: #475569;
  text-align: center;
  font-size: 12px;
}
.empty p {
  margin: 0;
}
</style>

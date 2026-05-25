<script setup lang="ts">
import { onMounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import EditorLayout from '@/components/editor/EditorLayout.vue'

const store = useEditorStore()

onMounted(async () => {
  try {
    await store.loadCategories()
    await store.loadSidebar()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    store.notify(`后端连接失败: ${msg}`, 'error')
  }
})
</script>

<template>
  <EditorLayout />
</template>

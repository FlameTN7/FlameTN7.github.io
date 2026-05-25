<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Trash2, X } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', blocks: { label: string; lang: string }[]): void
}>()

interface Row {
  label: string
  lang: string
}
const rows = ref<Row[]>([
  { label: '选项1', lang: 'bash' },
  { label: '选项2', lang: 'yaml' },
])

function add() {
  rows.value.push({ label: `选项${rows.value.length + 1}`, lang: 'bash' })
}
function remove(i: number) {
  if (rows.value.length > 1) rows.value.splice(i, 1)
}
function confirm() {
  emit('confirm', rows.value.filter((r) => r.label.trim()))
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal">
      <div class="head">
        <h3>插入 code-group</h3>
        <button @click="emit('close')" class="x"><X :size="16" /></button>
      </div>
      <div class="body">
        <p class="hint">每行一个标签 — 提示：VitePress 中 code-group 仅 bash/yaml 高亮稳定。</p>
        <div v-for="(r, i) in rows" :key="i" class="row">
          <input v-model="r.label" placeholder="标签名" class="ipt label" />
          <select v-model="r.lang" class="ipt lang">
            <option>bash</option>
            <option>yaml</option>
            <option>js</option>
            <option>ts</option>
            <option>python</option>
            <option>json</option>
            <option>html</option>
            <option>css</option>
            <option>text</option>
          </select>
          <button class="del" @click="remove(i)" :disabled="rows.length <= 1">
            <Trash2 :size="14" />
          </button>
        </div>
        <button class="add" @click="add"><Plus :size="14" /> 添加一项</button>
      </div>
      <div class="foot">
        <button class="cancel" @click="emit('close')">取消</button>
        <button class="confirm" @click="confirm">插入</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-mask {
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
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow: hidden;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
  padding: 4px;
}
.body {
  padding: 16px 18px;
  overflow-y: auto;
}
.hint {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 12px;
}
.row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.ipt {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 6px 10px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
}
.ipt:focus {
  border-color: rgba(0, 242, 255, 0.5);
}
.label {
  flex: 1;
}
.lang {
  width: 100px;
}
.del {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 6px;
  color: #94a3b8;
  cursor: pointer;
}
.del:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.del:not(:disabled):hover {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.4);
}
.add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 6px 12px;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
  margin-top: 4px;
}
.add:hover {
  color: #00f2ff;
  border-color: rgba(0, 242, 255, 0.4);
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
.cancel:hover {
  background: rgba(255, 255, 255, 0.08);
}
.confirm {
  background: rgba(0, 242, 255, 0.15);
  color: #00f2ff;
  border-color: rgba(0, 242, 255, 0.4);
}
.confirm:hover {
  background: rgba(0, 242, 255, 0.25);
}
</style>

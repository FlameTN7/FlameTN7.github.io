<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: { rows: number; cols: number; align: 'left' | 'center' | 'right' }): void
}>()
const rows = ref(2)
const cols = ref(3)
const align = ref<'left' | 'center' | 'right'>('left')
</script>

<template>
  <div class="mask" @click.self="emit('close')">
    <div class="modal">
      <div class="head">
        <h3>插入表格</h3>
        <button @click="emit('close')" class="x"><X :size="16" /></button>
      </div>
      <div class="body">
        <label>行数 <input type="number" min="1" max="20" v-model.number="rows" /></label>
        <label>列数 <input type="number" min="1" max="10" v-model.number="cols" /></label>
        <label>对齐
          <select v-model="align">
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
          </select>
        </label>
      </div>
      <div class="foot">
        <button class="cancel" @click="emit('close')">取消</button>
        <button class="confirm" @click="emit('confirm', { rows, cols, align })">插入</button>
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
  width: min(360px, 92vw);
  background: rgba(15, 18, 25, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
}
label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #cbd5e1;
  font-size: 13px;
}
input,
select {
  width: 140px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 5px 8px;
  color: #e2e8f0;
  outline: none;
}
input:focus,
select:focus {
  border-color: rgba(0, 242, 255, 0.5);
}
.foot {
  padding: 12px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
button.cancel,
button.confirm {
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
</style>

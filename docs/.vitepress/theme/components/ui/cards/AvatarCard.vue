<template>
  <div class="card-base flex flex-col items-center justify-center gap-4 p-4 relative">
    <div
      class="absolute -top-4 -left-4 w-12 h-12 rounded-full text-brand shadow-md transform -rotate-18"
    >
      <Cat :size="32" />
    </div>
    <div class="avatar">
      <img src="../../../assets/images/avatar.jpg" class="rounded-4xl" alt="avatar" />
    </div>
    <h4 class="text-2xl font-bold">FlameTN7</h4>

    <p class="text-gray-500 mb-2">请输入文本……</p>
    <div class="flex justify-between gap-4">
      <div v-for="social in contacts" :key="social.title">
        <a :href="social.link" target="_blank" class="text-base">
          <div
            class="w-6 h-6 hover:text-brand transition-all ease-in-out duration-200"
            v-html="social.icon"
            :title="social.title"
          ></div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Cat } from 'lucide-vue-next'
const contacts = [
  {
    title: '代码……还不会呢',
    content: '@FlameTN7',
    description: '代码……还不会呢',
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    `,
    link: 'https://github.com/FlameTN7',
  },
  {
    title: '主要是发打得很菜的录像',
    content: 'FlameTN7',
    description: '主要是发打得很菜的录像',
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tv-icon lucide-tv w-full h-full"><path d="m17 2-5 5-5-5"/><rect width="20" height="15" x="2" y="7" rx="2"/></svg>
    `,
    link: 'https://space.bilibili.com/73626930',
  },
  {
    title: '个人小群',
    content: '1094434177',
    description: '欢迎加入闲聊喔！',
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paw-print-icon lucide-paw-print w-full h-full"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>
    `,
    link: 'https://qm.qq.com/q/ggtOxwU8P6',
  },
]
</script>

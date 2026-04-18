import { defineConfig } from 'vitepress'

import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { computeWordStats } from './theme/utils/text'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/Blog/',
  cleanUrls: true,
  title: 'FlameTN7 Blog',
  description: 'FlameTN7的个人博客',
  lastUpdated: true,
  appearance: 'dark',
  transformPageData(pageData, ctx) {
    const content = (ctx as { content?: string }).content
    if (!content) return
    const { wordCount, readingTime } = computeWordStats(content)
    return {
      wordCount,
      readingTime,
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/Blog/' },
      { text: '项目', link: '/Blog/projects/overview' },
      { text: '笔记', link: '/Blog/tutorial/markdown' },
    ],

    sidebar: [
      {
        text: '笔记',
        items: [
          { text: 'Markdown', link: '/Blog/tutorial/markdown' },
          { text: 'Rabi-Ribi联机教程', link: '/Blog/tutorial/rabi-ribi' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }],
  },
  markdown: {
    headers: {
      level: [1, 2, 3, 4],
    },
  },
  vite: {
    plugins: [vueJsx(), vueDevTools(), tailwindcss()],
    server: {
      host: '0.0.0.0', // 监听所有网络接口，允许局域网访问
    },
  },
})

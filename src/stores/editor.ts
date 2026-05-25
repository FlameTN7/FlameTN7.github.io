import { defineStore } from 'pinia'
import { api, type ArticleMeta, type SidebarGroup } from '@/components/editor/api'

export type MobileView = 'files' | 'edit' | 'preview'

interface State {
  categories: string[]
  currentCategory: string | null
  articles: ArticleMeta[]
  currentFilename: string | null
  content: string
  baselineContent: string
  mtime: number | null
  loading: boolean
  saving: boolean
  message: string | null
  messageType: 'info' | 'success' | 'error'
  sidebar: SidebarGroup[]
  mobileView: MobileView
  showFiles: boolean
  lastDraftAt: number | null
}

export const useEditorStore = defineStore('editor', {
  state: (): State => ({
    categories: [],
    currentCategory: null,
    articles: [],
    currentFilename: null,
    content: '',
    baselineContent: '',
    mtime: null,
    loading: false,
    saving: false,
    message: null,
    messageType: 'info',
    sidebar: [],
    mobileView: 'edit',
    showFiles: true,
    lastDraftAt: null,
  }),
  getters: {
    isDirty: (s) => s.content !== s.baselineContent,
  },
  actions: {
    notify(msg: string, type: 'info' | 'success' | 'error' = 'info') {
      this.message = msg
      this.messageType = type
      setTimeout(() => {
        if (this.message === msg) this.message = null
      }, 3000)
    },

    async loadCategories() {
      const { categories } = await api.listCategories()
      this.categories = categories
      const first = categories[0]
      if (!this.currentCategory && first) {
        await this.selectCategory(first)
      }
    },

    async createCategory(name: string) {
      await api.createCategory(name)
      await this.loadCategories()
      await this.selectCategory(name)
      this.notify(`分类 ${name} 已创建`, 'success')
    },

    async selectCategory(name: string) {
      this.currentCategory = name
      const { articles } = await api.listArticles(name)
      this.articles = articles
    },

    async openArticle(filename: string) {
      if (!this.currentCategory) return
      if (this.isDirty) {
        if (!confirm('当前文章未保存,确定丢弃？')) return
      }
      this.loading = true
      try {
        const { content, mtime } = await api.getArticle(this.currentCategory, filename)
        this.currentFilename = filename
        this.content = content
        this.baselineContent = content
        this.mtime = mtime
      } finally {
        this.loading = false
      }
    },

    async save() {
      if (!this.currentCategory || !this.currentFilename) return
      this.saving = true
      try {
        const res = await api.saveArticle(
          this.currentCategory,
          this.currentFilename,
          this.content,
          { expectedMtime: this.mtime ?? undefined },
        )
        this.mtime = res.mtime
        this.baselineContent = this.content
        this.notify('已保存', 'success')
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        this.notify(`保存失败: ${msg}`, 'error')
        throw e
      } finally {
        this.saving = false
      }
    },

    async createArticle(
      category: string,
      filename: string,
      content: string,
      sidebar: { groupText: string; itemText: string } | null,
    ) {
      await api.saveArticle(category, filename, content, { create: true })
      if (sidebar) {
        await this.addToSidebar(sidebar.groupText, {
          text: sidebar.itemText,
          link: `/${category}/${filename.replace(/\.md$/, '')}`,
        })
      }
      await this.selectCategory(category)
      this.currentFilename = filename
      this.content = content
      this.baselineContent = content
      const list = this.articles.find((a) => a.filename === filename)
      this.mtime = list ? list.mtime : null
      this.notify(`已创建 ${filename}`, 'success')
    },

    async deleteArticle(filename: string) {
      if (!this.currentCategory) return
      if (!confirm(`确定删除 ${filename}？此操作不可撤销。`)) return
      await api.deleteArticle(this.currentCategory, filename)
      if (this.currentFilename === filename) {
        this.currentFilename = null
        this.content = ''
        this.baselineContent = ''
        this.mtime = null
      }
      await this.selectCategory(this.currentCategory)
      this.notify(`已删除 ${filename}`, 'success')
    },

    async loadSidebar() {
      const { groups } = await api.getSidebar()
      this.sidebar = groups
    },

    async addToSidebar(groupText: string, item: { text: string; link: string }) {
      await this.loadSidebar()
      const existing = this.sidebar.find((g) => g.text === groupText)
      if (existing) {
        if (!existing.items.some((i) => i.link === item.link)) existing.items.push(item)
      } else {
        this.sidebar.push({ text: groupText, items: [item] })
      }
      await api.putSidebar(this.sidebar)
    },
  },
})

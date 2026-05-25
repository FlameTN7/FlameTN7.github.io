export interface ArticleMeta {
  filename: string
  title: string
  updated?: string
  mtime: number
  size: number
}

export interface SidebarItem {
  text: string
  link: string
}

export interface SidebarGroup {
  text: string
  items: SidebarItem[]
}

export interface UploadResult {
  ok: true
  url: string
  key: string
  deduped: boolean
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(init?.headers || {}),
    },
  })
  const text = await res.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : res.statusText
    throw new Error(`${res.status} ${msg}`)
  }
  return body as T
}

export const api = {
  health: () => request<{ ok: true; time: number }>('/api/health'),

  listCategories: () => request<{ categories: string[] }>('/api/categories'),

  createCategory: (name: string) =>
    request<{ ok: true; name: string }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  listArticles: (category: string) =>
    request<{ category: string; articles: ArticleMeta[] }>(
      `/api/categories/${encodeURIComponent(category)}/articles`,
    ),

  getArticle: (category: string, filename: string) =>
    request<{ content: string; mtime: number }>(
      `/api/articles/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`,
    ),

  saveArticle: (
    category: string,
    filename: string,
    content: string,
    opts: { expectedMtime?: number; create?: boolean } = {},
  ) =>
    request<{ ok: true; mtime: number }>(
      `/api/articles/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ content, ...opts }),
      },
    ),

  deleteArticle: (category: string, filename: string) =>
    request<{ ok: true }>(
      `/api/articles/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`,
      { method: 'DELETE' },
    ),

  moveArticle: (
    category: string,
    filename: string,
    toCategory: string,
    toFilename?: string,
  ) =>
    request<{ ok: true }>(
      `/api/articles/${encodeURIComponent(category)}/${encodeURIComponent(filename)}/move`,
      {
        method: 'POST',
        body: JSON.stringify({ toCategory, toFilename }),
      },
    ),

  saveDraft: (key: string, content: string) =>
    request<{ ok: true }>(`/api/drafts/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  getDraft: (key: string) =>
    request<{ content: string | null; mtime?: number }>(
      `/api/drafts/${encodeURIComponent(key)}`,
    ),

  getSidebar: () => request<{ groups: SidebarGroup[] }>('/api/sidebar'),

  putSidebar: (groups: SidebarGroup[]) =>
    request<{ ok: true }>('/api/sidebar', {
      method: 'PUT',
      body: JSON.stringify({ groups }),
    }),

  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file, file.name)
    return request<UploadResult>('/api/upload', { method: 'POST', body: fd })
  },
}

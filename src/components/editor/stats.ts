export interface WordStats {
  wordCount: number
  readingTime: number
}

const FM = /^---[\s\S]*?---\s*/m

export function computeWordStats(raw: string): WordStats {
  if (!raw) return { wordCount: 0, readingTime: 0 }
  let text = raw.replace(FM, '')
  text = text.replace(/```[\s\S]*?```/g, ' ')
  text = text.replace(/`[^`]*`/g, ' ')
  text = text.replace(/<[^>]*>/g, ' ')
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  text = text.replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
  text = text.replace(/[#>*_~\-+=]+/g, ' ')
  text = text.replace(/\r?\n/g, ' ')

  const cjk = (text.match(/[一-鿿]/g) || []).length
  const words = text
    .replace(/[一-鿿]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  const total = cjk + words
  return { wordCount: total, readingTime: total > 0 ? Math.ceil(total / 300) : 0 }
}

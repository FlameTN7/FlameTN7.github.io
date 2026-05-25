import { ref, onBeforeUnmount } from 'vue'

interface SplitterOptions {
  storageKey: string
  defaultPx: number
  minPx: number
  maxPx?: number
  /** When true, drag direction is reversed (right splitter shrinking when dragged left, etc.). */
  reverse?: boolean
}

export function useSplitter(opts: SplitterOptions) {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(opts.storageKey) : null
  const storedNum = stored ? Number(stored) : NaN
  const initial = Number.isFinite(storedNum)
    ? clamp(storedNum, opts.minPx, opts.maxPx ?? Infinity)
    : opts.defaultPx
  const width = ref<number>(initial)

  let dragStartX = 0
  let dragStartW = 0
  let dragging = false

  function onMove(e: MouseEvent) {
    if (!dragging) return
    const dx = e.clientX - dragStartX
    const next = clamp(dragStartW + (opts.reverse ? -dx : dx), opts.minPx, opts.maxPx ?? Infinity)
    width.value = next
  }

  function onUp() {
    if (!dragging) return
    dragging = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(opts.storageKey, String(width.value))
    }
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onUp)
  }

  function onTouchMove(e: TouchEvent) {
    if (!dragging) return
    const t = e.touches[0]
    if (!t) return
    const dx = t.clientX - dragStartX
    const next = clamp(dragStartW + (opts.reverse ? -dx : dx), opts.minPx, opts.maxPx ?? Infinity)
    width.value = next
  }

  function startDrag(e: MouseEvent | TouchEvent) {
    dragging = true
    dragStartX = 'touches' in e ? e.touches[0]!.clientX : e.clientX
    dragStartW = width.value
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  function resetWidth() {
    width.value = opts.defaultPx
    if (typeof localStorage !== 'undefined') localStorage.removeItem(opts.storageKey)
  }

  onBeforeUnmount(onUp)

  return { width, startDrag, resetWidth }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

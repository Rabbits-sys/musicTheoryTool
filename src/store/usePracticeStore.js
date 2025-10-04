import { create } from 'zustand'

function getPref(key, def) {
  try {
    if (window?.prefs?.get) {
      const v = window.prefs.get(key)
      return v === undefined ? def : v
    }
  } catch {}
  try {
    const raw = localStorage.getItem(key)
    return raw != null ? JSON.parse(raw) : def
  } catch { return def }
}
function setPref(key, value) {
  try { if (window?.prefs?.set) return window.prefs.set(key, value) } catch {}
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

const difficultyPresets = {
  easy: { label: '简单', intervalMs: 2500, count: 6 },
  medium: { label: '中等', intervalMs: 1800, count: 8 },
  hard: { label: '困难', intervalMs: 1200, count: 10 },
  extreme: { label: '极难', intervalMs: 800, count: 12 },
}

export function randomSequence(count) {
  const seq = []
  if (count <= 0) return seq
  seq.push(1 + Math.floor(Math.random() * 7))
  for (let i = 1; i < count; i++) {
    const prev = seq[i - 1]
    const r = Math.floor(Math.random() * 6)
    let n = r + 1
    if (n >= prev) n += 1
    seq.push(n)
  }
  return seq
}

function getInitialDifficultyKey() {
  const k = getPref('practice.difficultyKey', 'easy')
  return difficultyPresets[k] ? k : 'easy'
}

const initKey = getInitialDifficultyKey()

const usePracticeStore = create((set, get) => ({
  stage: 'select',
  difficultyKey: initKey,
  difficulty: difficultyPresets[initKey],
  sequence: [],
  results: [],

  setDifficulty: (key) =>
    set(() => {
      setPref('practice.difficultyKey', key)
      return { difficultyKey: key, difficulty: difficultyPresets[key] }
    }),

  startPractice: () => {
    const { difficulty } = get()
    const seq = randomSequence(difficulty.count)
    set({ sequence: seq, results: [], stage: 'practice' })
  },

  addResult: (r) => set((s) => ({ results: [...s.results, r] })),

  finishPractice: () => set({ stage: 'results' }),

  reset: () => set({ stage: 'select', results: [], sequence: [] }),
}))

export default usePracticeStore
export { difficultyPresets }

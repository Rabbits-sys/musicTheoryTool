import { create } from 'zustand'

function getPref(key, def) {
  try { if (window?.prefs?.get) { const v = window.prefs.get(key); return v === undefined ? def : v } } catch {}
  try { const raw = localStorage.getItem(key); return raw != null ? JSON.parse(raw) : def } catch { return def }
}
function setPref(key, value) {
  try { if (window?.prefs?.set) return window.prefs.set(key, value) } catch {}
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

export const majorDifficultyPresets = {
  white: { key: 'white', label: '仅白键出发', description: 'C D E F G A B' },
  all: { key: 'all', label: '包含黑键出发', description: '含所有起始音（含 # / b）' },
}

const WHITE_TONICS = ['C','D','E','F','G','A','B']
const ALL_TONICS = ['C','#C','bD','D','bE','E','F','#F','bG','G','bA','A','bB','B']

const SCALE_MAP = {
  'C': ['C','D','E','F','G','A','B','C'],
  '#C': ['#C','#D','#E','#F','#G','#A','#B','#C'],
  'bD': ['bD','bE','F','bG','bA','bB','C','bD'],
  'D': ['D','E','#F','G','A','B','#C','D'],
  'bE': ['bE','F','G','bA','bB','C','D','bE'],
  'E': ['E','#F','#G','A','B','#C','#D','E'],
  'F': ['F','G','A','bB','C','D','E','F'],
  '#F': ['#F','#G','#A','B','#C','#D','#E','#F'],
  'bG': ['bG','bA','bB','bC','bD','bE','F','bG'],
  'G': ['G','A','B','C','D','E','#F','G'],
  'bA': ['bA','bB','C','bD','bE','F','G','bA'],
  'A': ['A','B','#C','D','E','#F','#G','A'],
  'bB': ['bB','C','D','bE','F','G','A','bB'],
  'B': ['B','#C','#D','E','#F','#G','#A','B'],
}

function getInitialKey() {
  const k = getPref('major.difficultyKey', 'white')
  return majorDifficultyPresets[k] ? k : 'white'
}

const initKey = getInitialKey()

const useMajorStore = create((set, get) => ({
  stage: 'select', // 'select' | 'practice' | 'results'
  difficultyKey: initKey,
  difficulty: majorDifficultyPresets[initKey],
  tonics: [], // array of tonic strings in order
  answers: {}, // { tonic: inputStr }
  results: {}, // { tonic: { correct: boolean, expected: string[], input: string[] } }
  startedAt: null, // timestamp ms
  durationMs: null, // total duration for practice

  setDifficulty: (key) => set(() => {
    setPref('major.difficultyKey', key)
    return { difficultyKey: key, difficulty: majorDifficultyPresets[key] }
  }),

  start: () => {
    const { difficultyKey } = get()
    const tonics = difficultyKey === 'white' ? WHITE_TONICS : ALL_TONICS
    set({ stage: 'practice', tonics, answers: {}, results: {}, startedAt: Date.now(), durationMs: null })
  },

  setAnswer: (tonic, text) => set((s) => ({ answers: { ...s.answers, [tonic]: text } })),

  submit: () => {
    const { tonics, answers, startedAt } = get()
    const results = {}
    tonics.forEach(t => {
      const expected = SCALE_MAP[t]
      const input = (answers[t] || '').trim().split(/\s+/).filter(Boolean)
      let correct = false
      if (expected && input.length === expected.length) {
        correct = expected.every((tok, i) => tok === input[i])
      }
      results[t] = { correct, expected, input }
    })
    const durationMs = startedAt ? (Date.now() - startedAt) : null
    set({ results, stage: 'results', durationMs })
  },

  reset: () => set({ stage: 'select', answers: {}, results: {}, tonics: [], startedAt: null, durationMs: null }),
}))

export default useMajorStore
export { WHITE_TONICS, ALL_TONICS, SCALE_MAP }

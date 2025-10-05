import { create } from 'zustand'

/**
 * Zustand store for natural major scale practice.
 * Manages difficulty selection, tonic list, user answers, computed results, and timing.
 */
function getPref(key, def) {
  try { if (window?.prefs?.get) { const v = window.prefs.get(key); return v === undefined ? def : v } } catch {}
  try { const raw = localStorage.getItem(key); return raw != null ? JSON.parse(raw) : def } catch { return def }
}
function setPref(key, value) {
  try { if (window?.prefs?.set) return window.prefs.set(key, value) } catch {}
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

/** @type {{[key:string]: {key:string, label:string, description:string}}} */
export const majorDifficultyPresets = {
  white: { key: 'white', label: '仅白键出发', description: 'C D E F G A B' },
  all: { key: 'all', label: '包含黑键出发', description: '含所有起始音（含 # / b）' },
}

export const WHITE_TONICS = ['C','D','E','F','G','A','B']
export const ALL_TONICS = ['C','#C','bD','D','bE','E','F','#F','bG','G','bA','A','bB','B']

/** Map from tonic to expected major scale tokens (8 notes). */
export const SCALE_MAP = {
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
  /** @type {'select'|'practice'|'results'} */
  stage: 'select',
  /** Selected difficulty preset key */
  difficultyKey: initKey,
  /** Difficulty config */
  difficulty: majorDifficultyPresets[initKey],
  /** Ordered tonic list for the session */
  tonics: [],
  /** Free-form answers keyed by tonic */
  answers: {},
  /** Judgement results keyed by tonic */
  results: {},
  /** Session start time (ms since epoch) */
  startedAt: null,
  /** Total duration of session in ms */
  durationMs: null,

  /** Update difficulty preset */
  setDifficulty: (key) => set(() => {
    setPref('major.difficultyKey', key)
    return { difficultyKey: key, difficulty: majorDifficultyPresets[key] }
  }),

  /** Begin a new practice with tonics based on difficulty. */
  start: () => {
    const { difficultyKey } = get()
    const tonics = difficultyKey === 'white' ? WHITE_TONICS : ALL_TONICS
    set({ stage: 'practice', tonics, answers: {}, results: {}, startedAt: Date.now(), durationMs: null })
  },

  /** Store answer text for a tonic. */
  setAnswer: (tonic, text) => set((s) => ({ answers: { ...s.answers, [tonic]: text } })),

  /** Grade all answers and transition to results. */
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

  /** Reset to initial selection stage. */
  reset: () => set({ stage: 'select', answers: {}, results: {}, tonics: [], startedAt: null, durationMs: null }),
}))

export default useMajorStore

import { create } from 'zustand'
import { generateQuestion, checkAnswer } from '../utils/enharmonic.js'

/**
 * Zustand store for interval (semitone/whole tone) enharmonic practice.
 * Exposes stage, difficulty selection, current questions, and submission actions.
 */
function getPref(key, def) {
  try { if (window?.prefs?.get) { const v = window.prefs.get(key); return v === undefined ? def : v } } catch {}
  try { const raw = localStorage.getItem(key); return raw != null ? JSON.parse(raw) : def } catch { return def }
}
function setPref(key, value) {
  try { if (window?.prefs?.set) return window.prefs.set(key, value) } catch {}
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

/** @type {{[key:string]: {label:string, intervalMs:number, count:number}}} */
export const intervalDifficultyPresets = {
  easy: { label: '简单', intervalMs: 48000, count: 4 },
  medium: { label: '中等', intervalMs: 36000, count: 6 },
  hard: { label: '困难', intervalMs: 26000, count: 8 },
  extreme: { label: '极难', intervalMs: 20000, count: 10 },
}

function getInitialKey() {
  const k = getPref('interval.difficultyKey', 'easy')
  return intervalDifficultyPresets[k] ? k : 'easy'
}

const initKey = getInitialKey()

const useIntervalStore = create((set, get) => ({
  /** @type {'select'|'practice'|'results'} */
  stage: 'select',
  /** Selected difficulty preset key */
  difficultyKey: initKey,
  /** Difficulty config */
  difficulty: intervalDifficultyPresets[initKey],
  /** Questions list */
  questions: [], // [{ promptDisplay, semitone:{dir,expected}, whole:{dir,expected} }]
  /** Current question index */
  idx: 0,
  /** Submissions parallel to questions */
  answers: [], // [{ semiInput, semiCorrect, wholeInput, wholeCorrect }]

  /** Update selected difficulty */
  setDifficulty: (key) => set(() => {
    setPref('interval.difficultyKey', key)
    return { difficultyKey: key, difficulty: intervalDifficultyPresets[key] }
  }),

  /** Start a new practice session */
  start: () => {
    const { difficulty } = get()
    const qs = []
    for (let i = 0; i < difficulty.count; i++) qs.push(generateQuestion())
    set({ stage: 'practice', questions: qs, idx: 0, answers: [] })
  },

  /** Submit current inputs and advance to next or results */
  submitCurrent: (semiInput, wholeInput) => {
    const { questions, idx, answers } = get()
    const q = questions[idx]
    const semiCorrect = checkAnswer(semiInput, q.semitone.expected)
    const wholeCorrect = checkAnswer(wholeInput, q.whole.expected)
    const rec = { semiInput, semiCorrect, wholeInput, wholeCorrect }
    const newAnswers = [...answers, rec]
    const isLast = idx + 1 >= questions.length
    set({ answers: newAnswers, idx: idx + 1, stage: isLast ? 'results' : 'practice' })
  },

  /** Reset to initial selection stage */
  reset: () => set({ stage: 'select', idx: 0, answers: [], questions: [] }),
}))

export default useIntervalStore

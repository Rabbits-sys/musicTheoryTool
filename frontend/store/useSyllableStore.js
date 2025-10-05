// Syllable (Solfege) training store using Zustand
// ...existing code...
import { create } from 'zustand'

/**
 * Read a persisted preference value from either Electron's bridge or localStorage.
 * @param {string} key Preference key
 * @param {any} def Default value when not found or invalid
 * @returns {any}
 */
function readPref(key, def) {
  try {
    if (window?.prefs?.get) {
      const v = window.prefs.get(key)
      return v === undefined ? def : v
    }
  } catch {}
  try {
    const raw = localStorage.getItem(key)
    return raw != null ? JSON.parse(raw) : def
  } catch {
    return def
  }
}

/**
 * Persist a preference value to either Electron's bridge or localStorage.
 * @param {string} key
 * @param {any} value
 * @returns {boolean}
 */
function writePref(key, value) {
  try { if (window?.prefs?.set) return !!window.prefs.set(key, value) } catch {}
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

/**
 * Built-in difficulty presets for syllable training.
 * @type {{[key: string]: {label: string, intervalMs: number, count: number}}}
 */
export const syllableDifficultyPresets = {
  easy: { label: '简单', intervalMs: 2500, count: 6 },
  medium: { label: '中等', intervalMs: 1800, count: 8 },
  hard: { label: '困难', intervalMs: 1200, count: 10 },
  extreme: { label: '极难', intervalMs: 800, count: 12 },
}

/**
 * Generate a random sequence of integers 1..7 without immediate repetition.
 * @param {number} count Number of items to generate
 * @returns {number[]}
 */
export function generateSyllableSequence(count) {
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

/**
 * Resolve initial difficulty key from persisted preferences.
 * @returns {keyof typeof syllableDifficultyPresets}
 */
function getInitialDifficultyKey() {
  const k = readPref('syllable.difficultyKey', 'easy')
  return syllableDifficultyPresets[k] ? k : 'easy'
}

const initialKey = getInitialDifficultyKey()

/**
 * Zustand store for syllable (solfege) training UI state and data.
 * Fields naming is normalized for consistency across features.
 */
const useSyllableStore = create((set, get) => ({
  viewStage: 'select', // 'select' | 'practice' | 'results'
  selectedDifficultyKey: initialKey,
  selectedDifficulty: syllableDifficultyPresets[initialKey],
  questionSequence: [],
  attemptResults: [],

  /**
   * Update selected difficulty by preset key.
   * @param {keyof typeof syllableDifficultyPresets} key
   */
  setSelectedDifficulty: (key) =>
    set(() => {
      writePref('syllable.difficultyKey', key)
      return { selectedDifficultyKey: key, selectedDifficulty: syllableDifficultyPresets[key] }
    }),

  /** Begin a new practice session based on the selected difficulty. */
  startSyllablePractice: () => {
    const { selectedDifficulty } = get()
    const seq = generateSyllableSequence(selectedDifficulty.count)
    set({ questionSequence: seq, attemptResults: [], viewStage: 'practice' })
  },

  /**
   * Record a single attempt result appended to the current session.
   * @param {{segmentId: number, expected: number, word?: string|null, recognizedNumber?: number|undefined, correct: boolean, confidence?: number|null}} r
   */
  recordAttempt: (r) => set((s) => ({ attemptResults: [...s.attemptResults, r] })),

  /** Mark the current session as finished and show results. */
  completePractice: () => set({ viewStage: 'results' }),

  /** Reset all state to initial and return to difficulty selection. */
  resetSyllableTraining: () => set({ viewStage: 'select', attemptResults: [], questionSequence: [] }),
}))

export default useSyllableStore


import { create } from 'zustand'

const difficultyPresets = {
  easy: { label: '简单', intervalMs: 2500, count: 6 },
  medium: { label: '中等', intervalMs: 1800, count: 8 },
  hard: { label: '困难', intervalMs: 1200, count: 10 },
  extreme: { label: '极难', intervalMs: 800, count: 12 },
}

export function randomSequence(count) {
  const seq = []
  if (count <= 0) return seq
  // First element: uniform 1..7
  seq.push(1 + Math.floor(Math.random() * 7))
  // Subsequent: uniform from 1..7 excluding previous value
  for (let i = 1; i < count; i++) {
    const prev = seq[i - 1]
    // pick 0..5, then map to 1..7 skipping prev to avoid bias
    const r = Math.floor(Math.random() * 6) // 0..5
    let n = r + 1
    if (n >= prev) n += 1 // now n in 1..7 and n != prev
    seq.push(n)
  }
  return seq
}

const usePracticeStore = create((set, get) => ({
  stage: 'select', // 'select' | 'practice' | 'results'
  difficultyKey: 'easy',
  difficulty: difficultyPresets.easy,
  sequence: [], // array of ints 1..7
  results: [], // {segmentId, expected, word, recognizedNumber, correct, confidence}

  setDifficulty: (key) =>
    set(() => ({ difficultyKey: key, difficulty: difficultyPresets[key] })),

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

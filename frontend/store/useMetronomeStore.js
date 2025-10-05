import { create } from 'zustand'

/**
 * Zustand store for a simple metronome.
 * Persists BPM and beats-per-bar to preferences.
 */
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

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

const initialBpm = clamp(Number(getPref('metronome.bpm', 89)) || 89, 20, 240)
const initialBeats = clamp(Number(getPref('metronome.beats', 4)) || 4, 2, 8)

const useMetronomeStore = create((set) => ({
  /** Beats per minute (20..240) */
  bpm: initialBpm,
  /** Beats per bar (2..8) */
  beats: initialBeats,

  /** Update BPM and persist */
  setBpm: (v) => set(() => {
    const nv = clamp(Number(v) || initialBpm, 20, 240)
    setPref('metronome.bpm', nv)
    return { bpm: nv }
  }),

  /** Update beats-per-bar and persist */
  setBeats: (v) => set(() => {
    const nv = clamp(Number(v) || initialBeats, 2, 8)
    setPref('metronome.beats', nv)
    return { beats: nv }
  }),
}))

export default useMetronomeStore

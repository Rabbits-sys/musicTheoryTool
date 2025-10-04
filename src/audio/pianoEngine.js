// Simple polyphonic piano-like engine using Web Audio API
// Not a true piano, but a dual-oscillator + filter + ADSR envelope for quick demo

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12)

export const TIMBRE_OPTIONS = [
  {
    key: 'acoustic_piano',
    label: '原声钢琴 (acoustic piano)',
    config: {
      osc1: 'triangle', osc2: 'sine', detune: 2,
      filterType: 'lowpass', filterFreq: 6000, filterQ: 0.5,
      env: { attack: 0.005, decay: 0.25, sustain: 0.55, release: 0.4 },
      masterGain: 0.2,
    },
  },
  {
    key: 'acoustic_grand_piano',
    label: '大钢琴 (acoustic grand piano)',
    config: {
      osc1: 'triangle', osc2: 'sine', detune: 3,
      filterType: 'lowpass', filterFreq: 6500, filterQ: 0.6,
      env: { attack: 0.003, decay: 0.35, sustain: 0.6, release: 0.45 },
      masterGain: 0.2,
    },
  },
  {
    key: 'bright_acoustic_piano',
    label: '亮色钢琴 (bright acoustic piano)',
    config: {
      osc1: 'sawtooth', osc2: 'square', detune: 6,
      filterType: 'lowpass', filterFreq: 10000, filterQ: 0.7,
      env: { attack: 0.002, decay: 0.18, sustain: 0.45, release: 0.3 },
      masterGain: 0.2,
    },
  },
]

export class PianoEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.analyser = null
    this.voices = new Map()
    this.timbreKey = 'acoustic_piano'
    this.timbre = TIMBRE_OPTIONS[0].config
  }

  ensureContext() {
    if (this.ctx) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const master = ctx.createGain()
    master.gain.value = this.timbre?.masterGain ?? 0.2
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.7
    master.connect(analyser)
    analyser.connect(ctx.destination)

    this.ctx = ctx
    this.master = master
    this.analyser = analyser
  }

  setTimbreByKey(key) {
    const found = TIMBRE_OPTIONS.find(t => t.key === key)
    if (found) {
      this.timbreKey = key
      this.timbre = found.config
      if (this.master) this.master.gain.value = this.timbre?.masterGain ?? this.master.gain.value
    }
  }

  getAnalyser() {
    this.ensureContext()
    return this.analyser
  }

  async resume() {
    this.ensureContext()
    if (this.ctx.state !== 'running') {
      try { await this.ctx.resume() } catch {}
    }
  }

  // Trigger a short piano-like note
  async playMidi(midi, { duration = 1.2 } = {}) {
    this.ensureContext()
    await this.resume()

    const now = this.ctx.currentTime
    const freq = midiToFreq(midi)

    const osc1 = this.ctx.createOscillator()
    osc1.type = this.timbre?.osc1 || 'sine'
    osc1.frequency.value = freq

    const osc2 = this.ctx.createOscillator()
    osc2.type = this.timbre?.osc2 || 'triangle'
    osc2.detune.value = +(this.timbre?.detune ?? 5)
    osc2.frequency.value = freq

    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()
    filter.type = this.timbre?.filterType || 'lowpass'
    filter.frequency.value = this.timbre?.filterFreq ?? 6000
    filter.Q.value = this.timbre?.filterQ ?? 0.5

    // Wiring: osc -> filter -> gain -> master
    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)

    // ADSR
    const env = this.timbre?.env || { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 }
    const attack = env.attack, decay = env.decay, sustain = env.sustain, release = env.release
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(1.0, now + attack)
    gain.gain.linearRampToValueAtTime(sustain, now + attack + decay)
    // schedule release
    const endTime = now + duration
    gain.gain.setValueAtTime(sustain, endTime)
    gain.gain.linearRampToValueAtTime(0.0001, endTime + release)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(endTime + release + 0.05)
    osc2.stop(endTime + release + 0.05)

    // Cleanup
    const cleanup = () => {
      try { osc1.disconnect() } catch {}
      try { osc2.disconnect() } catch {}
      try { filter.disconnect() } catch {}
      try { gain.disconnect() } catch {}
    }
    osc2.onended = cleanup
  }
}

export const OCTAVE_OPTIONS = [
  { key: 'great', label: '大字组 (C2-B2)', baseMidi: 36 },
  { key: 'small', label: '小字组 (C3-B3)', baseMidi: 48 },
  { key: 'one', label: '小字一组 (C4-B4)', baseMidi: 60 },
  { key: 'two', label: '小字二组 (C5-B5)', baseMidi: 72 },
  { key: 'three', label: '小字三组 (C6-B6)', baseMidi: 84 },
]

export const WHITE_NOTES = ['C','D','E','F','G','A','B']
export const BLACK_MAP = { 1: 'C#', 2: 'D#', 4: 'F#', 5: 'G#', 6: 'A#' }

export function whiteIndexToMidi(baseMidi, whiteIndex) {
  // whiteIndex 0..6 maps to C,D,E,F,G,A,B within octave
  // relative semitone offsets within octave for white keys
  const semis = [0, 2, 4, 5, 7, 9, 11]
  return baseMidi + semis[whiteIndex]
}

export function labelForWhite(baseMidi, whiteIndex) {
  const name = WHITE_NOTES[whiteIndex]
  // derive octave number from MIDI C being Cx
  const cMidi = baseMidi
  const octave = Math.floor((cMidi / 12) - 1) // MIDI octave mapping: C4=60 => (60/12 -1)=4
  return `${name}${octave}`
}

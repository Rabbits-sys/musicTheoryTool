// Simple polyphonic piano-like engine using Web Audio API
// Not a true piano, but a dual-oscillator + filter + ADSR envelope for quick demo

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12)

export class PianoEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.analyser = null
    this.voices = new Map() // key: id, value: {osc1, osc2, gain, filter}
  }

  ensureContext() {
    if (this.ctx) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const master = ctx.createGain()
    master.gain.value = 0.2
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    master.connect(analyser)
    analyser.connect(ctx.destination)

    this.ctx = ctx
    this.master = master
    this.analyser = analyser
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
    osc1.type = 'sine'
    osc1.frequency.value = freq

    const osc2 = this.ctx.createOscillator()
    osc2.type = 'triangle'
    osc2.detune.value = +5
    osc2.frequency.value = freq

    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 6000
    filter.Q.value = 0.5

    // Wiring: osc -> filter -> gain -> master
    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)

    // Simple ADSR
    const attack = 0.01, decay = 0.2, sustain = 0.6, release = 0.4
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


import * as Tone from 'tone'

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12)

export class PianoEngine {
  constructor() {
    this.ctx = null // WebAudio raw context
    this.output = null // Tone.Gain
    this.sampler = null // Tone.Sampler
    this.analyser = null // WebAudio AnalyserNode for our canvas

    this.instrument = null // { key,label,baseUrl,urls }
  }

  _ensureContextAndOutput() {
    if (!this.ctx) this.ctx = Tone.getContext().rawContext
    if (!this.output) {
      this.output = new Tone.Gain(0.9)
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.7
      this.output.connect(Tone.Destination)
      try { this.output.connect(this.analyser) } catch {}
    }
  }

  async setInstrument(def) {
    this._ensureContextAndOutput()
    this.instrument = def || null
    // Dispose old sampler
    if (this.sampler) { try { this.sampler.dispose() } catch {} this.sampler = null }
    if (!def) return

    // Create new sampler
    try {
      this.sampler = new Tone.Sampler({
        urls: def.urls || {},
        baseUrl: def.baseUrl || '',
        attack: 0.001,
        release: 0.5,
        onload: () => {
          // Loaded
        },
        onerror: (err) => {
          console.warn('Sampler load error', err)
        },
      })
      this.sampler.connect(this.output)
    } catch (e) {
      console.error('Failed to create sampler', e)
      this.sampler = null
    }
  }

  getAnalyser() {
    this._ensureContextAndOutput()
    return this.analyser
  }

  async resume() {
    try { await Tone.start() } catch {}
  }

  async playMidi(midi, { duration = 1.2 } = {}) {
    this._ensureContextAndOutput()
    await this.resume()
    if (!this.sampler) return
    const freq = midiToFreq(midi)
    try {
      this.sampler.triggerAttackRelease(freq, duration)
    } catch (e) {
      console.error(e)
    }
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
  const semis = [0, 2, 4, 5, 7, 9, 11]
  return baseMidi + semis[whiteIndex]
}

export function labelForWhite(baseMidi, whiteIndex) {
  const name = WHITE_NOTES[whiteIndex]
  const cMidi = baseMidi
  const octave = Math.floor((cMidi / 12) - 1)
  return `${name}${octave}`
}

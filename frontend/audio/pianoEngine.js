import * as Tone from 'tone'

/**
 * Convert a MIDI note number to frequency in Hz.
 * @param {number} m MIDI note number (integer)
 * @returns {number} Frequency in Hz
 */
const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12)

/**
 * Lightweight sampled piano engine using Tone.js Sampler.
 * Provides instrument switching, playback by MIDI, and an AnalyserNode for visuals.
 */
export class PianoEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null // WebAudio raw context
    /** @type {import('tone').Gain|null} */
    this.output = null // Tone.Gain
    /** @type {import('tone').Sampler|null} */
    this.sampler = null // Tone.Sampler
    /** @type {AnalyserNode|null} */
    this.analyser = null // WebAudio AnalyserNode for our canvas
  }

  /** Ensure WebAudio context, output gain, and analyser are initialized. */
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

  /**
   * Set current instrument by descriptor.
   * @param {{key:string,label?:string,baseUrl?:string,urls?:Record<string,string>}|null} def
   */
  async setInstrument(def) {
    this._ensureContextAndOutput()
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
        onload: () => {},
        onerror: (err) => { console.warn('Sampler load error', err) },
      })
      this.sampler.connect(this.output)
    } catch (e) {
      console.error('Failed to create sampler', e)
      this.sampler = null
    }
  }

  /**
   * Get the analyser node for visualizations.
   * @returns {AnalyserNode}
   */
  getAnalyser() {
    this._ensureContextAndOutput()
    return this.analyser
  }

  /** Resume the audio context if suspended (required on some browsers). */
  async resume() { try { await Tone.start() } catch {} }

  /**
   * Play a MIDI note using the sampler.
   * @param {number} midi MIDI note number
   * @param {{duration?: number}} [options] Playback options
   */
  async playMidi(midi, { duration = 1.2 } = {}) {
    this._ensureContextAndOutput()
    await this.resume()
    if (!this.sampler) return
    const freq = midiToFreq(midi)
    try { this.sampler.triggerAttackRelease(freq, duration) } catch (e) { console.error(e) }
  }
}

/** Octave group options for keyboard groups. */
export const OCTAVE_OPTIONS = [
  { key: 'great', label: '大字组 (C2-B2)', baseMidi: 36 },
  { key: 'small', label: '小字组 (C3-B3)', baseMidi: 48 },
  { key: 'one', label: '小字一组 (C4-B4)', baseMidi: 60 },
  { key: 'two', label: '小字二组 (C5-B5)', baseMidi: 72 },
  { key: 'three', label: '小字三组 (C6-B6)', baseMidi: 84 },
]

/** Names for white notes within an octave. */
export const WHITE_NOTES = ['C','D','E','F','G','A','B']

/**
 * Convert a white key index (0..6) relative to base C MIDI into MIDI note number.
 * @param {number} baseMidi MIDI of C for the group
 * @param {number} whiteIndex Index 0..6 for C..B
 * @returns {number}
 */
export function whiteIndexToMidi(baseMidi, whiteIndex) {
  const semis = [0, 2, 4, 5, 7, 9, 11]
  return baseMidi + semis[whiteIndex]
}

/**
 * Get display label for a white key based on base MIDI.
 * @param {number} baseMidi MIDI of C for the group
 * @param {number} whiteIndex Index 0..6
 * @returns {string}
 */
export function labelForWhite(baseMidi, whiteIndex) {
  const name = WHITE_NOTES[whiteIndex]
  const octave = Math.floor((baseMidi / 12) - 1)
  return `${name}${octave}`
}

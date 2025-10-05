/** @constant {number} TARGET_SR Default target sample rate for ASR. */
const TARGET_SR = 16000

/**
 * Convert Float32 PCM samples in [-1, 1] to 16-bit signed PCM bytes.
 * @param {Float32Array} float32Array
 * @returns {Uint8Array}
 */
function floatTo16BitPCM(float32Array) {
  const out = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return new Uint8Array(out.buffer)
}

/**
 * Simple linear resampler from inRate to outRate.
 * @param {Float32Array} input
 * @param {number} inRate
 * @param {number} outRate
 * @returns {Float32Array}
 */
function linearResample(input, inRate, outRate) {
  if (inRate === outRate) return input
  const ratio = inRate / outRate
  const outLength = Math.floor(input.length / ratio)
  const output = new Float32Array(outLength)
  for (let i = 0; i < outLength; i++) {
    const idx = i * ratio
    const i0 = Math.floor(idx)
    const i1 = Math.min(i0 + 1, input.length - 1)
    const frac = idx - i0
    output[i] = input[i0] * (1 - frac) + input[i1] * frac
  }
  return output
}

/**
 * Streams microphone audio as PCM16 chunks at TARGET_SR via an AudioWorklet.
 */
export class MicrophoneStreamer {
  /**
   * @param {{ onPcmChunk?: (pcm: Uint8Array) => void }} options
   */
  constructor({ onPcmChunk }) {
    /** @type {(pcm: Uint8Array)=>void|undefined} */
    this.onPcmChunk = onPcmChunk
    /** @type {AudioContext|null} */
    this.audioContext = null
    /** @type {AudioWorkletNode|null} */
    this.workletNode = null
    /** @type {MediaStreamAudioSourceNode|null} */
    this.source = null
    /** @type {number|null} */
    this.inputSampleRate = null
    /** @type {boolean} */
    this.running = false
  }

  /** Start microphone stream and begin emitting PCM chunks. */
  async start() {
    if (this.running) return
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.inputSampleRate = this.audioContext.sampleRate
    try {
      const workletUrl = new URL('./pcm-processor.js', import.meta.url)
      await this.audioContext.audioWorklet.addModule(workletUrl.href)
    } catch (e) {
      console.error('Failed to load worklet', e)
      throw e
    }
    this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor')
    this.workletNode.port.onmessage = (event) => {
      const float32 = event.data
      const resampled = linearResample(float32, this.inputSampleRate, TARGET_SR)
      const pcm = floatTo16BitPCM(resampled)
      this.onPcmChunk && this.onPcmChunk(pcm)
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, noiseSuppression: true, echoCancellation: true }, video: false })
    this.source = this.audioContext.createMediaStreamSource(stream)
    this.source.connect(this.workletNode)
    // No need to hear the mic; do not connect to destination
    this.running = true
  }

  /** Stop microphone stream and cleanup audio nodes. */
  async stop() {
    this.running = false
    try {
      if (this.workletNode) this.workletNode.disconnect()
      if (this.source) this.source.disconnect()
      if (this.audioContext) await this.audioContext.close()
    } catch (e) {
      // ignore
    }
    this.workletNode = null
    this.source = null
    this.audioContext = null
  }
}

/** Exported target sample rate for consumers. */
export const TARGET_SAMPLE_RATE = TARGET_SR

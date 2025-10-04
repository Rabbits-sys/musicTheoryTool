const TARGET_SR = 16000

function floatTo16BitPCM(float32Array) {
  const out = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return new Uint8Array(out.buffer)
}

function linearResample(input, inRate, outRate) {
  if (inRate === outRate) return input
  const ratio = inRate / outRate
  const outLength = Math.floor(input.length / ratio)
  const output = new Float32Array(outLength)
  let pos = 0
  for (let i = 0; i < outLength; i++) {
    const idx = i * ratio
    const i0 = Math.floor(idx)
    const i1 = Math.min(i0 + 1, input.length - 1)
    const frac = idx - i0
    output[i] = input[i0] * (1 - frac) + input[i1] * frac
    pos += ratio
  }
  return output
}

export class MicrophoneStreamer {
  constructor({ onPcmChunk }) {
    this.onPcmChunk = onPcmChunk
    this.audioContext = null
    this.workletNode = null
    this.source = null
    this.inputSampleRate = null
    this.running = false
  }

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

export const TARGET_SAMPLE_RATE = TARGET_SR

/**
 * Simple WebSocket client for streaming PCM audio to the backend ASR and segmenting results.
 */
export class ASRClient {
  /**
   * @param {{ url?: string, sampleRate?: number }} [options]
   */
  constructor({ url = 'ws://127.0.0.1:8000/ws', sampleRate = 16000 } = {}) {
    /** @type {string} */
    this.url = url
    /** @type {number} */
    this.sampleRate = sampleRate
    /** @type {WebSocket|null} */
    this.ws = null
    /** @type {boolean} */
    this.opened = false
    /** @type {((value: any)=>void)|null} */
    this._pendingSegmentResolve = null
  }

  /** Open the WebSocket and send initial config. */
  async open() {
    if (this.opened) return
    this.ws = new WebSocket(this.url)
    this.ws.binaryType = 'arraybuffer'
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('ASR ws connect timeout')), 8000)
      this.ws.onopen = () => {
        clearTimeout(t)
        resolve()
      }
      this.ws.onerror = () => {
        clearTimeout(t)
        reject(new Error('ASR ws error'))
      }
    })
    this.opened = true
    this.ws.onmessage = (ev) => this._handleMessage(ev)
    // Send config
    this.ws.send(JSON.stringify({ type: 'config', sampleRate: this.sampleRate }))
  }

  /** Close the WebSocket if open. */
  close() {
    try { this.ws && this.ws.close() } catch {}
    this.opened = false
    this.ws = null
  }

  /**
   * @param {MessageEvent} ev
   * @private
   */
  _handleMessage(ev) {
    if (typeof ev.data === 'string') {
      let data
      try { data = JSON.parse(ev.data) } catch { return }
      if (data.type === 'segment_result' && this._pendingSegmentResolve) {
        const res = data.result || null
        const ok = this._pendingSegmentResolve
        this._pendingSegmentResolve = null
        ok(res)
      }
      // Ignore other acks for now
    }
  }

  /**
   * Send a chunk of PCM16 mono audio bytes to the backend.
   * @param {Uint8Array} pcmChunk 16-bit signed PCM bytes
   */
  sendAudio(pcmChunk) {
    if (!this.ws || this.ws.readyState !== 1) return
    // Expect Uint8Array; send ArrayBuffer
    const buf = pcmChunk.buffer.byteLength === pcmChunk.byteLength ? pcmChunk.buffer : pcmChunk.slice().buffer
    this.ws.send(buf)
  }

  /**
   * Start a recognition segment.
   * @param {number} segmentId
   */
  async startSegment(segmentId) {
    if (!this.opened) throw new Error('ASR not open')
    this.ws.send(JSON.stringify({ type: 'start_segment', segmentId }))
  }

  /**
   * End the current segment and await its result from the backend.
   * @returns {Promise<{segmentId:number, word?:string|null, confidence?:number|null}|null>}
   */
  async endSegment() {
    if (!this.opened) throw new Error('ASR not open')
    const p = new Promise((resolve) => {
      this._pendingSegmentResolve = resolve
    })
    this.ws.send(JSON.stringify({ type: 'end_segment' }))
    return p
  }

  /** Notify backend to finalize the session. */
  async endSession() {
    if (!this.opened) return
    try { this.ws.send(JSON.stringify({ type: 'end_session' })) } catch {}
  }
}

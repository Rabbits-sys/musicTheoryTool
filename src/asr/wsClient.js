export class ASRClient {
  constructor({ url = 'ws://127.0.0.1:8000/ws', sampleRate = 16000 } = {}) {
    this.url = url
    this.sampleRate = sampleRate
    this.ws = null
    this.opened = false
    this._pendingSegmentResolve = null
    this._pendingSegmentReject = null
  }

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
      this.ws.onerror = (e) => {
        clearTimeout(t)
        reject(new Error('ASR ws error'))
      }
    })
    this.opened = true
    this.ws.onmessage = (ev) => this._handleMessage(ev)
    // Send config
    this.ws.send(JSON.stringify({ type: 'config', sampleRate: this.sampleRate }))
  }

  close() {
    try { this.ws && this.ws.close() } catch {}
    this.opened = false
    this.ws = null
  }

  _handleMessage(ev) {
    if (typeof ev.data === 'string') {
      let data
      try { data = JSON.parse(ev.data) } catch { return }
      if (data.type === 'segment_result' && this._pendingSegmentResolve) {
        const res = data.result || null
        const ok = this._pendingSegmentResolve
        this._pendingSegmentResolve = null
        this._pendingSegmentReject = null
        ok(res)
      }
      // Ignore other acks for now
    }
  }

  sendAudio(pcmChunk) {
    if (!this.ws || this.ws.readyState !== 1) return
    // Expect Uint8Array; send ArrayBuffer
    const buf = pcmChunk.buffer.byteLength === pcmChunk.byteLength ? pcmChunk.buffer : pcmChunk.slice().buffer
    this.ws.send(buf)
  }

  async startSegment(segmentId) {
    if (!this.opened) throw new Error('ASR not open')
    this.ws.send(JSON.stringify({ type: 'start_segment', segmentId }))
  }

  async endSegment() {
    if (!this.opened) throw new Error('ASR not open')
    const p = new Promise((resolve, reject) => {
      this._pendingSegmentResolve = resolve
      this._pendingSegmentReject = reject
    })
    this.ws.send(JSON.stringify({ type: 'end_segment' }))
    return p
  }

  async endSession() {
    if (!this.opened) return
    try { this.ws.send(JSON.stringify({ type: 'end_session' })) } catch {}
  }
}


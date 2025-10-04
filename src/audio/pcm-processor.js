class PCMProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0]
    if (input && input[0]) {
      const channelData = input[0]
      // Copy to transferable Float32Array
      const buf = new Float32Array(channelData.length)
      buf.set(channelData)
      this.port.postMessage(buf, [buf.buffer])
    }
    return true
  }
}

registerProcessor('pcm-processor', PCMProcessor)


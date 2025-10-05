/**
 * AudioWorkletProcessor that forwards input mono Float32 frames to the main thread.
 * Each process call posts a transferable Float32Array containing the current chunk.
 */
class PCMProcessor extends AudioWorkletProcessor {
  /**
   * @param {Float32Array[][]} inputs
   * @param {Float32Array[][]} outputs
   * @param {Record<string, Float32Array>} parameters
   */
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

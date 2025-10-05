import React, { useEffect, useRef } from 'react'
import { Box } from '@mui/material'

/**
 * Visualizes frequency spectrum from a WebAudio AnalyserNode as animated bars (Piano feature).
 * @param {{ analyser: AnalyserNode|null, height?: number }} props
 * @returns {JSX.Element}
 */
export default function PianoWavefromCanvas({ analyser, height = 120 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx2d = canvas.getContext('2d')
    const resize = () => {
      const parent = canvas.parentElement
      const dpr = window.devicePixelRatio || 1
      const width = parent ? parent.clientWidth : 600
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const freqArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 1024)

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1)
      const h = canvas.height / (window.devicePixelRatio || 1)
      ctx2d.clearRect(0, 0, w, h)
      ctx2d.fillStyle = '#0a0a0a'
      ctx2d.fillRect(0, 0, w, h)

      if (analyser) {
        analyser.getByteFrequencyData(freqArray)
        const bars = Math.min(96, freqArray.length)
        const gap = 2
        const barW = Math.max(2, Math.floor((w - (bars - 1) * gap) / bars))
        for (let i = 0; i < bars; i++) {
          const v = freqArray[i] / 255
          const barH = Math.max(2, Math.floor(v * (h - 4)))
          const x = i * (barW + gap)
          const y = h - barH
          const grad = ctx2d.createLinearGradient(0, y, 0, y + barH)
          grad.addColorStop(0, '#00e5ff')
          grad.addColorStop(1, '#7c4dff')
          ctx2d.fillStyle = grad
          ctx2d.fillRect(x, y, barW, barH)
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [analyser, height])

  return (
    <Box sx={{ width: '100%' }}>
      <canvas ref={canvasRef} />
    </Box>
  )
}


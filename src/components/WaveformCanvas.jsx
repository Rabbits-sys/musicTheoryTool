import React, { useEffect, useRef } from 'react'
import { Box } from '@mui/material'

export default function WaveformCanvas({ analyser, height = 120 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx2d = canvas.getContext('2d')
    const dataArray = new Uint8Array(analyser ? analyser.fftSize : 2048)

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

    const draw = () => {
      if (!ctx2d) return
      ctx2d.clearRect(0, 0, canvas.width, canvas.height)
      ctx2d.fillStyle = '#0a0a0a'
      ctx2d.fillRect(0, 0, canvas.width, canvas.height)

      if (analyser) {
        analyser.getByteTimeDomainData(dataArray)
        const w = canvas.width / (window.devicePixelRatio || 1)
        const h = canvas.height / (window.devicePixelRatio || 1)
        ctx2d.strokeStyle = '#00e5ff'
        ctx2d.lineWidth = 2
        ctx2d.beginPath()
        const slice = w / dataArray.length
        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0 - 1.0 // -1..1
          const x = i * slice
          const y = h / 2 + v * (h / 2 - 4)
          if (i === 0) ctx2d.moveTo(x, y)
          else ctx2d.lineTo(x, y)
        }
        ctx2d.stroke()
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


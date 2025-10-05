import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { whiteIndexToMidi, labelForWhite } from '../../audio/pianoEngine.js'

/**
 * Render a single-octave keyboard group with 7 white keys and black key overlay.
 * @param {{ baseMidi: number, showLabels?: boolean, showBindings?: boolean, getBindingLabel?: (midi:number)=>string, onPlay?: (midi:number)=>void }} props
 * @returns {JSX.Element}
 */
export default function PianoKeyboardGroup({ baseMidi, showLabels = false, showBindings = false, getBindingLabel, onPlay }) {
  const [isDown, setIsDown] = useState(false)
  const [hoveredWhite, setHoveredWhite] = useState(null)
  const [hoveredBlack, setHoveredBlack] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const onDown = () => setIsDown(true)
    const onUp = () => { setIsDown(false); setHoveredWhite(null); setHoveredBlack(null) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const whiteKeys = useMemo(() => (
    Array.from({ length: 7 }, (_, i) => ({
      i,
      midi: whiteIndexToMidi(baseMidi, i),
      label: labelForWhite(baseMidi, i),
    }))
  ), [baseMidi])

  const blackKeys = useMemo(() => {
    const data = [
      { wi: 0, semi: 1, name: 'C#' },
      { wi: 1, semi: 3, name: 'D#' },
      { wi: 3, semi: 6, name: 'F#' },
      { wi: 4, semi: 8, name: 'G#' },
      { wi: 5, semi: 10, name: 'A#' },
    ]
    return data.map(d => ({ ...d, midi: baseMidi + d.semi }))
  }, [baseMidi])

  const trigger = (midi) => { onPlay && onPlay(midi) }

  const WHITE_W = 44
  const WHITE_H = 160
  const BLACK_W = Math.round(WHITE_W * 0.6)
  const BLACK_H = Math.round(WHITE_H * 0.62)

  return (
    <Box ref={containerRef} sx={{ position: 'relative', userSelect: 'none', display: 'inline-block', mb: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', border: '1px solid #ccc' }}>
        {whiteKeys.map((k, idx) => (
          <Box
            key={idx}
            onMouseDown={() => trigger(k.midi)}
            onMouseEnter={() => { setHoveredWhite(idx); if (isDown) trigger(k.midi) }}
            onMouseLeave={() => { if (hoveredWhite === idx) setHoveredWhite(null) }}
            sx={{
              width: WHITE_W,
              height: WHITE_H,
              backgroundColor: isDown && hoveredWhite === idx ? '#dfe8ff' : '#fff',
              borderRight: idx < 6 ? '1px solid #ddd' : 'none',
              position: 'relative',
              transition: 'background-color 60ms ease',
              '&:active': { backgroundColor: '#d0dcff' },
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ width: '100%', textAlign: 'center', mb: 1 }}>
              {showLabels && (
                <Typography variant="caption" sx={{ color: '#333', display: 'block', lineHeight: 1 }}>{k.label}</Typography>
              )}
              {showBindings && getBindingLabel && (
                <Typography variant="caption" sx={{ color: '#999', display: 'block', lineHeight: 1 }}>
                  {getBindingLabel(k.midi) || ''}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: BLACK_H, pointerEvents: 'none' }}>
        {blackKeys.map((b, idx) => {
          const left = (b.wi + 1) * WHITE_W - Math.round(BLACK_W / 2)
          return (
            <Box
              key={idx}
              onMouseDown={() => trigger(b.midi)}
              onMouseEnter={() => { setHoveredBlack(idx); if (isDown) trigger(b.midi) }}
              onMouseLeave={() => { if (hoveredBlack === idx) setHoveredBlack(null) }}
              sx={{
                position: 'absolute',
                left,
                width: BLACK_W,
                height: BLACK_H,
                backgroundColor: isDown && hoveredBlack === idx ? '#333' : '#000',
                border: '1px solid #222',
                borderRadius: '0 0 4px 4px',
                pointerEvents: 'auto',
                transition: 'background-color 60ms ease',
                '&:active': { backgroundColor: '#222' },
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
            >
              {showBindings && getBindingLabel && (
                <Typography variant="caption" sx={{ color: '#bbb', mb: 1, lineHeight: 1 }}>
                  {getBindingLabel(b.midi) || ''}
                </Typography>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}


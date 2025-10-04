import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { whiteIndexToMidi, labelForWhite } from '../audio/pianoEngine.js'

// A single-octave keyboard: 7 white keys with black keys overlay
export default function KeyboardGroup({ baseMidi, showLabels = false, onPlay }) {
  const whiteKeys = useMemo(() => (
    Array.from({ length: 7 }, (_, i) => ({
      i,
      midi: whiteIndexToMidi(baseMidi, i),
      label: labelForWhite(baseMidi, i),
    }))
  ), [baseMidi])

  const blackKeys = useMemo(() => {
    // black positions between whites: 0(C#),1(D#), 3(F#),4(G#),5(A#)
    const data = [
      { wi: 0, semi: 1, name: 'C#' },
      { wi: 1, semi: 3, name: 'D#' },
      { wi: 3, semi: 6, name: 'F#' },
      { wi: 4, semi: 8, name: 'G#' },
      { wi: 5, semi: 10, name: 'A#' },
    ]
    return data.map(d => ({
      ...d,
      midi: baseMidi + d.semi,
    }))
  }, [baseMidi])

  const onWhiteDown = (midi) => {
    onPlay && onPlay(midi)
  }
  const onBlackDown = (midi) => {
    onPlay && onPlay(midi)
  }

  // Visual sizes
  const WHITE_W = 44
  const WHITE_H = 160
  const BLACK_W = Math.round(WHITE_W * 0.6)
  const BLACK_H = Math.round(WHITE_H * 0.62)

  return (
    <Box sx={{ position: 'relative', userSelect: 'none', display: 'inline-block', mb: 1 }}>
      {/* White keys */}
      <Box sx={{ display: 'flex', flexDirection: 'row', border: '1px solid #ccc' }}>
        {whiteKeys.map((k, idx) => (
          <Box
            key={idx}
            onMouseDown={() => onWhiteDown(k.midi)}
            onTouchStart={(e) => { e.preventDefault(); onWhiteDown(k.midi) }}
            sx={{
              width: WHITE_W,
              height: WHITE_H,
              backgroundColor: '#fff',
              borderRight: idx < 6 ? '1px solid #ddd' : 'none',
              position: 'relative',
              '&:active': { backgroundColor: '#eef' },
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            {showLabels && (
              <Typography variant="caption" sx={{ mb: 1, color: '#333' }}>{k.label}</Typography>
            )}
          </Box>
        ))}
      </Box>

      {/* Black keys overlay */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: BLACK_H, pointerEvents: 'none' }}>
        {blackKeys.map((b, idx) => {
          // compute left offset: black sits between white wi and wi+1, leaning right
          const left = (b.wi + 1) * WHITE_W - Math.round(BLACK_W / 2)
          return (
            <Box
              key={idx}
              onMouseDown={() => onBlackDown(b.midi)}
              onTouchStart={(e) => { e.preventDefault(); onBlackDown(b.midi) }}
              sx={{
                position: 'absolute',
                left,
                width: BLACK_W,
                height: BLACK_H,
                backgroundColor: '#000',
                border: '1px solid #222',
                borderRadius: '0 0 4px 4px',
                pointerEvents: 'auto',
                '&:active': { backgroundColor: '#333' },
              }}
            />
          )
        })}
      </Box>
    </Box>
  )
}


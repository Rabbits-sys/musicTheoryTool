import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, IconButton, Slider, Stack, Typography, Alert, AlertTitle, Card, CardContent } from '@mui/material'
import RemoveIcon from '@mui/icons-material/Remove'
import AddIcon from '@mui/icons-material/Add'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import * as Tone from 'tone'
import useMetronomeStore from '../store/useMetronomeStore.js'

// Beat strength types
const STRONG = 'strong'
const SECONDARY = 'secondary'
const WEAK = 'weak'

const strengthCycle = (s) => {
  // click once: strong -> weak, secondary -> strong, weak -> secondary
  if (s === STRONG) return WEAK
  if (s === SECONDARY) return STRONG
  return SECONDARY
}

const strengthToColor = (s) => {
  switch (s) {
    case STRONG:
      return '#EE7A3B' // orange-like
    case SECONDARY:
      return '#3BBE9E' // teal-like
    default:
      return '#D3D6DC' // gray
  }
}

function BeatDot({ strength, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        backgroundColor: strengthToColor(strength),
        cursor: 'pointer',
        transform: active ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 40ms linear',
        boxShadow: active ? '0 0 0 2px rgba(0,0,0,0.05) inset' : 'none'
      }}
    />
  )
}

export default function MetronomePage() {
  const bpm = useMetronomeStore((s) => s.bpm)
  const beats = useMetronomeStore((s) => s.beats)
  const setBpmStore = useMetronomeStore((s) => s.setBpm)
  const setBeatsStore = useMetronomeStore((s) => s.setBeats)

  const [pattern, setPattern] = useState(() => Array.from({ length: beats }, (_, i) => (i === 0 ? STRONG : WEAK)))
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  // ensure pattern length tracks beats (do not persist pattern)
  useEffect(() => {
    setPattern((prev) => {
      const next = [...prev]
      if (beats > next.length) {
        while (next.length < beats) next.push(WEAK)
      } else if (beats < next.length) {
        next.length = beats
      }
      if (next[0] !== STRONG) next[0] = STRONG
      return next
    })
  }, [beats])

  // Tone Synths and schedule
  const strongSynthRef = useRef(null)
  const secondSynthRef = useRef(null)
  const weakSynthRef = useRef(null)
  const loopIdRef = useRef(null)
  const indexRef = useRef(0)
  const patternRef = useRef(pattern)
  const beatsRef = useRef(beats)

  useEffect(() => { patternRef.current = pattern }, [pattern])
  useEffect(() => { beatsRef.current = beats }, [beats])

  useEffect(() => {
    // create synths once
    if (!strongSynthRef.current) {
      strongSynthRef.current = new Tone.FMSynth({
        harmonicity: 2.5,
        modulationIndex: 12,
        oscillator: { type: 'sine' },
        modulation: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 },
        modulationEnvelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 }
      }).toDestination()
      strongSynthRef.current.volume.value = -4
    }
    if (!secondSynthRef.current) {
      secondSynthRef.current = new Tone.AMSynth({
        harmonicity: 1.5,
        oscillator: { type: 'triangle' },
        modulation: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.03 },
        modulationEnvelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.03 }
      }).toDestination()
      secondSynthRef.current.volume.value = -6
    }
    if (!weakSynthRef.current) {
      weakSynthRef.current = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.02 }
      }).toDestination()
      weakSynthRef.current.volume.value = -8
    }
    return () => {
      // cleanup on unmount
      stopTransport()
      strongSynthRef.current?.dispose(); strongSynthRef.current = null
      secondSynthRef.current?.dispose(); secondSynthRef.current = null
      weakSynthRef.current?.dispose(); weakSynthRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // reflect BPM changes live
  useEffect(() => {
    if (Tone.Transport.state !== 'stopped') {
      Tone.getTransport().bpm.rampTo(bpm, 0.05)
    }
  }, [bpm])

  const startTransport = async () => {
    await Tone.start()
    Tone.Transport.stop()
    Tone.Transport.cancel()
    Tone.Transport.bpm.value = bpm
    indexRef.current = 0
    setActiveIndex(-1)

    loopIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const i = indexRef.current
      const strength = patternRef.current[i] ?? WEAK
      // choose synth + note per strength
      if (strength === STRONG) {
        strongSynthRef.current?.triggerAttackRelease('A6', '16n', time, 1.0)
      } else if (strength === SECONDARY) {
        secondSynthRef.current?.triggerAttackRelease('E6', '16n', time, 0.8)
      } else {
        weakSynthRef.current?.triggerAttackRelease('C6', '16n', time, 0.5)
      }
      setActiveIndex(i)
      indexRef.current = (i + 1) % beatsRef.current
    }, '4n')

    Tone.Transport.start('+0.05')
    setIsPlaying(true)
  }

  const stopTransport = () => {
    if (Tone.Transport.state !== 'stopped') {
      Tone.Transport.stop()
      Tone.Transport.cancel()
      Tone.Transport.position = 0
    }
    setIsPlaying(false)
    setActiveIndex(-1)
    indexRef.current = 0
  }

  const togglePlay = () => {
    if (isPlaying) stopTransport()
    else startTransport()
  }

  const handleBeatClick = (idx) => {
    setPattern((prev) => {
      const next = [...prev]
      next[idx] = strengthCycle(prev[idx])
      return next
    })
  }

  const decrementBpm = () => setBpmStore(bpm - 1)
  const incrementBpm = () => setBpmStore(bpm + 1)

  const decrementBeats = () => setBeatsStore(beats - 1)
  const incrementBeats = () => setBeatsStore(beats + 1)

  // if beats changed while playing, keep rotating within new bounds
  useEffect(() => {
    if (isPlaying) {
      indexRef.current = indexRef.current % beatsRef.current
    }
  }, [beats, isPlaying])

  // UI
  return (
    <Box>
      <Box mb={2}>
        <Alert severity="info">
          <AlertTitle>使用指南</AlertTitle>
          1) 通过下方滑块或 +/- 按钮设置 BPM（范围 20–240），上方大号数字实时显示当前 BPM。<br />
          2) 中部圆点表示每一拍：橙色=强拍，青色=次强拍，灰色=弱拍；点击某个圆点可在「强→弱→次强→强」之间循环切换。<br />
          3) 点击“开始”从第一拍开始播放；播放时，当前拍的圆点会在两拍之间放大显示。再次点击“停止”结束。<br />
          4) 底部可设置节拍数（2–8）；BPM 与节拍数会自动记忆，下次打开沿用上次设置（强弱拍模式不保存）。
        </Alert>
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            {/* Top BPM title & number */}
            <Stack alignItems="center" spacing={1}>
              <Typography variant="overline" color="text.secondary">BPM</Typography>
              <Typography variant="h1" sx={{ fontWeight: 800, lineHeight: 1, fontSize: { xs: 72, sm: 96 } }}>{bpm}</Typography>
            </Stack>

            {/* Slider with - and + */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ px: { xs: 1, sm: 4 } }}>
              <IconButton size="small" onClick={decrementBpm}><RemoveIcon /></IconButton>
              <Slider value={bpm} onChange={(_, v) => setBpmStore(Array.isArray(v) ? v[0] : v)} min={20} max={240} step={1}
                sx={{ flex: 1 }} aria-label="BPM" />
              <IconButton size="small" onClick={incrementBpm}><AddIcon /></IconButton>
            </Stack>

            {/* Beat dots */}
            <Stack alignItems="center" spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">节拍</Typography>
              <Stack direction="row" spacing={2} mt={1} justifyContent="center">
                {Array.from({ length: beats }).map((_, i) => (
                  <BeatDot key={i} strength={pattern[i] ?? WEAK} active={i === activeIndex} onClick={() => handleBeatClick(i)} />
                ))}
              </Stack>
            </Stack>

            {/* Start/Stop */}
            <Stack alignItems="center">
              <Button variant="contained" color={isPlaying ? 'error' : 'warning'} size="large" onClick={togglePlay}
                startIcon={isPlaying ? <StopIcon /> : <PlayArrowIcon />}>
                {isPlaying ? '停止' : '开始'}
              </Button>
            </Stack>

            {/* Bottom beats count */}
            <Stack alignItems="center">
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>节拍数</Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <IconButton onClick={decrementBeats} disabled={isPlaying}><RemoveIcon /></IconButton>
                <Typography variant="h5" sx={{ width: 24, textAlign: 'center' }}>{beats}</Typography>
                <IconButton onClick={incrementBeats} disabled={isPlaying}><AddIcon /></IconButton>
              </Stack>
              <Typography variant="caption" color="text.disabled" mt={1}>范围 2–8</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

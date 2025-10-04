import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, Stack, Typography, Autocomplete, TextField, FormControlLabel, Checkbox, Box, Alert } from '@mui/material'
import Grid from '@mui/material/Grid'
import KeyboardGroup from '../components/KeyboardGroup.jsx'
import WaveformCanvas from '../components/WaveformCanvas.jsx'
import { PianoEngine, OCTAVE_OPTIONS } from '../audio/pianoEngine.js'

export default function PianoPage() {
  const engineRef = useRef(null)
  if (!engineRef.current) engineRef.current = new PianoEngine()
  const engine = engineRef.current

  const [groupKeys, setGroupKeys] = useState(['small', 'one', 'two'])
  const [showLabels, setShowLabels] = useState(false)
  const [showBindings, setShowBindings] = useState(false)

  const [instruments, setInstruments] = useState([])
  const [instrumentKey, setInstrumentKey] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch('samples/manifest.json')
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const json = await r.json()
        const list = Array.isArray(json?.instruments) ? json.instruments : []
        setInstruments(list)
        if (list.length > 0) {
          setInstrumentKey(list[0].key || '')
          engine.setInstrument(list[0])
        } else {
          setLoadError('未在 samples/manifest.json 中找到任何音色条目。')
        }
      } catch (e) {
        setLoadError('未能加载音色清单（samples/manifest.json）。请确认已将 ./samples 复制/打包到应用目录。')
      }
    }
    load()
  }, [engine])

  useEffect(() => {
    if (!instrumentKey) return
    const def = instruments.find((i) => i.key === instrumentKey)
    if (def) engine.setInstrument(def)
  }, [instrumentKey, instruments, engine])

  const options = useMemo(() => OCTAVE_OPTIONS, [])
  const selectedOpts = useMemo(() => groupKeys.map(k => options.find(o => o.key === k) || options[0]), [groupKeys, options])

  const handleChangeGroup = (index, newKey) => {
    setGroupKeys(prev => prev.map((k, i) => (i === index ? newKey : k)))
  }

  const onPlay = (midi) => {
    engine.playMidi(midi)
  }

  const analyser = engine.getAnalyser()

  // Restore prior keyboard window mapping: 2 octaves (24 semis) shiftable by [ and ] within C2..B6
  const [keyboardBaseMidi, setKeyboardBaseMidi] = useState(60) // C4
  const MIN_BASE = 36 // C2
  const MAX_END = 83 // B6
  const rowLow = ['Z','S','X','D','C','V','G','B','H','N','J','M']
  const rowHigh = ['Q','2','W','3','E','R','5','T','6','Y','7','U']
  const keyToOffset = useMemo(() => {
    const map = new Map()
    rowLow.forEach((k, i) => map.set(k, i))
    rowHigh.forEach((k, i) => map.set(k, i + 12))
    return map
  }, [])
  const allBindingKeys = useMemo(() => [...rowLow, ...rowHigh], [])

  useEffect(() => {
    const pressed = new Set()
    const onKeyDown = (e) => {
      const raw = e.key
      const k = raw.length === 1 ? raw.toUpperCase() : raw
      // Shift octave: '-' down, '+' up (also support '=' as '+', and numpad +/-)
      if (raw === '-' || raw === 'NumpadSubtract' || raw === '_' ) {
        e.preventDefault()
        let next = keyboardBaseMidi - 12
        if (next < MIN_BASE) next = MIN_BASE
        if (next + 23 > MAX_END) next = MAX_END - 23
        setKeyboardBaseMidi(next)
        return
      }
      if (raw === '+' || raw === '=' || raw === 'NumpadAdd') {
        e.preventDefault()
        let next = keyboardBaseMidi + 12
        if (next < MIN_BASE) next = MIN_BASE
        if (next + 23 > MAX_END) next = MAX_END - 23
        setKeyboardBaseMidi(next)
        return
      }
      if (!/^[A-Z0-9]$/.test(k)) return
      if (pressed.has(k)) return
      const offset = keyToOffset.get(k)
      if (offset == null) return
      pressed.add(k)
      e.preventDefault()
      const midi = keyboardBaseMidi + offset
      if (midi < MIN_BASE || midi > MAX_END) return
      engine.playMidi(midi)
    }
    const onKeyUp = (e) => {
      const k = e.key.length === 1 ? e.key.toUpperCase() : e.key
      pressed.delete(k)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [engine, keyboardBaseMidi, keyToOffset])

  const getBindingLabel = (midi) => {
    const offset = midi - keyboardBaseMidi
    if (offset < 0 || offset > 23) return ''
    return allBindingKeys[offset] || ''
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">虚拟钢琴</Typography>
          <Typography color="text.secondary">三组键盘（采样音色），每组可选择所属八度。点击琴键可发声，频谱条形图在下方显示。</Typography>

          {loadError && (
            <Alert severity="warning">{loadError}</Alert>
          )}

          <Stack direction="row" spacing={2} alignItems="center">
            <Autocomplete
              options={instruments}
              getOptionLabel={(o) => o?.key || ''}
              value={instruments.find(i => i.key === instrumentKey) || null}
              isOptionEqualToValue={(a, b) => a?.key === b?.key}
              disableClearable
              onChange={(e, v) => v && setInstrumentKey(v.key)}
              sx={{ width: 260 }}
              renderInput={(params) => (
                <TextField {...params} label="钢琴音色" placeholder="选择虚拟钢琴音色" />
              )}
            />
            <FormControlLabel
              control={<Checkbox checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />}
              label="在白键上显示音名"
            />
            <FormControlLabel
              control={<Checkbox checked={showBindings} onChange={(e) => setShowBindings(e.target.checked)} />}
              label="在白键/黑键上显示绑定按键"
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">提示：使用 - / + 调整键盘音域（覆盖 C2–B6）。当前键盘基音：{keyboardBaseMidi}（MIDI）</Typography>

          <Box>
            <Grid container spacing={2}>
              {selectedOpts.map((opt, idx) => (
                <Grid key={idx} item xs={12} md={4}>
                  <Stack spacing={1} alignItems="center">
                    <Autocomplete
                      options={options}
                      getOptionLabel={(o) => o.label}
                      value={opt}
                      isOptionEqualToValue={(a, b) => a?.key === b?.key}
                      disableClearable
                      onChange={(e, v) => v && handleChangeGroup(idx, v.key)}
                      sx={{ width: 200 }}
                      renderInput={(params) => (
                        <TextField {...params} label={`第 ${idx + 1} 组八度`} placeholder="选择八度" />
                      )}
                    />
                    <KeyboardGroup
                      baseMidi={opt.baseMidi}
                      showLabels={showLabels}
                      showBindings={showBindings}
                      getBindingLabel={getBindingLabel}
                      onPlay={onPlay}
                    />
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              当前声音频谱
            </Typography>
            <WaveformCanvas analyser={analyser} height={160} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

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
                <TextField {...params} label="虚拟钢琴音色（乐器模拟）" placeholder="选择模拟乐器名称" />
              )}
            />
            <FormControlLabel
              control={<Checkbox checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />}
              label="在白键上显示音名"
            />
          </Stack>

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
                    <KeyboardGroup baseMidi={opt.baseMidi} showLabels={showLabels} onPlay={onPlay} />
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

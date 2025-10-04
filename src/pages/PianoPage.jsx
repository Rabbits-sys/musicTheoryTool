import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, Stack, Typography, Autocomplete, TextField, FormControlLabel, Checkbox, Box } from '@mui/material'
import Grid from '@mui/material/Grid'
import KeyboardGroup from '../components/KeyboardGroup.jsx'
import WaveformCanvas from '../components/WaveformCanvas.jsx'
import { PianoEngine, OCTAVE_OPTIONS, TIMBRE_OPTIONS } from '../audio/pianoEngine.js'

export default function PianoPage() {
  const engineRef = useRef(null)
  if (!engineRef.current) engineRef.current = new PianoEngine()
  const engine = engineRef.current

  const [groupKeys, setGroupKeys] = useState(['small', 'one', 'two'])
  const [showLabels, setShowLabels] = useState(false)
  const [timbreKey, setTimbreKey] = useState('acoustic_piano')

  const options = useMemo(() => OCTAVE_OPTIONS, [])
  const timbreOptions = useMemo(() => TIMBRE_OPTIONS, [])
  const selectedOpts = useMemo(() => groupKeys.map(k => options.find(o => o.key === k) || options[0]), [groupKeys, options])
  const selectedTimbre = useMemo(() => timbreOptions.find(t => t.key === timbreKey) || timbreOptions[0], [timbreOptions, timbreKey])

  useEffect(() => {
    engine.setTimbreByKey(timbreKey)
  }, [engine, timbreKey])

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
          <Typography color="text.secondary">三组键盘，每组可选择所属八度（大字组/小字组/小字一组等）。点击琴键可发声，频谱条形图在下方显示。</Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <Autocomplete
              options={timbreOptions}
              getOptionLabel={(o) => o.label}
              value={selectedTimbre}
              isOptionEqualToValue={(a, b) => a?.key === b?.key}
              disableClearable
              onChange={(e, v) => v && setTimbreKey(v.key)}
              sx={{ width: 260 }}
              renderInput={(params) => (
                <TextField {...params} label="钢琴音色" placeholder="选择音色" />
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

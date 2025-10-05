import React, { useMemo } from 'react'
import { Box, Button, Card, CardContent, Stack, Typography, Autocomplete, TextField } from '@mui/material'
import useSyllableStore, { syllableDifficultyPresets } from '../../store/useSyllableStore.js'

/**
 * Difficulty selector for syllable (solfege) training.
 * Provides preset selection and starts a practice session.
 * @returns {JSX.Element}
 */
export default function SyllableDifficultySelector() {
  const setSelectedDifficulty = useSyllableStore(s => s.setSelectedDifficulty)
  const selectedDifficultyKey = useSyllableStore(s => s.selectedDifficultyKey)
  const selectedDifficulty = useSyllableStore(s => s.selectedDifficulty)
  const startSyllablePractice = useSyllableStore(s => s.startSyllablePractice)

  const options = useMemo(() => Object.entries(syllableDifficultyPresets).map(([key, cfg]) => ({ key, ...cfg })), [])
  const selected = useMemo(() => options.find(o => o.key === selectedDifficultyKey) || options[0], [options, selectedDifficultyKey])

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">选择难度</Typography>

          <Autocomplete
            options={options}
            getOptionLabel={(opt) => `${opt.label}`}
            value={selected}
            isOptionEqualToValue={(a, b) => a?.key === b?.key}
            disableClearable
            onChange={(e, v) => { if (v) setSelectedDifficulty(v.key) }}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography>{option.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    速度：{Math.round(60000 / option.intervalMs)} 拍/分 · 题数：{option.count}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="难度"
                placeholder="请选择难度"
                helperText="难度越高，速度越快、题数更多"
              />
            )}
          />

          <Box>
            <Typography color="text.secondary">
              当前难度：{selectedDifficulty.label} · 速度：{Math.round(60000 / selectedDifficulty.intervalMs)} 拍/分 · 题数：{selectedDifficulty.count}
            </Typography>
          </Box>

          <Box>
            <Button variant="contained" onClick={startSyllablePractice}>开始练习</Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}


import React, { useMemo } from 'react'
import { Box, Button, Card, CardContent, Stack, Typography, Autocomplete, TextField } from '@mui/material'
import useIntervalStore, { intervalDifficultyPresets } from '../store/useIntervalStore.js'

export default function IntervalDifficultySelector() {
  const setDifficulty = useIntervalStore(s => s.setDifficulty)
  const difficultyKey = useIntervalStore(s => s.difficultyKey)
  const difficulty = useIntervalStore(s => s.difficulty)
  const start = useIntervalStore(s => s.start)

  const options = useMemo(() => Object.entries(intervalDifficultyPresets).map(([key, cfg]) => ({ key, ...cfg })), [])
  const selected = useMemo(() => options.find(o => o.key === difficultyKey) || options[0], [options, difficultyKey])

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
            onChange={(e, v) => { if (v) setDifficulty(v.key) }}
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
              当前难度：{difficulty.label} · 速度：{Math.round(60000 / difficulty.intervalMs)} 拍/分 · 题数：{difficulty.count}
            </Typography>
          </Box>

          <Box>
            <Button variant="contained" onClick={start}>开始练习</Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}


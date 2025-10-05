import React, { useMemo } from 'react'
import { Autocomplete, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import useMajorStore, { majorDifficultyPresets } from '../../store/useMajorStore.js'

/**
 * Difficulty selector for natural major scale practice.
 * @returns {JSX.Element}
 */
export default function MajorDifficultySelector() {
  const setDifficulty = useMajorStore(s => s.setDifficulty)
  const difficultyKey = useMajorStore(s => s.difficultyKey)
  const difficulty = useMajorStore(s => s.difficulty)
  const start = useMajorStore(s => s.start)

  const options = useMemo(() => Object.values(majorDifficultyPresets), [])
  const selected = useMemo(() => options.find(o => o.key === difficultyKey) || options[0], [options, difficultyKey])

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">选择难度</Typography>

          <Autocomplete
            options={options}
            getOptionLabel={(opt) => opt.label}
            value={selected}
            isOptionEqualToValue={(a,b) => a?.key === b?.key}
            disableClearable
            onChange={(e,v) => { if (v) setDifficulty(v.key) }}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography>{option.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{option.description}</Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="难度" placeholder="请选择难度" helperText="仅白键出发 或 包含黑键出发（含 # / b）" />
            )}
          />

          <Typography color="text.secondary">当前难度：{difficulty.label}</Typography>

          <Box>
            <Button variant="contained" onClick={start}>开始练习</Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}


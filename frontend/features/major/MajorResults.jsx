import React from 'react'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import Grid2 from '@mui/material/Grid2'
import useMajorStore from '../../store/useMajorStore.js'
import { formatDuration } from '../../utils/time.js'

/**
 * Results view for natural major scale practice.
 * Shows per-tonic correctness and overall accuracy/time.
 * @returns {JSX.Element}
 */
export default function MajorResults() {
  const tonics = useMajorStore(s => s.tonics)
  const results = useMajorStore(s => s.results)
  const reset = useMajorStore(s => s.reset)
  const durationMs = useMajorStore(s => s.durationMs)

  const list = tonics.map(t => results[t]).filter(Boolean)
  const total = list.length
  const correctCount = list.reduce((acc, r) => acc + (r.correct ? 1 : 0), 0)
  const accuracy = total ? Math.round((correctCount / total) * 100) : 0

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6">练习结果</Typography>
          <Typography sx={{ mt: 1 }}>总体正确率：{accuracy}%（{correctCount}/{total}）</Typography>
          <Typography sx={{ mt: 0.5 }} color="text.secondary">用时：{formatDuration(durationMs ?? 0)}</Typography>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={reset}>返回难度选择</Button>
          </Box>
        </CardContent>
      </Card>

      {tonics.map((t) => {
        const r = results[t]
        if (!r) return null
        return (
          <Card key={t}>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {r.correct ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                  <Typography variant="subtitle1">1={t}</Typography>
                </Stack>
                <Grid2 container spacing={2}>
                  <Grid2 xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">你的答案</Typography>
                    <Typography>{(r.input || []).join(' ') || '(空)'}</Typography>
                  </Grid2>
                  <Grid2 xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">标准答案</Typography>
                    <Typography>{(r.expected || []).join(' ')}</Typography>
                  </Grid2>
                </Grid2>
              </Stack>
            </CardContent>
          </Card>
        )
      })}
    </Stack>
  )
}

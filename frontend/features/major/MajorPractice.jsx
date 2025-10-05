import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import useMajorStore from '../../store/useMajorStore.js'
import { formatDuration } from '../../utils/time.js'

/**
 * Practice form for natural major scale writing.
 * Renders rows of tonics and accepts user input for each scale.
 * @returns {JSX.Element}
 */
export default function MajorPractice() {
  const tonics = useMajorStore(s => s.tonics)
  const answers = useMajorStore(s => s.answers)
  const setAnswer = useMajorStore(s => s.setAnswer)
  const submit = useMajorStore(s => s.submit)
  const reset = useMajorStore(s => s.reset)
  const startedAt = useMajorStore(s => s.startedAt)

  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    setElapsed(0)
    clearInterval(timerRef.current)
    if (startedAt) {
      const tick = () => {
        const ms = Date.now() - startedAt
        setElapsed(ms > 0 ? ms : 0)
      }
      tick()
      timerRef.current = setInterval(tick, 500)
    }
    return () => clearInterval(timerRef.current)
  }, [startedAt])

  const helper = '请按顺序输入完整自然大调音阶，音名用空格分隔；升号用 #，降号用 b。'

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">请为每个调号输入完整自然大调音阶</Typography>
            <Typography variant="body2" color="text.secondary">用时：{formatDuration(elapsed)}</Typography>
          </Stack>

          <Grid2 container spacing={2}>
            {tonics.map((t) => (
              <Grid2 xs={12} key={t}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                  <Box sx={{ width: 120 }}>
                    <Typography variant="subtitle1">1={t}</Typography>
                  </Box>
                  <TextField
                    fullWidth
                    value={answers[t] || ''}
                    onChange={(e) => setAnswer(t, e.target.value)}
                    placeholder="如：C D E F G A B C"
                    helperText={helper}
                  />
                </Stack>
              </Grid2>
            ))}
          </Grid2>

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={reset}>返回</Button>
            <Button variant="contained" onClick={submit}>提交并判分</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

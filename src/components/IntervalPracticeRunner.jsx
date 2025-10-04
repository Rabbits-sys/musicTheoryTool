import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, Chip, Divider, LinearProgress, Stack, TextField, Typography } from '@mui/material'
import useIntervalStore from '../store/useIntervalStore.js'
import { formatToken } from '../utils/enharmonic.js'

export default function IntervalPracticeRunner() {
  const difficulty = useIntervalStore(s => s.difficulty)
  const questions = useIntervalStore(s => s.questions)
  const idx = useIntervalStore(s => s.idx)
  const submitCurrent = useIntervalStore(s => s.submitCurrent)

  const q = questions[idx]
  const [semiInput, setSemiInput] = useState('')
  const [wholeInput, setWholeInput] = useState('')

  // countdown
  const totalMs = difficulty.intervalMs
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const tickerRef = useRef(null)

  const isLast = idx + 1 >= questions.length

  useEffect(() => {
    // reset inputs and timers on new question
    setSemiInput('')
    setWholeInput('')
    setElapsed(0)

    // auto submit after totalMs
    clearTimeout(timerRef.current)
    clearInterval(tickerRef.current)
    timerRef.current = setTimeout(() => {
      handleSubmit()
    }, totalMs)
    const startedAt = Date.now()
    tickerRef.current = setInterval(() => {
      const e = Date.now() - startedAt
      setElapsed(e > totalMs ? totalMs : e)
    }, 100)

    return () => {
      clearTimeout(timerRef.current)
      clearInterval(tickerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const progress = Math.min(100, Math.round((elapsed / totalMs) * 100))

  const semiDirText = q.semitone.dir > 0 ? '升半音' : '降半音'
  const wholeDirText = q.whole.dir > 0 ? '升全音' : '降全音'

  const handleSubmit = () => {
    clearTimeout(timerRef.current)
    clearInterval(tickerRef.current)
    submitCurrent(semiInput.trim(), wholeInput.trim())
  }

  const helper = '输入规则：大字组用 -N，如 C-1；小字组用 n，如 e1；升 #，重升 X；降 b，重降 bb。多个等音用空格分隔。'

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">第 {idx + 1} / {questions.length} 题</Typography>
          <LinearProgress variant="determinate" value={progress} />

          <Box>
            <Typography variant="subtitle2" color="text.secondary">题目</Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {q.promptDisplay}
            </Typography>
          </Box>

          <Divider />

          <Stack spacing={2}>
            <TextField
              label={`${semiDirText}（写出所有等音）`}
              value={semiInput}
              onChange={(e) => setSemiInput(e.target.value)}
              placeholder="#C bD 等"
              helperText={helper}
              fullWidth
            />
            <TextField
              label={`${wholeDirText}（写出所有等音）`}
              value={wholeInput}
              onChange={(e) => setWholeInput(e.target.value)}
              placeholder="D XC bbE 等"
              helperText={helper}
              fullWidth
            />
          </Stack>

          <Box>
            <Button variant="contained" onClick={handleSubmit}>{isLast ? '提交并完成' : '提交 / 下一题'}</Button>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              参考：本题的半音目标有 {q.semitone.expected.length} 个等音，全音目标有 {q.whole.expected.length} 个等音。
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}


import React from 'react'
import { Box, Button, Card, CardContent, Chip, Divider, Grid, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import useIntervalStore from '../store/useIntervalStore.js'
import { formatToken } from '../utils/enharmonic.js'

export default function IntervalResultsView() {
  const questions = useIntervalStore(s => s.questions)
  const answers = useIntervalStore(s => s.answers)
  const reset = useIntervalStore(s => s.reset)

  const total = answers.length
  const correctCount = answers.reduce((acc, a) => acc + ((a.semiCorrect ? 1 : 0) + (a.wholeCorrect ? 1 : 0)), 0)
  const totalChecks = total * 2
  const accuracy = totalChecks ? Math.round((correctCount / totalChecks) * 100) : 0

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6">练习结果</Typography>
          <Typography sx={{ mt: 1 }}>总体正确率：{accuracy}%（{correctCount}/{totalChecks}）</Typography>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={reset}>返回并重新选择难度</Button>
          </Box>
        </CardContent>
      </Card>

      {questions.map((q, i) => {
        const a = answers[i]
        if (!a) return null
        return (
          <Card key={i}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle1">第 {i + 1} 题：{q.promptDisplay}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">{q.semitone.dir > 0 ? '升半音' : '降半音'}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {a.semiCorrect ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                      <Typography>你的答案：{a.semiInput || '(空)'}</Typography>
                    </Stack>
                    <Typography variant="body2">标准等音：{q.semitone.expected.join(' ')}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">{q.whole.dir > 0 ? '升全音' : '降全音'}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {a.wholeCorrect ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                      <Typography>你的答案：{a.wholeInput || '(空)'}</Typography>
                    </Stack>
                    <Typography variant="body2">标准等音：{q.whole.expected.join(' ')}</Typography>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        )
      })}
    </Stack>
  )
}


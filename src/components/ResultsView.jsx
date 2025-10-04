import React, { useMemo } from 'react'
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import usePracticeStore from '../store/usePracticeStore.js'

function ResultRow({ idx, item }) {
  const { expected, recognizedNumber, word, correct, confidence } = item
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
      <Typography sx={{ width: 40 }} color="text.secondary">#{idx + 1}</Typography>
      <Typography sx={{ width: 80 }}>题目：{expected}</Typography>
      <Typography sx={{ width: 140 }}>识别：{recognizedNumber ?? '-'}{word ? ` (${word})` : ''}</Typography>
      <Typography sx={{ width: 120 }} color="text.secondary">置信度：{confidence != null ? confidence.toFixed(2) : '-'}</Typography>
      {correct ? (
        <Chip icon={<CheckCircleIcon />} color="success" label="正确" />
      ) : (
        <Chip icon={<CancelIcon />} color="error" label="错误" />
      )}
    </Stack>
  )
}

export default function ResultsView() {
  const results = usePracticeStore(s => s.results)
  const reset = usePracticeStore(s => s.reset)

  const { correctCount, accuracy } = useMemo(() => {
    const c = results.filter(r => r.correct).length
    const acc = results.length ? Math.round((c / results.length) * 100) : 0
    return { correctCount: c, accuracy: acc }
  }, [results])

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">练习结果</Typography>
          <Typography>总题数：{results.length}，正确：{correctCount}，正确率：{accuracy}%</Typography>
          <Divider />
          <Box>
            {results.map((r, idx) => (
              <ResultRow key={idx} idx={idx} item={r} />
            ))}
          </Box>
          <Box>
            <Button variant="contained" onClick={reset}>返回选择难度</Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}


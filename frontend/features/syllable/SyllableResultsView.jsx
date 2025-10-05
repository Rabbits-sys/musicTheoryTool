import React, { useMemo } from 'react'
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import useSyllableStore from '../../store/useSyllableStore.js'

/**
 * @typedef {Object} AttemptItem
 * @property {number} segmentId
 * @property {number} expected
 * @property {string | null | undefined} [word]
 * @property {number | undefined} [recognizedNumber]
 * @property {boolean} correct
 * @property {number | null | undefined} [confidence]
 */

/**
 * Row component for a single attempt.
 * @param {{ idx: number, item: AttemptItem }} props
 */
function AttemptRow({ idx, item }) {
  const { expected, recognizedNumber, word, correct, confidence } = item
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
      <Typography sx={{ width: 40 }} color="text.secondary">#{idx + 1}</Typography>
      <Typography sx={{ width: 80 }}>题目：{expected}</Typography>
      <Typography sx={{ width: 160 }}>识别：{recognizedNumber ?? '-'}{word ? ` (${word})` : ''}</Typography>
      <Typography sx={{ width: 140 }} color="text.secondary">置信度：{confidence != null ? confidence.toFixed(2) : '-'}</Typography>
      {correct ? (
        <Chip icon={<CheckCircleIcon />} color="success" label="正确" />
      ) : (
        <Chip icon={<CancelIcon />} color="error" label="错误" />
      )}
    </Stack>
  )
}

/**
 * Results view for syllable (solfege) practice.
 * @returns {JSX.Element}
 */
export default function SyllableResultsView() {
  const attemptResults = useSyllableStore(s => s.attemptResults)
  const resetSyllableTraining = useSyllableStore(s => s.resetSyllableTraining)

  const { correctCount, accuracy } = useMemo(() => {
    const c = attemptResults.filter(r => r.correct).length
    const acc = attemptResults.length ? Math.round((c / attemptResults.length) * 100) : 0
    return { correctCount: c, accuracy: acc }
  }, [attemptResults])

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">练习结果</Typography>
          <Typography>总题数：{attemptResults.length}，正确：{correctCount}，正确率：{accuracy}%</Typography>
          <Divider />
          <Box>
            {attemptResults.map((r, idx) => (
              <AttemptRow key={idx} idx={idx} item={r} />
            ))}
          </Box>
          <Box>
            <Button variant="contained" onClick={resetSyllableTraining}>返回难度选择</Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}


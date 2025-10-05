import React from 'react'
import { Alert, AlertTitle, Box } from '@mui/material'
import useIntervalStore from '../store/useIntervalStore.js'
import IntervalDifficultySelector from '../features/interval/IntervalDifficultySelector.jsx'
import IntervalPracticeRunner from '../features/interval/IntervalPracticeRunner.jsx'
import IntervalResultsView from '../features/interval/IntervalResultsView.jsx'

/**
 * Page for interval equivalence practice (semitone/whole tone enharmonics).
 * @returns {JSX.Element}
 */
export default function IntervalPage() {
  const stage = useIntervalStore(s => s.stage)
  return (
    <Box>
      <Box mb={2}>
        <Alert severity="info">
          <AlertTitle>练习说明</AlertTitle>
          1) 系统按难度随机给出一个音名（范围：大字一组至小字二组，可能带 #、X、b、bb）。<br />
          2) 请分别在两个输入框中写出该音的：升/降 半音 与 升/降 全音 的所有等音，多个等音之间以空格分隔；输入规则见占位提示。<br />
          3) 每题限时随难度变化，到时或点“提交/下一题”自动判定，结束后显示逐题判定与总体正确率。
        </Alert>
      </Box>

      {stage === 'select' && <IntervalDifficultySelector />}
      {stage === 'practice' && <IntervalPracticeRunner />}
      {stage === 'results' && <IntervalResultsView />}
    </Box>
  )
}

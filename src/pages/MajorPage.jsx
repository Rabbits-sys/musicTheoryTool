import React from 'react'
import { Alert, AlertTitle, Box } from '@mui/material'
import useMajorStore from '../store/useMajorStore.js'
import MajorDifficultySelector from '../components/MajorDifficultySelector.jsx'
import MajorPractice from '../components/MajorPractice.jsx'
import MajorResults from '../components/MajorResults.jsx'

export default function MajorPage() {
  const stage = useMajorStore(s => s.stage)
  return (
    <Box>
      <Box mb={2}>
        <Alert severity="info">
          <AlertTitle>练习说明</AlertTitle>
          1) 选择难度：仅白键出发 或 包含黑键出发。<br />
          2) 每行给出一个调号（如 1=C、1=#C、1=bD），请在输入框中写出该调的完整自然大调音阶，使用空格分隔。<br />
          3) 升号用 # 表示，降号用 b 表示；答案须与标准顺序与记号完全一致。
        </Alert>
      </Box>
      {stage === 'select' && <MajorDifficultySelector />}
      {stage === 'practice' && <MajorPractice />}
      {stage === 'results' && <MajorResults />}
    </Box>
  )
}


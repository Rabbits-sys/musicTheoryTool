import React from 'react'
import { Box, Alert, AlertTitle } from '@mui/material'
import useSyllableStore from '../store/useSyllableStore.js'
import SyllableDifficultySelector from '../features/syllable/SyllableDifficultySelector.jsx'
import SyllablePracticeRunner from '../features/syllable/SyllablePracticeRunner.jsx'
import SyllableResultsView from '../features/syllable/SyllableResultsView.jsx'

/**
 * Page for syllable (solfege) practice. Displays instructions and feature flow.
 * @returns {JSX.Element}
 */
export default function SyllablePage() {
  const viewStage = useSyllableStore(s => s.viewStage)

  return (
    <>
      <Box mb={2}>
        <Alert severity="info">
          <AlertTitle>练习说明</AlertTitle>
          1) 选择难度后，系统会按节拍依次显示 1–7 的数字。<br />
          2) 在每个数字显示到下一个数字出现前，请对着麦克风唱出对应唱名：1=do，2=re，3=mi，4=fa，5=so/sol，6=la，7=ti/si。<br />
          3) 练习结束后显示逐题判定与总体正确率。<br />
          4) 提示：请确保已允许麦克风访问。
        </Alert>
      </Box>

      {viewStage === 'select' ? (
        <SyllableDifficultySelector />
      ) : viewStage === 'practice' ? (
        <SyllablePracticeRunner />
      ) : (
        <SyllableResultsView />
      )}
    </>
  )
}


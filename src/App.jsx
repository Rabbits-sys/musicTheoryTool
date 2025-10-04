import React, { useState } from 'react'
import { CssBaseline, Container, Box, Typography, AppBar, Toolbar, Tabs, Tab, Alert, AlertTitle } from '@mui/material'
import DifficultySelector from './components/DifficultySelector.jsx'
import PracticeRunner from './components/PracticeRunner.jsx'
import ResultsView from './components/ResultsView.jsx'
import usePracticeStore from './store/usePracticeStore.js'
import PianoPage from './pages/PianoPage.jsx'
import IntervalPage from './pages/IntervalPage.jsx'
import MajorPage from './pages/MajorPage.jsx'

export default function App() {
  const stage = usePracticeStore(s => s.stage)
  const [tab, setTab] = useState('practice') // 'practice' | 'piano' | 'interval' | 'major'

  return (
    <>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            乐理练习工具
          </Typography>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="inherit" indicatorColor="secondary">
            <Tab value="practice" label="唱名练习" />
            <Tab value="interval" label="半音/全音练习" />
            <Tab value="major" label="自然大调练习" />
            <Tab value="piano" label="虚拟钢琴" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Box mt={3}>
          {tab === 'practice' && (
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
              {stage === 'select' ? <DifficultySelector /> : stage === 'practice' ? <PracticeRunner /> : <ResultsView />}
            </>
          )}
          {tab === 'interval' && <IntervalPage />}
          {tab === 'major' && <MajorPage />}
          {tab === 'piano' && <PianoPage />}
        </Box>
      </Container>
    </>
  )
}

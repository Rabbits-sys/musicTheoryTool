import React, { useState } from 'react'
import { CssBaseline, Container, Box, Typography, AppBar, Toolbar, Tabs, Tab } from '@mui/material'
import DifficultySelector from './components/DifficultySelector.jsx'
import PracticeRunner from './components/PracticeRunner.jsx'
import ResultsView from './components/ResultsView.jsx'
import usePracticeStore from './store/usePracticeStore.js'
import PianoPage from './pages/PianoPage.jsx'

export default function App() {
  const stage = usePracticeStore(s => s.stage)
  const [tab, setTab] = useState('practice') // 'practice' | 'piano'

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
            <Tab value="piano" label="虚拟钢琴" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Box mt={3}>
          {tab === 'practice' && (
            stage === 'select' ? <DifficultySelector /> : stage === 'practice' ? <PracticeRunner /> : <ResultsView />
          )}
          {tab === 'piano' && <PianoPage />}
        </Box>
      </Container>
    </>
  )
}

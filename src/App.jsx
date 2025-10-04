import React from 'react'
import { CssBaseline, Container, Box, Typography, AppBar, Toolbar } from '@mui/material'
import DifficultySelector from './components/DifficultySelector.jsx'
import PracticeRunner from './components/PracticeRunner.jsx'
import ResultsView from './components/ResultsView.jsx'
import usePracticeStore from './store/usePracticeStore.js'

export default function App() {
  const stage = usePracticeStore(s => s.stage)

  return (
    <>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            乐理练习工具 · 唱名练习
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box mt={3}>
          {stage === 'select' && <DifficultySelector />}
          {stage === 'practice' && <PracticeRunner />}
          {stage === 'results' && <ResultsView />}
        </Box>
      </Container>
    </>
  )
}


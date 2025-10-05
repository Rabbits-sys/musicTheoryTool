import React, { useState } from 'react'
import { CssBaseline, Container, Box, Typography, AppBar, Toolbar, Tabs, Tab } from '@mui/material'
import PianoPage from './pages/PianoPage.jsx'
import IntervalPage from './pages/IntervalPage.jsx'
import MajorPage from './pages/MajorPage.jsx'
import MetronomePage from './pages/MetronomePage.jsx'
import SyllablePage from './pages/SyllablePage.jsx'

/**
 * Root application shell with top navigation tabs.
 * @returns {JSX.Element}
 */
export default function App() {
  const [tab, setTab] = useState('practice') // 'practice' | 'piano' | 'interval' | 'major' | 'metronome'

  return (
    <>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            浮力声乐——乐理练习
          </Typography>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="inherit" indicatorColor="secondary">
            <Tab value="practice" label="唱名练习" />
            <Tab value="interval" label="半音/全音练习" />
            <Tab value="major" label="自然大调练习" />
            <Tab value="piano" label="虚拟钢琴" />
            <Tab value="metronome" label="虚拟节拍器" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Box mt={3}>
          {tab === 'practice' && <SyllablePage />}
          {tab === 'interval' && <IntervalPage />}
          {tab === 'major' && <MajorPage />}
          {tab === 'piano' && <PianoPage />}
          {tab === 'metronome' && <MetronomePage />}
        </Box>
      </Container>
    </>
  )
}

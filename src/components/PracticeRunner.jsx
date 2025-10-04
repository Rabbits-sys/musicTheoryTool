import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material'
import usePracticeStore from '../store/usePracticeStore.js'
import { ASRClient } from '../asr/wsClient.js'
import { MicrophoneStreamer, TARGET_SAMPLE_RATE } from '../audio/mic.js'
import { mapWordToNumber } from '../utils/solfege.js'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

export default function PracticeRunner() {
  const difficulty = usePracticeStore(s => s.difficulty)
  const sequence = usePracticeStore(s => s.sequence)
  const addResult = usePracticeStore(s => s.addResult)
  const finishPractice = usePracticeStore(s => s.finishPractice)
  const reset = usePracticeStore(s => s.reset)

  const [status, setStatus] = useState('preparing') // preparing | running | finishing | error
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tick, setTick] = useState(0)

  const asrRef = useRef(null)
  const micRef = useRef(null)
  const abortRef = useRef(false)

  const total = sequence.length
  const progress = useMemo(() => Math.round((currentIndex / total) * 100), [currentIndex, total])

  useEffect(() => {
    abortRef.current = false
    const asr = new ASRClient({ sampleRate: TARGET_SAMPLE_RATE })
    const mic = new MicrophoneStreamer({ onPcmChunk: (pcm) => asr.sendAudio(pcm) })
    asrRef.current = asr
    micRef.current = mic

    async function run() {
      try {
        setStatus('preparing')
        await asr.open()
        if (abortRef.current) return

        // Start first segment BEFORE starting microphone to avoid losing early audio
        let segmentId = 0
        await asr.startSegment(segmentId)

        await mic.start()
        if (abortRef.current) return

        setStatus('running')
        setCurrentIndex(0)
        const interval = difficulty.intervalMs

        for (let i = 0; i < sequence.length; i++) {
          setCurrentIndex(i)
          const expected = sequence[i]
          const startTime = Date.now()
          while (!abortRef.current) {
            const elapsed = Date.now() - startTime
            if (elapsed >= interval) break
            setTick(t => t + 1)
            await sleep(50)
          }
          if (abortRef.current) return

          const res = await asr.endSegment()
          const word = res?.word
          const confidence = res?.confidence ?? null
          const recogNum = mapWordToNumber(word)
          const correct = recogNum === expected
          addResult({
            segmentId,
            expected,
            word,
            recognizedNumber: recogNum,
            correct,
            confidence,
          })

          segmentId += 1
          if (i + 1 < sequence.length) {
            await asr.startSegment(segmentId)
          }
        }

        setStatus('finishing')
        await asr.endSession()
        await mic.stop()
        setStatus('done')
        finishPractice()
      } catch (e) {
        console.error(e)
        // Present a friendly message instead of raw error like 'ASR ws error'
        // setError('语音识别服务暂不可用，请耐心等待并允许麦克风访问。')
        setStatus('error')
        try { await mic.stop() } catch {}
        try { asr.close() } catch {}
      }
    }

    run()

    return () => {
      abortRef.current = true
      try { mic.stop() } catch {}
      try { asr.close() } catch {}
    }
  }, [])

  const currentNumber = sequence[currentIndex] ?? null

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">唱名识别练习</Typography>
          <Typography color="text.secondary">难度：{difficulty.label} · 共 {sequence.length} 题</Typography>
          <LinearProgress variant="determinate" value={progress} />

          {status === 'error' && (
            <Box>
              <Typography color="error">{error}</Typography>
              <Button variant="outlined" onClick={reset}>返回重试</Button>
            </Box>
          )}

          {status !== 'error' && (
            <Box textAlign="center" mt={2}>
              <Typography variant="h2" component="div" sx={{ fontWeight: 700 }}>
                {currentNumber ?? '-'}
              </Typography>
              <Typography color="text.secondary">请唱出该数字对应的唱名（1=do, 2=re, 3=mi, 4=fa, 5=so, 6=la, 7=ti）</Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

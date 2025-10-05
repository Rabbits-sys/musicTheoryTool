import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material'
import useSyllableStore from '../../store/useSyllableStore.js'
import { ASRClient } from '../../asr/wsClient.js'
import { MicrophoneStreamer, TARGET_SAMPLE_RATE } from '../../audio/mic.js'
import { mapWordToNumber } from '../../utils/solfege.js'

/**
 * Sleep for a given duration.
 * @param {number} ms Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/**
 * Practice runner for syllable (solfege) training; manages ASR session and timing.
 * @returns {JSX.Element}
 */
export default function SyllablePracticeRunner() {
  const selectedDifficulty = useSyllableStore(s => s.selectedDifficulty)
  const questionSequence = useSyllableStore(s => s.questionSequence)
  const recordAttempt = useSyllableStore(s => s.recordAttempt)
  const completePractice = useSyllableStore(s => s.completePractice)
  const resetSyllableTraining = useSyllableStore(s => s.resetSyllableTraining)

  const [runStatus, setRunStatus] = useState('preparing') // 'preparing' | 'running' | 'finishing' | 'error' | 'done'
  const [errorMessage, setErrorMessage] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const asrRef = useRef(/** @type {ASRClient|null} */(null))
  const micRef = useRef(/** @type {MicrophoneStreamer|null} */(null))
  const abortRef = useRef(false)

  const total = questionSequence.length
  const progress = useMemo(() => total === 0 ? 0 : Math.round((currentQuestionIndex / total) * 100), [currentQuestionIndex, total])

  useEffect(() => {
    abortRef.current = false
    const asr = new ASRClient({ sampleRate: TARGET_SAMPLE_RATE })
    const mic = new MicrophoneStreamer({ onPcmChunk: (pcm) => asr.sendAudio(pcm) })
    asrRef.current = asr
    micRef.current = mic

    async function run() {
      try {
        setRunStatus('preparing')
        await asr.open()
        if (abortRef.current) return

        // Start first segment BEFORE starting microphone to avoid losing early audio
        let segmentId = 0
        await asr.startSegment(segmentId)

        await mic.start()
        if (abortRef.current) return

        setRunStatus('running')
        setCurrentQuestionIndex(0)
        const interval = selectedDifficulty.intervalMs

        for (let i = 0; i < questionSequence.length; i++) {
          setCurrentQuestionIndex(i)
          const expectedNumber = questionSequence[i]
          const startTime = Date.now()
          while (!abortRef.current) {
            const elapsed = Date.now() - startTime
            if (elapsed >= interval) break
            await sleep(50)
          }
          if (abortRef.current) return

          const res = await asr.endSegment()
          const word = res?.word
          const confidence = res?.confidence ?? null
          const recognizedNumber = mapWordToNumber(word)
          const correct = recognizedNumber === expectedNumber
          recordAttempt({
            segmentId,
            expected: expectedNumber,
            word,
            recognizedNumber,
            correct,
            confidence,
          })

          segmentId += 1
          if (i + 1 < questionSequence.length) {
            await asr.startSegment(segmentId)
          }
        }

        setRunStatus('finishing')
        await asr.endSession()
        await mic.stop()
        setRunStatus('done')
        completePractice()
      } catch (e) {
        console.error(e)
        setErrorMessage('语音识别服务暂不可用，请确认已允许麦克风访问，并稍后重试。')
        setRunStatus('error')
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

  const currentNumber = questionSequence[currentQuestionIndex] ?? null

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">唱名识别练习</Typography>
          <Typography color="text.secondary">难度：{selectedDifficulty.label} · 共 {questionSequence.length} 题</Typography>
          <LinearProgress variant="determinate" value={progress} />

          {runStatus === 'error' && (
            <Box>
              <Typography color="error">{errorMessage}</Typography>
              <Button variant="outlined" onClick={resetSyllableTraining}>返回重试</Button>
            </Box>
          )}

          {runStatus !== 'error' && (
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

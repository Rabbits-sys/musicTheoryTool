export function formatDuration(ms) {
  if (!ms || ms < 0) ms = 0
  const totalSec = Math.floor(ms / 1000)
  const mm = Math.floor(totalSec / 60)
  const ss = totalSec % 60
  const mmStr = String(mm).padStart(2, '0')
  const ssStr = String(ss).padStart(2, '0')
  return `${mmStr}:${ssStr}`
}


import { randomSequence } from '../src/store/usePracticeStore.js'

function hasAdjacentEqual(arr) {
  for (let i = 1; i < arr.length; i++) if (arr[i] === arr[i - 1]) return true
  return false
}

let trials = 5000
for (let t = 0; t < trials; t++) {
  const n = 20
  const seq = randomSequence(n)
  if (hasAdjacentEqual(seq)) {
    console.error('FAIL: adjacent equal found', seq)
    process.exit(1)
  }
}
console.log('PASS: no adjacent equal in', trials, 'trials')


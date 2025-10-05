// Enharmonic utilities and Helmholtz mapping for semitone/whole tone practice

/**
 * Section data describing enharmonic equivalence classes grouped by range.
 * Used to build CLASSES and lookups.
 * @type {{label:string, lines:string[]}[]}
 */
const SECTION_DATA = [
  { label: '大字二组', lines: [
    'G-2 XF-2 bbA-2',
    '#G-2 bA-2',
    'A-2 XG-2 bbB-2',
    '#A-2 bB-2 bbC-1',
    'B-2 bC-1 XA-2',
  ]},
  { label: '大字一组', lines: [
    'C-1 #B-2 bbD-1',
    '#C-1 bD-1 XB-2',
    'D-1 XC-1 bbE-1',
    '#D-1 bE-1 bbF-1',
    'E-1 XD-1 bF-1',
    'F-1 #E-1 bbG-1',
    '#F-1 bG-1 XE-1',
    'G-1 XF-1 bbA-1',
    '#G-1 bA-1',
    'A-1 XG-1 bbB-1',
    '#A-1 bB-1 bbC',
    'B-1 XA-1 bC',
  ]},
  { label: '大字组', lines: [
    'C #B-1 bbD',
    '#C bD XB-1',
    'D XC bbE',
    '#D bE bbF',
    'E XD bF',
    'F #E bbG',
    '#F bG XE',
    'G XF bbA',
    '#G bA',
    'A XG bbB',
    '#A bB bbc',
    'B XA bc',
  ]},
  { label: '小字组', lines: [
    'c #B bbd',
    '#c bd XB',
    'd Xc bbe',
    '#d be bbf',
    'e Xd bf',
    'f #e bbg',
    '#f bg Xe',
    'g Xf bba',
    '#g ba',
    'a Xg bbb',
    '#a bb bbc1',
    'b Xa bc1',
  ]},
  { label: '小字一组', lines: [
    'c1 #b bbd1',
    '#c1 bd1 Xb',
    'd1 Xc1 bbe1',
    '#d1 be1 bbf1',
    'e1 Xd1 bf1',
    'f1 #e1 bbg1',
    '#f1 bg1 Xe1',
    'g1 Xf1 bba1',
    '#g1 ba1',
    'a1 Xg1 bbb1',
    '#a1 bb1 bbc2',
    'b1 Xa1 bc2',
  ]},
  { label: '小字二组', lines: [
    'c2 #b1 bbd2',
    '#c2 bd2 Xb1',
    'd2 Xc2 bbe2',
    '#d2 be2 bbf2',
    'e2 Xd2 bf2',
    'f2 #e2 bbg2',
    '#f2 bg2 Xe2',
    'g2 Xf2 bba2',
    '#g2 ba2',
    'a2 Xg2 bbb2',
    '#a2 bb2 bbc3',
    'b2 Xa2 bc3',
  ]},
]

// Build flattened classes and lookups
/** @type {{ tokens: string[], sectionIndex: number, lineIndex: number }[]} */
const CLASSES = [] // each element: { tokens: string[], sectionIndex, lineIndex }
/** @type {Map<string, number>} */
const TOKEN_TO_INDEX = new Map()

SECTION_DATA.forEach((sec, si) => {
  sec.lines.forEach((line, li) => {
    const tokens = line.trim().split(/\s+/)
    const idx = CLASSES.length
    CLASSES.push({ tokens, sectionIndex: si, lineIndex: li })
    tokens.forEach(t => TOKEN_TO_INDEX.set(t, idx))
  })
})

// Allowed base range: from 大字一组 to 小字二组 inclusive -> sections index 1..5
const BASE_START_INDEX = (function() {
  // first class index of section 1
  let acc = 0
  for (let i = 0; i < 1; i++) acc += SECTION_DATA[i].lines.length
  return acc
})()
const BASE_END_INDEX = (function() {
  // last class index of section 5
  let acc = 0
  for (let i = 0; i <= 5; i++) acc += SECTION_DATA[i].lines.length
  return acc - 1
})()

// Helpers for display and parsing
function accidentalOf(token) {
  const m = token.match(/^(bb|#|X|b)?/)
  return m && m[0] ? m[0] : ''
}
function letterOf(token) {
  const m = token.match(/^(?:bb|#|X|b)?([A-Ga-g])/)
  return m ? m[1] : ''
}
function groupSuffixOf(token) {
  const m = token.match(/(-\d+|\d+)?$/)
  return m && m[1] ? m[1] : ''
}

/**
 * Format a token for display (accidentals preserved, group as sub/superscript).
 * @param {string} token
 * @returns {string}
 */
function formatDisplay(token) {
  const acc = accidentalOf(token)
  const letter = letterOf(token)
  const group = groupSuffixOf(token)

  // Accidentals: display '#' and 'X' as-is, 'bb' as 'bb', 'b' as 'b'
  let accDisp = acc

  // Group display: big groups use subscript like C₁, small groups use superscript like e¹
  let groupDisp = ''
  if (group) {
    if (group.startsWith('-')) {
      const n = group.slice(1)
      groupDisp = subscriptDigits(n)
    } else {
      groupDisp = superscriptDigits(group)
    }
  }
  return `${accDisp}${letter}${groupDisp}`
}

function superscriptDigits(s) {
  const map = { '0': '⁰','1': '¹','2': '²','3': '³','4': '⁴','5': '⁵','6': '⁶','7': '⁷','8': '⁸','9': '⁹' }
  return s.split('').map(ch => map[ch] || ch).join('')
}
function subscriptDigits(s) {
  const map = { '0': '₀','1': '₁','2': '₂','3': '₃','4': '₄','5': '₅','6': '₆','7': '₇','8': '₈','9': '₉' }
  return s.split('').map(ch => map[ch] || ch).join('')
}

/**
 * Parse a user input string into normalized tokens (whitespace separated).
 * @param {string} input
 * @returns {string[]}
 */
function parseUserInput(input) {
  return input
    .split(/\s+/)
    .map(s => s.trim())
    .filter(Boolean)
}

/**
 * Get enharmonic class index for a token (or -1 if unknown).
 * @param {string} token
 * @returns {number}
 */
function classIndexOfToken(token) {
  return TOKEN_TO_INDEX.has(token) ? TOKEN_TO_INDEX.get(token) : -1
}

/**
 * Return tokens in the enharmonic class by index.
 * @param {number} idx
 * @returns {string[]}
 */
function classTokensByIndex(idx) {
  if (idx < 0 || idx >= CLASSES.length) return []
  return CLASSES[idx].tokens
}

/**
 * Choose a representative token from a class, optionally preferring an accidental.
 * @param {number} idx Class index
 * @param {string|null} [prefAccidental]
 * @returns {string}
 */
function pickRepresentativeToken(idx, prefAccidental = null) {
  const toks = classTokensByIndex(idx)
  if (toks.length === 0) return ''
  if (prefAccidental) {
    const cand = toks.filter(t => accidentalOf(t) === prefAccidental)
    if (cand.length) return cand[Math.floor(Math.random() * cand.length)]
  }
  // otherwise prefer natural if exists
  const naturals = toks.filter(t => !accidentalOf(t))
  if (naturals.length) return naturals[Math.floor(Math.random() * naturals.length)]
  return toks[Math.floor(Math.random() * toks.length)]
}

function randomInt(min, max) { // inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDirection(step = 1, minIdx = BASE_START_INDEX, maxIdx = BASE_END_INDEX, baseIdx = null) {
  // returns {dir: +1|-1} such that baseIdx+dir*step in-range; if baseIdx is null, just returns +/-1
  const dirs = []
  if (baseIdx == null) return Math.random() < 0.5 ? -1 : 1
  if (baseIdx - step >= minIdx) dirs.push(-1)
  if (baseIdx + step <= maxIdx) dirs.push(+1)
  if (dirs.length === 0) return 0
  return dirs[Math.floor(Math.random() * dirs.length)]
}

function pickAccidentalPreference(tokens) {
  // 50% natural; else randomly one of present accidentals among [#, X, b, bb]
  const has = new Set(tokens.map(accidentalOf))
  if (Math.random() < 0.5 && has.has('')) return ''
  const order = ['#', 'X', 'b', 'bb']
  const present = order.filter(a => has.has(a))
  if (present.length === 0) return ''
  return present[Math.floor(Math.random() * present.length)]
}

function generateBaseIndex() {
  return randomInt(BASE_START_INDEX, BASE_END_INDEX)
}

function stepIndex(idx, semitones) {
  const t = idx + semitones
  if (t < 0 || t >= CLASSES.length) return -1
  return t
}

/**
 * Generate a single question consisting of a prompt token and expected enharmonics
 * for semitone and whole-tone steps (up or down) within allowed range.
 * @returns {{ baseIndex:number, promptToken:string, promptDisplay:string, semitone:{dir:number,index:number,expected:string[]}, whole:{dir:number,index:number,expected:string[]} }}
 */
export function generateQuestion() {
  // pick base index within allowed range, decide directions
  let base = generateBaseIndex()
  // decide directions ensuring in-bounds
  let semiDir = randomDirection(1, BASE_START_INDEX, BASE_END_INDEX, base)
  let wholeDir = randomDirection(2, BASE_START_INDEX, BASE_END_INDEX, base)
  // Fallback if zero
  if (semiDir === 0) semiDir = base + 1 <= BASE_END_INDEX ? +1 : -1
  if (wholeDir === 0) wholeDir = base + 2 <= BASE_END_INDEX ? +1 : -1

  const semiIdx = stepIndex(base, semiDir)
  const wholeIdx = stepIndex(base, 2 * wholeDir)

  const baseTokens = classTokensByIndex(base)
  const pref = pickAccidentalPreference(baseTokens)
  const promptToken = pickRepresentativeToken(base, pref)

  return {
    baseIndex: base,
    promptToken,
    promptDisplay: formatDisplay(promptToken),
    semitone: { dir: semiDir, index: semiIdx, expected: classTokensByIndex(semiIdx) },
    whole: { dir: wholeDir, index: wholeIdx, expected: classTokensByIndex(wholeIdx) },
  }
}

/**
 * Check whether the user input covers exactly the expected tokens (order-insensitive).
 * @param {string} inputStr User input string
 * @param {string[]} expectedTokens Expected set of tokens
 * @returns {boolean}
 */
export function checkAnswer(inputStr, expectedTokens) {
  const ans = new Set(parseUserInput(inputStr))
  const expect = new Set(expectedTokens)
  if (ans.size !== expect.size) return false
  for (const t of expect) {
    if (!ans.has(t)) return false
  }
  return true
}

/**
 * Format a token for display (alias to formatDisplay).
 * @param {string} token
 * @returns {string}
 */
export function formatToken(token) {
  return formatDisplay(token)
}

export const EnharmonicDB = {
  CLASSES,
  TOKEN_TO_INDEX,
  SECTION_DATA,
  BASE_START_INDEX,
  BASE_END_INDEX,
}

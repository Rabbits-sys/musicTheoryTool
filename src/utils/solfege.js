export const solfegeToNumber = {
  do: 1,
  re: 2,
  mi: 3,
  fa: 4,
  so: 5,
  sol: 5,
  la: 6,
  ti: 7,
  si: 7,
}

export function mapWordToNumber(word) {
  if (!word) return undefined
  const w = String(word).toLowerCase()
  if (w in solfegeToNumber) return solfegeToNumber[w]
  // minor normalization: strip trailing vowels
  const norm = w.replace(/[^a-z]/g, '')
  if (norm in solfegeToNumber) return solfegeToNumber[norm]
  return undefined
}


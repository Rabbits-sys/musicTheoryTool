/**
 * Mapping from solfege syllable to scale degree number.
 * Includes common variants like 'sol' and alternative 'si' for 'ti'.
 * @type {{[syllable: string]: 1|2|3|4|5|6|7}}
 */
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

/**
 * Map a recognized word from ASR to a scale degree number using solfege.
 * Performs case-insensitive matching and basic normalization (letters only).
 *
 * @param {string | null | undefined} word Recognized token
 * @returns {1|2|3|4|5|6|7 | undefined} Matching degree number or undefined if not matched
 */
export function mapWordToNumber(word) {
  if (!word) return undefined
  const w = String(word).toLowerCase()
  if (w in solfegeToNumber) return solfegeToNumber[w]
  // minor normalization: strip non-letters
  const norm = w.replace(/[^a-z]/g, '')
  if (norm in solfegeToNumber) return solfegeToNumber[norm]
  return undefined
}

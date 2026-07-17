/**
 * South African ID number validation & derivation.
 * Format: YYMMDD SSSS C A Z (13 digits)
 *   YYMMDD — date of birth
 *   SSSS   — sequence number (< 5000 = Female, >= 5000 = Male)
 *   C      — citizenship (0 = SA Citizen, 1 = Permanent Resident)
 *   A      — historic race indicator, unused today, not validated
 *   Z      — Luhn (Mod 10) checksum digit
 */

function centuryDisambiguatedYear(yy) {
  const currentYY = new Date().getFullYear() % 100
  return yy > currentYY ? 1900 + yy : 2000 + yy
}

function parseDob(id) {
  const yy = parseInt(id.slice(0, 2), 10)
  const mm = parseInt(id.slice(2, 4), 10)
  const dd = parseInt(id.slice(4, 6), 10)
  const year = centuryDisambiguatedYear(yy)

  const date = new Date(Date.UTC(year, mm - 1, dd))
  const roundTrips =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === mm - 1 &&
    date.getUTCDate() === dd

  if (!roundTrips) return null
  return { year, month: mm, day: dd }
}

function luhnChecksumValid(id) {
  const digits = id.split('').map((d) => parseInt(d, 10))
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8] + digits[10]
  const evenConcat = `${digits[1]}${digits[3]}${digits[5]}${digits[7]}${digits[9]}${digits[11]}`
  const doubled = String(Number(evenConcat) * 2)
  const evenDigitSum = doubled.split('').reduce((sum, ch) => sum + parseInt(ch, 10), 0)
  const total = oddSum + evenDigitSum
  const expectedCheckDigit = (10 - (total % 10)) % 10
  return expectedCheckDigit === digits[12]
}

/**
 * Validate a South African ID number.
 * @param {string} idNumber
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSaId(idNumber) {
  const errors = []
  const id = String(idNumber || '').trim()

  if (!/^[0-9]{13}$/.test(id)) {
    return { valid: false, errors: ['ID number must be exactly 13 digits'] }
  }

  const dob = parseDob(id)
  if (!dob) errors.push('ID number does not contain a valid date of birth')

  if (!luhnChecksumValid(id)) errors.push('ID number checksum is invalid')

  return { valid: errors.length === 0, errors }
}

/**
 * Derive date of birth, gender, and citizenship from a validated SA ID number.
 * Only call after validateSaId() has returned valid: true.
 * @param {string} idNumber
 * @returns {{ dateOfBirth: string, gender: 'Male'|'Female', citizenship: string }|null}
 */
export function deriveFromSaId(idNumber) {
  const id = String(idNumber || '').trim()
  if (!/^[0-9]{13}$/.test(id)) return null

  const dob = parseDob(id)
  if (!dob) return null

  const sequence = parseInt(id.slice(6, 10), 10)
  const citizenshipDigit = id.charAt(10)

  const pad = (n) => String(n).padStart(2, '0')
  const dateOfBirth = `${dob.year}-${pad(dob.month)}-${pad(dob.day)}`
  const gender = sequence < 5000 ? 'Female' : 'Male'
  const citizenship =
    citizenshipDigit === '0' ? 'SA Citizen' : citizenshipDigit === '1' ? 'Permanent Resident' : 'Unknown'

  return { dateOfBirth, gender, citizenship }
}

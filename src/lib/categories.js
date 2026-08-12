export const CATEGORIES = [
  { id: 'firsts', label: 'Firsts', color: '#D4A94B' },
  { id: 'travel', label: 'Travel', color: '#4A7C7C' },
  { id: 'family', label: 'Family', color: '#E8B4B8' },
  { id: 'health', label: 'Health', color: '#8FB3D9' },
  { id: 'school', label: 'School', color: '#B49CD9' },
  { id: 'other', label: 'Other', color: '#9AA0AC' },
]

export function categoryFor(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

// Returns a human age string like "1 year, 2 months" given a birth date and
// a target date. Returns null if either date is missing/invalid.
export function ageAt(birthDateStr, targetDateStr) {
  if (!birthDateStr || !targetDateStr) return null
  const birth = new Date(birthDateStr)
  const target = new Date(targetDateStr)
  if (isNaN(birth) || isNaN(target)) return null
  if (target < birth) return null

  let years = target.getFullYear() - birth.getFullYear()
  let months = target.getMonth() - birth.getMonth()
  let days = target.getDate() - birth.getDate()

  if (days < 0) {
    months -= 1
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years === 0 && months === 0) {
    return days === 1 ? '1 day old' : `${days} days old`
  }
  const parts = []
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`)
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`)
  return parts.join(', ') + ' old'
}

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 * @param {Date} date - The date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object in local timezone
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Date object
 */
export function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Format a date for display
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string (e.g., "Jan 15")
 */
export function formatDisplayDate(date) {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format a date with year for display
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string (e.g., "January 2024")
 */
export function formatMonthYear(date) {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Get the start of the month for a given date
 * @param {Date} date - The date
 * @returns {Date} First day of the month
 */
export function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Get the end of the month for a given date
 * @param {Date} date - The date
 * @returns {Date} Last day of the month
 */
export function getMonthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/**
 * Generate a random string of given length.
 */
function randomString(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Wait for a specified duration in milliseconds.
 */
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format a date to YYYY-MM-DD string.
 */
function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

module.exports = { randomString, delay, formatDate };

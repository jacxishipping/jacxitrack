const LETTER_VALUES = {
  A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19,
  J: 20, K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29,
  S: 30, T: 31, U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38
};

function normalizeContainerNumber(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

/**
 * Verifies the ISO 6346 format and check digit before a container is persisted.
 * Values with a calculated remainder of 10 are invalid because 10 cannot be a check digit.
 */
function isValidContainerNumber(value) {
  const containerNumber = normalizeContainerNumber(value);
  if (!/^[A-Z]{4}\d{7}$/.test(containerNumber)) return false;

  const checkDigit = Number(containerNumber[10]);
  const total = [...containerNumber.slice(0, 10)].reduce((sum, character, index) => {
    const value = /\d/.test(character) ? Number(character) : LETTER_VALUES[character];
    return sum + value * 2 ** index;
  }, 0);
  const calculatedDigit = (total % 11) % 10;

  return calculatedDigit === checkDigit && total % 11 !== 10;
}

module.exports = { isValidContainerNumber, normalizeContainerNumber };

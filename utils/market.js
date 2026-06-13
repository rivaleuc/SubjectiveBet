/**
 * Encode options for market creation
 * @param {string[]} options
 * @returns {string} JSON string
 */
export function encodeOptions(options) {
  return JSON.stringify(options);
}

/**
 * Compute market ID hash for Solidity contract
 * @param {string} key - e.g. "market_1"
 * @returns {string} keccak256 hex (needs ethers.js in caller)
 */
export function marketKeyToBytes32(key) {
  // Usage: ethers.id(key) in consuming code
  return key;
}

/**
 * Calculate payout for a winner
 * @param {number} betAmount
 * @param {number} totalPool
 * @param {number} winningOptionPool
 * @returns {number}
 */
export function calculatePayout(betAmount, totalPool, winningOptionPool) {
  return (betAmount * totalPool) / winningOptionPool;
}

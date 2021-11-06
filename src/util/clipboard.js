/**
 * @param {string} data
 */
export async function copyToClipboard(data) {
  await navigator.clipboard.writeText(data);
}

/**
 * @returns {Promise<string>}
 */
export async function pasteFromClipboard() {
  return await navigator.clipboard.readText();
}

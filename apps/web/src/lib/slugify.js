/**
 * Converts a human-readable title into a URL-friendly slug.
 * Handles accented (PT/ES) characters, removes special chars, collapses hyphens.
 *
 * Examples:
 *   "Bolo de Chocolate & Morango!" → "bolo-de-chocolate-morango"
 *   "Grilled Chicken Sandwich"     → "grilled-chicken-sandwich"
 *   "Sándwich de Pollo"            → "sandwich-de-pollo"
 */
export const toSlug = (text = '') =>
  text
    .normalize('NFD')                          // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')           // strip diacritic marks
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')             // keep alphanumeric, spaces, hyphens
    .trim()
    .replace(/[\s]+/g, '-')                    // spaces → hyphens
    .replace(/-{2,}/g, '-');                   // collapse consecutive hyphens

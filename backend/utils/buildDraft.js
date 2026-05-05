/**
 * buildDraft.js
 *
 * Converts raw extracted text into structured article fields:
 *   - title   : first non-empty line
 *   - summary : first paragraph (text up to the first blank line)
 *   - content : everything after the first paragraph
 *   - tags    : auto-detected keywords (simple frequency approach)
 *
 * No external libraries — pure string manipulation.
 */

/**
 * Parse raw text into { title, summary, content }.
 * @param {string} rawText - Full extracted text from a document
 * @returns {{ title: string, summary: string, content: string }}
 */
function parseText(rawText) {
  // Normalise line endings and trim
  const text  = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const lines = text.split('\n');

  // ── Title: first non-empty line ─────────────────────────────────────────────
  const title = lines.find(l => l.trim() !== '') || 'Untitled Document';

  // ── Split into paragraphs (separated by one or more blank lines) ─────────────
  const paragraphs = text
    .split(/\n\s*\n/)           // split on blank lines
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // ── Summary: first paragraph (which contains the title line) ─────────────────
  // If the first paragraph IS just the title, use the second paragraph instead.
  let summaryPara = paragraphs[0] || '';
  let contentStart = 1;

  if (summaryPara.trim() === title.trim() && paragraphs.length > 1) {
    summaryPara  = paragraphs[1];
    contentStart = 2;
  }

  // Clean the title out of the summary if it appears at the start
  let summary = summaryPara
    .replace(new RegExp('^' + escapeRegex(title) + '\\s*', 'i'), '')
    .trim();

  // Cap summary to ~300 characters for readability
  if (summary.length > 300) {
    summary = summary.slice(0, 297) + '...';
  }

  // ── Content: everything after the summary paragraph ───────────────────────────
  const content = paragraphs.slice(contentStart).join('\n\n').trim();

  return { title: title.trim(), summary, content };
}

/**
 * Auto-generate tags from text using simple word frequency.
 * Returns up to 5 tags as a comma-separated string.
 * @param {string} text
 * @returns {string}
 */
function generateTags(text) {
  // Common English stop-words to ignore
  const STOP = new Set([
    'the','and','for','are','but','not','you','all','any','can','her','was',
    'one','our','out','day','get','has','him','his','how','its','may','now',
    'old','see','two','way','who','boy','did','man','use','had','let','put',
    'say','she','too','use','with','that','this','from','they','have','been',
    'will','more','when','what','your','into','than','then','some','also',
    'each','which','their','there','about','would','these','other','after',
    'first','could','those','being','where','every','under','never','should',
    'through','include','system','using','based','used','like','well','both',
    'only','very','just','because','such','make','much','most','over','same',
    'must','upon','made','part','even'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')   // remove non-alpha
    .split(/\s+/)
    .filter(w => w.length > 4 && !STOP.has(w));

  // Count frequency
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  // Sort by frequency, take top 5
  const tags = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  return tags.join(',');
}

/** Escape special regex characters in a string */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { parseText, generateTags };

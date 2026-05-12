/**
 * Normalizes various chat log formats into a unified readable plain text format.
 * Supports raw text chat logs and JSON exports.
 * 
 * @param {string|object} content - Raw pasted text or parsed JSON chat array
 * @returns {string} - Unified plain text
 */
function normalizeChatContent(content) {
  if (!content) return '';

  // Handle JSON Array Export Format
  // Example: [{ "user": "John", "message": "Scanner failed" }]
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
        return parsed.map(msg => {
          const user = msg.user || msg.author || msg.sender || 'Unknown';
          const time = msg.time || msg.timestamp ? `[${msg.time || msg.timestamp}] ` : '';
          return `${time}${user}: ${msg.message}`;
        }).join('\n');
      }
    } catch (e) {
      // Not JSON, continue to text normalization
    }
  } else if (Array.isArray(content)) {
    // Already parsed JSON array
    return content.map(msg => {
      const user = msg.user || msg.author || msg.sender || 'Unknown';
      const time = msg.time || msg.timestamp ? `[${msg.time || msg.timestamp}] ` : '';
      return `${time}${user}: ${msg.message}`;
    }).join('\n');
  }

  // Handle Raw Text (already reasonably formatted, just ensure clean structure)
  // Ensures spacing is consistent, trims extra lines
  if (typeof content === 'string') {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  return String(content);
}

module.exports = { normalizeChatContent };

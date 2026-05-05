// Utility: format a UTC datetime string to local readable format
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
};

// Utility: truncate long text to a given length
export const truncate = (text = '', length = 120) =>
  text.length > length ? text.slice(0, length) + '…' : text;

// Utility: map status to a color class
export const statusColor = (status) => {
  const map = { Draft: 'status-draft', Reviewed: 'status-reviewed', Published: 'status-published' };
  return map[status] || 'status-draft';
};

// Utility: get the next allowed status in the workflow
export const nextStatus = (current) => {
  const flow = { Draft: 'Reviewed', Reviewed: 'Published', Published: null };
  return flow[current] || null;
};

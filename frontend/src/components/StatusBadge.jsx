export default function StatusBadge({ status }) {
  const map = {
    Draft:     'draft',
    Reviewed:  'reviewed',
    Published: 'published',
  };
  const cls = map[status] || 'draft';
  return (
    <span className={`badge badge-${cls}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}

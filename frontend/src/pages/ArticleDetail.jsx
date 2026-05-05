import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticle, getHistory, patchStatus, deleteArticle } from '../services/api';
import { formatDate, nextStatus } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';

export default function ArticleDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('kb_user') || '{}');

  const [article, setArticle] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  
  // Status modal/prompt state
  const [remarks, setRemarks] = useState('');
  const [showStatusPrompt, setShowStatusPrompt] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true); setError('');
    try {
      const [artRes, histRes] = await Promise.all([
        getArticle(id),
        getHistory(id)
      ]);
      setArticle(artRes.data.data);
      setHistory(histRes.data.data || []);
    } catch (err) {
      setError('Failed to load article details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange() {
    const next = nextStatus(article.status);
    if (!next) return;

    try {
      await patchStatus(id, {
        status: next,
        editedBy: user.email || 'system',
        remarks: remarks || `Promoted to ${next}`
      });
      setShowStatusPrompt(false);
      setRemarks('');
      loadData(); // reload to get new status and history
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteArticle(id);
      navigate('/articles');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete article.');
    }
  }

  if (loading) return <main className="page-content"><div className="spinner-wrap"><div className="spinner" /></div></main>;
  if (error && !article) return <main className="page-content"><div className="alert alert-error">⚠️ {error}</div></main>;

  const nextStep = nextStatus(article.status);

  return (
    <main className="page-content">
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/articles')}>← Back</button>
        <div className="flex-row">
          <StatusBadge status={article.status} />
          <span className="version-chip">v{article.version}</span>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
        
        {/* Left Column — Content */}
        <div className="card">
          <div className="detail-header">
            <h1 className="detail-title">{article.title}</h1>
          </div>
          
          <div className="detail-meta">
            <span>📅 Created: {formatDate(article.createdAt)}</span>
            <span>👤 By: {article.createdBy}</span>
            {article.sourceFileName && <span>📄 Source: {article.sourceFileName}</span>}
          </div>

          {article.tags && (
            <div className="tags-list" style={{ marginBottom: '1.5rem' }}>
              {article.tags.split(',').map(t => (
                <span key={t} className="tag">{t.trim()}</span>
              ))}
            </div>
          )}

          <div className="detail-content" style={{ fontWeight: 500, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            {article.summary}
          </div>

          <div className="divider" />

          <div className="detail-content">
            {article.content}
          </div>
        </div>

        {/* Right Column — Actions & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="card card-sm">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Actions</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {/* Only show Edit if Draft */}
              {article.status === 'Draft' && (
                <button className="btn btn-secondary btn-full" onClick={() => navigate(`/draft/${id}`)}>
                  ✏️ Edit Draft
                </button>
              )}

              {/* Workflow Promotion */}
              {nextStep && !showStatusPrompt && (
                <button 
                  className={`btn btn-${nextStep === 'Published' ? 'success' : 'primary'} btn-full`}
                  onClick={() => setShowStatusPrompt(true)}
                >
                  {nextStep === 'Reviewed' ? '👁️ Mark as Reviewed' : '🚀 Publish Article'}
                </button>
              )}

              {showStatusPrompt && (
                <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <label className="form-label">Approval Remarks</label>
                  <input
                    className="form-input mt-1"
                    placeholder="Optional note..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                  />
                  <div className="flex-row mt-2">
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setShowStatusPrompt(false)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleStatusChange}>Confirm</button>
                  </div>
                </div>
              )}

              {user?.role === 'Admin' && (
                <button className="btn btn-danger btn-full" onClick={handleDelete} style={{ marginTop: '0.5rem' }}>
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>

          <div className="card card-sm">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Audit History</h3>
            {history.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No history found.</p>
            ) : (
              <div className="history-timeline">
                {history.map(item => (
                  <div key={item.id} className="history-item">
                    <div className="history-dot-wrap"><div className="history-dot" /></div>
                    <div className="history-body">
                      <div className="history-action">
                        {item.action === 'created' ? 'Draft Created' : 
                         item.action === 'status_change' ? 'Status Updated' : 'Edited'}
                      </div>
                      {item.newStatus && (
                        <div className="history-status">
                          {item.oldStatus ? `${item.oldStatus} → ` : ''}<strong>{item.newStatus}</strong>
                        </div>
                      )}
                      {item.remarks && <div className="history-remarks">"{item.remarks}"</div>}
                      <div className="history-meta">{formatDate(item.timestamp)} · {item.editedBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

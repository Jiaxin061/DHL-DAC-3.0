import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticle, updateArticle, deleteArticle } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function DraftBuilder() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem('kb_user') || '{}');

  const [article, setArticle] = useState(null);
  const [form,    setForm]    = useState({ title: '', summary: '', content: '', tags: '' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await getArticle(id);
        const a   = res.data.data;
        setArticle(a);
        setForm({ title: a.title || '', summary: a.summary || '', content: a.content || '', tags: a.tags || '' });
      } catch (err) {
        setError('Could not load article. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handleChange(e) {
    setSaved(false);
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const res = await updateArticle(id, { ...form, createdBy: user.email, remarks: 'Manual edit' });
      setArticle(res.data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDraft() {
    if (!window.confirm('Are you sure you want to discard this draft? This cannot be undone.')) return;
    try {
      await deleteArticle(id);
      navigate('/articles');
    } catch (err) {
      setError('Failed to discard draft.');
    }
  }

  if (loading) return <main className="page-content"><div className="spinner-wrap"><div className="spinner" /></div></main>;
  if (error && !article) return <main className="page-content"><div className="alert alert-error">⚠️ {error}</div></main>;

  return (
    <main className="page-content">
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/articles')}>← Back</button>
        </div>
        <div className="flex-row">
          {article && <StatusBadge status={article.status} />}
          <span className="version-chip">v{article?.version}</span>
        </div>
      </div>

      <div className="page-header">
        <h1>✏️ Draft Builder</h1>
        <p>Review and edit the auto-generated draft. All fields are editable before publishing.</p>
      </div>

      {error   && <div className="alert alert-error">⚠️ {error}</div>}
      {saved   && <div className="alert alert-success">✅ Draft saved successfully!</div>}

      <div className="card">
        <div className="card-title">Article Content</div>

        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            id="draft-title"
            className="form-input"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Article title"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Summary</label>
          <textarea
            id="draft-summary"
            className="form-textarea"
            name="summary"
            value={form.summary}
            onChange={handleChange}
            placeholder="Brief summary of the article..."
            style={{ minHeight: '90px' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Content</label>
          <textarea
            id="draft-content"
            className="form-textarea"
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Full article content..."
            style={{ minHeight: '220px' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tags <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>(comma-separated)</span></label>
          <input
            id="draft-tags"
            className="form-input"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="ai, machine-learning, technology"
          />
          {form.tags && (
            <div className="tags-list mt-1">
              {form.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="divider" />

        <div className="flex-between">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {article && <>Source: <strong style={{ color: 'var(--text-secondary)' }}>{article.sourceFileName || '—'}</strong></>}
          </div>
          <div className="flex-row">
            <button className="btn btn-danger" onClick={handleDeleteDraft}>🗑️ Discard Draft</button>
            <button className="btn btn-secondary" onClick={() => navigate(`/articles/${id}`)}>View Article</button>
            <button
              id="btn-save-draft"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '⏳ Saving...' : '💾 Save Draft'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

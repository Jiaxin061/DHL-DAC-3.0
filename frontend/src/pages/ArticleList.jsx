import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getArticles } from '../services/api';
import { formatDate, truncate } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';

export default function ArticleList() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadArticles();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status]);

  async function loadArticles() {
    setLoading(true); setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      
      const res = await getArticles(params);
      setArticles(res.data.data || []);
    } catch (err) {
      setError('Failed to load articles.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-content wide">
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>📋 Knowledge Base</h1>
          <p>Manage and search all articles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/upload')}>
          ➕ New Article
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            id="search-input"
            className="form-input"
            placeholder="Search title, summary, or tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          id="status-filter"
          className="form-select"
          style={{ width: '160px' }}
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Reviewed">Reviewed</option>
          <option value="Published">Published</option>
        </select>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No articles found</h3>
          <p>Try adjusting your search or filters, or create a new article.</p>
        </div>
      ) : (
        <div className="article-grid">
          {articles.map(art => (
            <div
              key={art.id}
              className="article-card"
              onClick={() => navigate(`/articles/${art.id}`)}
            >
              <div className="article-card-body">
                <div className="article-card-title">{art.title}</div>
                <div className="article-card-summary">{truncate(art.summary, 140)}</div>
                <div className="article-card-meta">
                  <span>📅 {formatDate(art.updatedAt)}</span>
                  <span>👤 {art.createdBy}</span>
                  {art.tags && (
                    <div className="tags-list">
                      {art.tags.split(',').slice(0, 3).map(t => (
                        <span key={t} className="tag">{t.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="article-card-right">
                <StatusBadge status={art.status} />
                <span className="version-chip">v{art.version}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

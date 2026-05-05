import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', name: '', role: 'Editor' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.name) {
      setError('Name and email are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await login(form.email, form.name, form.role);
      localStorage.setItem('kb_user', JSON.stringify(res.data.data));
      navigate('/articles');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">📚</div>
          <h1>Knowledge Base</h1>
          <p>AI-Powered Document Management</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="login-name"
              className="form-input"
              type="text"
              name="name"
              placeholder="e.g. Jane Smith"
              value={form.name}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              id="login-role"
              className="form-select"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="Editor">Editor</option>
              <option value="Reviewer">Reviewer</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="mt-2">
            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : '🚀 Sign In'}
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          No password required. First login auto-registers your account.
        </p>
      </div>
    </div>
  );
}

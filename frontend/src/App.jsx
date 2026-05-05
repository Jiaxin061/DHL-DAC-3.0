import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError]   = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/health`)
      .then(res  => setHealth(res.data))
      .catch(err => setError('Backend not reachable. Is the server running?'));
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">📚 Knowledge Base</div>
        <span className="phase-badge">Phase 1 — Setup</span>
      </header>

      <main className="app-main">
        <section className="status-card">
          <h1>System Status</h1>

          {error && (
            <div className="status-row error">
              <span className="dot red" />
              <p>{error}</p>
            </div>
          )}

          {health && (
            <>
              <div className="status-row ok">
                <span className="dot green" />
                <p><strong>Backend:</strong> {health.message}</p>
              </div>
              <div className="status-row ok">
                <span className="dot green" />
                <p><strong>API Version:</strong> {health.version}</p>
              </div>
              <div className="status-row ok">
                <span className="dot green" />
                <p><strong>Timestamp:</strong> {new Date(health.timestamp).toLocaleString()}</p>
              </div>
            </>
          )}

          {!health && !error && (
            <div className="status-row loading">
              <span className="dot yellow pulse" />
              <p>Connecting to backend...</p>
            </div>
          )}
        </section>

        <section className="info-card">
          <h2>Project Overview</h2>
          <p>
            AI-Powered Knowledge Base System — transforms raw documents into structured,
            searchable knowledge articles via an automated pipeline.
          </p>
          <div className="tech-stack">
            {['React + Vite', 'Express', 'SQLite', 'UiPath RPA'].map(t => (
              <span className="tech-pill" key={t}>{t}</span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

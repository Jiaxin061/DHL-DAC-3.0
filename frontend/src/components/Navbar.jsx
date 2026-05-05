import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('kb_user') || 'null');

  function handleLogout() {
    localStorage.removeItem('kb_user');
    navigate('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="icon">📚</span>
        Knowledge Base
      </div>

      <div className="navbar-links">
        <NavLink to="/articles" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          📋 Articles
        </NavLink>
        <NavLink to="/upload" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          ⬆️ Upload
        </NavLink>
      </div>

      {user ? (
        <div className="navbar-user">
          <div className="user-avatar">{initials}</div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.72rem' }}>{user.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <NavLink to="/login" className="btn btn-primary btn-sm">Login</NavLink>
      )}
    </nav>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar       from './components/Navbar';
import LoginPage    from './pages/LoginPage';
import UploadPage   from './pages/UploadPage';
import DraftBuilder from './pages/DraftBuilder';
import ArticleList  from './pages/ArticleList';
import ArticleDetail from './pages/ArticleDetail';

// Guard: redirect to /login if no user in localStorage
function PrivateRoute({ children }) {
  const user = localStorage.getItem('kb_user');
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — wrapped in layout with Navbar */}
        <Route path="/*" element={
          <PrivateRoute>
            <div className="layout">
              <Navbar />
              <Routes>
                <Route path="/" element={<Navigate to="/articles" replace />} />
                <Route path="/articles"        element={<ArticleList />} />
                <Route path="/articles/:id"    element={<ArticleDetail />} />
                <Route path="/upload"          element={<UploadPage />} />
                <Route path="/draft/:id"       element={<DraftBuilder />} />
              </Routes>
            </div>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

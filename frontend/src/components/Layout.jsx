import { Outlet, Link, useNavigate } from 'react-router-dom';
import './Layout.css';

function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>Beszélgetés Átirat</h2>
        </div>
        <ul className="nav-menu">
          <li>
            <Link to="/dashboard/upload">Hanganyag feltöltése</Link>
          </li>
          <li>
            <Link to="/dashboard/record">Felvétel indítása</Link>
          </li>
          <li>
            <Link to="/dashboard/transcripts">Mentett átiratok</Link>
          </li>
          <li>
            <button onClick={handleLogout} className="logout-btn">
              Kijelentkezés
            </button>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

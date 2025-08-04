import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">SpeedyInfra</Link>
      </div>
      
      <div className="nav-links">
        <Link 
          to="/" 
          className={location.pathname === '/' ? 'active' : ''}
        >
          Home
        </Link>
        {user ? (
          <>
            <Link 
              to="/app" 
              className={location.pathname === '/app' ? 'active' : ''}
            >
              Dashboard
            </Link>
            <Link 
              to="/app/storage" 
              className={location.pathname.includes('storage') ? 'active' : ''}
            >
              Storage
            </Link>
            <Link 
              to="/app/profile" 
              className={location.pathname.includes('profile') ? 'active' : ''}
            >
              Profile
            </Link>
            <button onClick={logout} className="nav-btn">Logout</button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className={location.pathname === '/login' ? 'active' : ''}
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className={location.pathname === '/register' ? 'active' : ''}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

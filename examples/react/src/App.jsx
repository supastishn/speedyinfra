import { useAuth } from './AuthContext';
import AuthForm from './AuthForm';
import UserActions from './UserActions';
import TableManager from './TableManager';
import './App.css';
import ErrorBoundary from './ErrorBoundary';

function App() {
  const { user, logout } = useAuth();

  return (
    <ErrorBoundary>
      <header>
        <h1>SpeedyInfra API Demo</h1>
        {user && (
          <div className="user-info">
            <span>{user.email}</span>
            <button onClick={logout}>Logout</button>
          </div>
        )}
      </header>

      <main>
        {user ? (
          <>
            <UserActions />
            <TableManager />
          </>
        ) : (
          <div className="auth-forms">
            <AuthForm formType="login" />
            <AuthForm formType="register" />
          </div>
        )}
      </main>
    </ErrorBoundary>
  );
}

export default App;

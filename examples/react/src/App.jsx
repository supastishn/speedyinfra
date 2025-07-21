import { useAuth } from './AuthContext';
import AuthForm from './AuthForm';
import UserActions from './UserActions';
import './App.css';

function App() {
  const { user, logout } = useAuth();

  return (
    <>
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
          <UserActions />
        ) : (
          <div className="auth-forms">
            <AuthForm formType="login" />
            <AuthForm formType="register" />
          </div>
        )}
      </main>
    </>
  );
}

export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import LandingPage from './LandingPage';
import AuthForm from './AuthForm';
import UserActions from './UserActions';
import TableManager from './TableManager';
import StorageManager from './StorageManager';
import './App.css';
import ErrorBoundary from './ErrorBoundary';

function App() {
  const { user } = useAuth();

  return (
    <>
      <ErrorBoundary>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthForm formType="login" />} />
            <Route path="/register" element={<AuthForm formType="register" />} />
            <Route 
              path="/app"
              element={user ? <TableManager /> : <Navigate to="/login" replace />}
            />
            <Route 
              path="/app/storage" 
              element={user ? <StorageManager /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/app/profile" 
              element={user ? <UserActions /> : <Navigate to="/login" replace />} 
            />
          </Routes>
        </main>
      </ErrorBoundary>
    </>
  );
}

export default App;

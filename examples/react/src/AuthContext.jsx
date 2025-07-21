import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const projectName = "example_project"; // Hardcoded for demo

  const login = async (email, password) => {
    const res = await fetch('http://localhost:3000/rest/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Name': projectName
      },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem('token', token);
      setToken(token);
      fetchUserProfile(token);
    }
  };

  const register = async (email, password) => {
    const res = await fetch('http://localhost:3000/rest/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Name': projectName
      },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      await login(email, password);
    }
  };

  const fetchUserProfile = async (token) => {
    const res = await fetch('http://localhost:3000/rest/v1/users/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Project-Name': projectName
      }
    });
    
    if (res.ok) {
      setUser(await res.json());
    }
  };

  const updateUser = async (updates) => {
    const res = await fetch('http://localhost:3000/rest/v1/users/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Project-Name': projectName
      },
      body: JSON.stringify(updates)
    });
    
    if (res.ok) {
      fetchUserProfile(token);
    }
  };

  const deleteUser = async () => {
    await fetch('http://localhost:3000/rest/v1/users/delete', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Project-Name': projectName
      }
    });
    logout();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      updateUser, 
      deleteUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

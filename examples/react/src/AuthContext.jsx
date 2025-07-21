import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const apiClient = (method, endpoint, token, projectName, body) => {
  return fetch(`http://localhost:3000${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Project-Name': projectName,
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: body ? JSON.stringify(body) : null
  });
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const projectName = "example_project"; // Hardcoded for demo

  const login = async (email, password) => {
    const res = await apiClient(
      'POST',
      '/rest/v1/auth/login',
      null,
      projectName,
      { email, password }
    );
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem('token', token);
      setToken(token);
      fetchUserProfile(token);
    }
  };

  const register = async (email, password) => {
    const res = await apiClient(
      'POST',
      '/rest/v1/auth/register',
      null,
      projectName,
      { email, password }
    );
    if (res.ok) {
      await login(email, password);
    }
  };

  const fetchUserProfile = async (token) => {
    const res = await apiClient(
      'GET',
      '/rest/v1/users/profile',
      token,
      projectName
    );
    if (res.status === 401) {
      logout();
      return;
    }
    if (res.ok) {
      setUser(await res.json());
    }
  };

  const updateUser = async (updates) => {
    const res = await apiClient(
      'PUT',
      '/rest/v1/users/update',
      token,
      projectName,
      updates
    );
    if (res.ok) {
      fetchUserProfile(token);
    }
  };

  const deleteUser = async () => {
    await apiClient(
      'DELETE',
      '/rest/v1/users/delete',
      token,
      projectName
    );
    logout();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Table CRUD API
  const fetchTableData = async (table, endpoint = '', method = 'GET', body = null) => {
    try {
      const response = await apiClient(
        method,
        `/rest/v1/tables/${table}${endpoint}`,
        token,
        projectName,
        body
      );
      if (!response.ok) throw new Error('Operation failed');
      return await response.json();
    } catch (error) {
      console.error('Table operation error:', error);
      throw error;
    }
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
      projectName,
      login, 
      register, 
      logout, 
      updateUser, 
      deleteUser,
      fetchTableData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

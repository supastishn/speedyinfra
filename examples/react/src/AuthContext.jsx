import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const apiClient = async (method, endpoint, token, projectName, body) =>
  fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Project-Name': projectName,
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: body ? JSON.stringify(body) : undefined
  })

const uploadApiClient = async (endpoint, token, projectName, formData) =>
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-Project-Name': projectName,
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: formData
  });

const downloadApiClient = async (endpoint, token, projectName) =>
  fetch(endpoint, {
    method: 'GET',
    headers: {
      'X-Project-Name': projectName,
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const projectName = "example_project";

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

  const uploadFiles = async (formData) => {
      const res = await uploadApiClient(
        '/rest/v1/storage/upload',
        token,
        projectName,
        formData
      );
      if (!res.ok) throw new Error('Upload failed');
      return await res.json();
  };

  const listFiles = async () => {
      const res = await apiClient(
        'GET',
        '/rest/v1/storage/files',
        token,
        projectName
      );
      if (!res.ok) throw new Error('Could not list files');
      return await res.json();
  };

  const downloadFile = async (filename) => {
      const res = await downloadApiClient(
        `/rest/v1/storage/files/${filename}`,
        token,
        projectName
      );
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
  };

  const deleteFile = async (filename) => {
      const res = await apiClient(
        'DELETE',
        `/rest/v1/storage/files/${filename}`,
        token,
        projectName
      );
      if (!res.ok) throw new Error('Delete failed');
      return await res.json();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const fetchTableData = async (table, endpoint = '', method = 'GET', body = null) => {
    try {
      const response = await apiClient(
        method,
        `/rest/v1/tables/${table}${endpoint}`,
        token,
        projectName,
        body
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Operation failed' }));
        throw new Error(errorData.error || 'An unknown error occurred');
      }

      const totalCount = response.headers.get('X-Total-Count');
      const data = await response.json();

      if (totalCount !== null) {
        return { data, totalCount: parseInt(totalCount, 10) };
      }

      return data;
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
      fetchTableData,
      uploadFiles,
      listFiles,
      downloadFile,
      deleteFile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

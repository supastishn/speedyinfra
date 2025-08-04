import { createContext, useState, useContext, useEffect } from 'react';
import * as offlineDB from './offlineDB';

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
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('userProfile')) || null);
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
      await fetchUserProfile(token);
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
    try {
      const res = await apiClient('GET', '/rest/v1/users/profile', token, projectName);
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const userProfile = await res.json();
        setUser(userProfile);
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (err) {
      console.warn('Could not fetch user profile, using offline version.', err);
    }
  };

  const updateUser = async (updates) => {
    if (!navigator.onLine) {
      throw new Error('This action is not available offline.');
    }
    const res = await apiClient('PUT', '/rest/v1/users/update', token, projectName, updates);
    if (res.ok) {
      fetchUserProfile(token);
    }
  };

  const deleteUser = async () => {
    if (!navigator.onLine) {
      throw new Error('This action is not available offline.');
    }
    await apiClient('DELETE', '/rest/v1/users/delete', token, projectName);
    logout();
  };

  const uploadFiles = async (formData) => {
    if (!navigator.onLine) {
      throw new Error('This action is not available offline.');
    }
    const res = await uploadApiClient('/rest/v1/storage/upload', token, projectName, formData);
    if (!res.ok) throw new Error('Upload failed');
    return await res.json();
  };

  const listFiles = async () => {
    try {
      const res = await apiClient('GET', '/rest/v1/storage/files', token, projectName);
      if (!res.ok) throw new Error('Could not list files');
      const fileList = await res.json();
      await offlineDB.setOfflineFilesCache(projectName, fileList);
      return fileList;
    } catch (err) {
      console.warn('Could not list files, using offline cache.', err);
      return await offlineDB.getOfflineFilesCache(projectName);
    }
  };

  const downloadFile = async (filename) => {
    let blob;
    try {
      const res = await downloadApiClient(
        `/rest/v1/storage/files/${filename}`,
        token,
        projectName,
      );
      if (!res.ok) throw new Error('Download failed');
      blob = await res.blob();
      await offlineDB.setOfflineFileBlob(filename, blob);
    } catch (err) {
      console.warn('Could not download file, trying offline cache.', err);
      blob = await offlineDB.getOfflineFileBlob(filename);
      if (!blob) {
        throw new Error('File not available offline.');
      }
    }

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
    if (!navigator.onLine) {
      throw new Error('This action is not available offline.');
    }
    const res = await apiClient('DELETE', `/rest/v1/storage/files/${filename}`, token, projectName);
    if (!res.ok) throw new Error('Delete failed');
    await offlineDB.removeOfflineFileFromCache(filename);
    return await res.json();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const fetchTableData = async (table, endpoint = '', method = 'GET', body = null) => {
    if (method !== 'GET' && !navigator.onLine) {
      throw new Error('This action is not available offline.');
    }
    try {
      const response = await apiClient(
        method,
        `/rest/v1/tables/${table}${endpoint}`,
        token,
        projectName,
        body,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Operation failed' }));
        throw new Error(errorData.error || 'An unknown error occurred');
      }

      const totalCount = response.headers.get('X-Total-Count');
      const data = await response.json();

      if (method === 'GET') {
        if (Array.isArray(data)) {
          await offlineDB.setOfflineTableCache(table, data);
        } else if (typeof data === 'object' && data !== null && data._id) {
          await offlineDB.setOfflineTableItemCache(table, data);
        }
      }

      if (totalCount !== null) {
        return { data, totalCount: parseInt(totalCount, 10) };
      }

      return data;
    } catch (error) {
      console.error('Table operation error, trying offline cache:', error);
      if (method === 'GET') {
        const isById = endpoint.startsWith('/') && endpoint.length > 1 && !endpoint.includes('?');
        if (isById) {
          const docId = endpoint.substring(1);
          const data = await offlineDB.getOfflineTableItemCache(table, docId);
          if (!data) throw new Error('Item not found in offline cache.');
          return data;
        } else {
          const data = await offlineDB.getOfflineTableCache(table);
          // NOTE: Offline mode does not support filtering, pagination, or sorting.
          return { data, totalCount: data.length };
        }
      }
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

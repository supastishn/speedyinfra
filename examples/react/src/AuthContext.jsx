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
  const [isSyncing, setIsSyncing] = useState(false);

  const syncPendingOperations = async () => {
    if (isSyncing || !navigator.onLine || !token) return;
    setIsSyncing(true);

    try {
      const pendingOperations = await offlineDB.getSyncQueue();
      for (const op of pendingOperations) {
        try {
          let response;
          switch (op.type) {
            case 'updateUser':
              response = await apiClient('PUT', '/rest/v1/users/update', token, projectName, op.payload);
              break;
            case 'deleteUser':
              response = await apiClient('DELETE', '/rest/v1/users/delete', token, projectName);
              break;
            case 'uploadFiles': {
              const formData = new FormData();
              formData.append('files', op.payload);
              response = await uploadApiClient('/rest/v1/storage/upload', token, projectName, formData);
              break;
            }
            case 'deleteFile':
              response = await apiClient('DELETE', `/rest/v1/storage/files/${op.payload.filename}`, token, projectName);
              break;
            case 'fetchTableData':
              response = await apiClient(op.payload.method, `/rest/v1/tables/${op.payload.table}${op.payload.endpoint}`, token, projectName, op.payload.body);
              break;
            default:
              console.warn(`Unknown sync operation type: ${op.type}`);
          }

          if (response && response.ok) {
            await offlineDB.removeSyncQueueItem(op.id);
          } else {
            const errorBody = response ? await response.json().catch(() => response.text()) : 'No response';
            console.error('Failed to sync operation:', op, errorBody);
          }
        } catch (err) {
          console.error('Error during sync of operation:', op, err);
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const login = async (email, password) => {
    try {
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
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Login failed.' }));
        throw new Error(errorData.error || 'Invalid credentials');
      }
    } catch (err) {
      if (!navigator.onLine) {
        throw new Error('Cannot log in while offline. Please check your network connection.');
      }
      throw err;
    }
  };

  const register = async (email, password) => {
    try {
      const res = await apiClient(
        'POST',
        '/rest/v1/auth/register',
        null,
        projectName,
        { email, password }
      );
      if (res.ok) {
        await login(email, password);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(errorData.error || 'Registration failed');
      }
    } catch (err) {
      if (!navigator.onLine) {
        throw new Error('Cannot register while offline. Please check your network connection.');
      }
      throw err;
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
      // If we can't fetch a profile and don't have one cached, we should log out.
      if (!localStorage.getItem('userProfile')) {
        logout();
      }
    }
  };

  const updateUser = async (updates) => {
    if (!navigator.onLine) {
      await offlineDB.addSyncQueue({ type: 'updateUser', payload: updates });
      // Optimistic UI update
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('userProfile', JSON.stringify(updatedUser));
      return;
    }
    const res = await apiClient('PUT', '/rest/v1/users/update', token, projectName, updates);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Update failed' }));
      throw new Error(errorData.error || 'Update failed');
    }
    await fetchUserProfile(token);
  };

  const deleteUser = async () => {
    if (!navigator.onLine) {
      await offlineDB.addSyncQueue({ type: 'deleteUser' });
      logout(); // Optimistic logout
      return;
    }
    const res = await apiClient('DELETE', '/rest/v1/users/delete', token, projectName);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Delete failed' }));
      throw new Error(errorData.error || 'Delete failed');
    }
    logout();
  };

  const uploadFiles = async (formData) => {
    if (!navigator.onLine) {
      const file = formData.get('files');
      if (file) {
        await offlineDB.addSyncQueue({ type: 'uploadFiles', payload: file });
        return { message: 'File queued for upload when back online.' };
      }
      throw new Error('No file to upload');
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
    // Optimistic update
    await offlineDB.removeOfflineFileFromCache(filename);

    if (!navigator.onLine) {
      await offlineDB.addSyncQueue({ type: 'deleteFile', payload: { filename } });
      return { message: 'File deletion queued.' };
    }

    const res = await apiClient('DELETE', `/rest/v1/storage/files/${filename}`, token, projectName);
    if (!res.ok) {
      throw new Error('Delete failed');
    }
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
      await offlineDB.addSyncQueue({ type: 'fetchTableData', payload: { table, endpoint, method, body } });
      return { message: 'Action queued and will be synced when online.' };
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

  useEffect(() => {
    const handleOnline = () => syncPendingOperations();
    window.addEventListener('online', handleOnline);

    if (token && navigator.onLine) {
      syncPendingOperations();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [token, isSyncing]);

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

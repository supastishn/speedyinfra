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
  const [loading, setLoading] = useState(true);
  const projectName = "example_project";

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
      console.warn('API login failed, attempting offline.', err);
      const user = await offlineDB.getUserByEmail(email);
      if (user && user.password === password) {
        const mockToken = `offline-token-${user._id}-${Date.now()}`;
        localStorage.setItem('token', mockToken);
        setToken(mockToken);
        const { password: _, ...safeUser } = user;
        setUser(safeUser);
        localStorage.setItem('userProfile', JSON.stringify(safeUser));
        return;
      }
      throw new Error('Offline login failed. Check credentials or network.');
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
        const newUser = await res.json();
        await offlineDB.addUser({ ...newUser, password });
        await login(email, password);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(errorData.error || 'Registration failed');
      }
    } catch (err) {
      console.warn('API register failed, attempting offline.', err);
      const existingUser = await offlineDB.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists offline.');
      }
      const newUser = await offlineDB.addUser({ email, password, role: 'user' });
      const mockToken = `offline-token-${newUser._id}-${Date.now()}`;
      localStorage.setItem('token', mockToken);
      setToken(mockToken);
      const { password: _, ...safeUser } = newUser;
      setUser(safeUser);
      localStorage.setItem('userProfile', JSON.stringify(safeUser));
    }
  };

  const fetchUserProfile = async (token) => {
    if (token.startsWith('offline-token')) {
      const userId = token.split('-')[2];
      const userProfile = await offlineDB.getUserById(userId);
      if (userProfile) {
        const { password: _, ...safeUser } = userProfile;
        setUser(safeUser);
        localStorage.setItem('userProfile', JSON.stringify(safeUser));
      } else {
        logout();
      }
      return;
    }

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
        
        // Update offline user record without touching password if not present
        const offlineUser = await offlineDB.getUserById(userProfile._id);
        if (offlineUser) {
          await offlineDB.updateUserById(userProfile._id, userProfile);
        } else {
          // This user was not registered on this device, so they can't log in offline
          await offlineDB.addUser(userProfile);
        }

      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (err) {
      console.warn('Could not fetch user profile, using offline version.', err);
      if (!localStorage.getItem('userProfile')) {
        logout();
      }
    }
  };

  const updateUser = async (updates) => {
    const { password, ...safeUpdates } = updates;
    const updatedUser = { ...user, ...safeUpdates };
    setUser(updatedUser);
    localStorage.setItem('userProfile', JSON.stringify(updatedUser));
    
    try {
      if (token.startsWith('offline-token')) throw new Error("Offline mode");
      const res = await apiClient('PUT', '/rest/v1/users/update', token, projectName, updates);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(errorData.error || 'Update failed');
      }
      await fetchUserProfile(token);
    } catch (err) {
      console.warn("Couldn't update user online, updating offline.", err);
      await offlineDB.updateUserById(user._id, updates);
    }
  };

  const deleteUser = async () => {
    try {
      if (token.startsWith('offline-token')) throw new Error("Offline mode");
      const res = await apiClient('DELETE', '/rest/v1/users/delete', token, projectName);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(errorData.error || 'Delete failed');
      }
      await offlineDB.deleteUserById(user._id);
      logout();
    } catch (err) {
      console.warn("Couldn't delete user online, deleting offline.", err);
      await offlineDB.deleteUserById(user._id);
      logout();
    }
  };

  const uploadFiles = async (formData) => {
    const file = formData.get('files');
    if (!file) {
      throw new Error('No file to upload');
    }

    try {
      if (token.startsWith('offline-token')) throw new Error('offline');
      const res = await uploadApiClient('/rest/v1/storage/upload', token, projectName, formData);
      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      const serverFilename = data.files[0].filename;
      await offlineDB.setOfflineFileBlob(serverFilename, file);
      let existingFiles = await offlineDB.getOfflineFilesCache(projectName);
      if (!existingFiles.includes(serverFilename)) {
        await offlineDB.setOfflineFilesCache(projectName, [...existingFiles, serverFilename]);
      }
      return data;
    } catch (err) {
      console.warn('Online upload failed, saving to offline DB.', err);
      await offlineDB.setOfflineFileBlob(file.name, file);
      let existingFiles = await offlineDB.getOfflineFilesCache(projectName);
      if (!existingFiles.includes(file.name)) {
        await offlineDB.setOfflineFilesCache(projectName, [...existingFiles, file.name]);
      }
      return { message: 'File saved for offline use.' };
    }
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

    try {
      if (token.startsWith('offline-token')) throw new Error('offline');
      const res = await apiClient('DELETE', `/rest/v1/storage/files/${filename}`, token, projectName);
      if (!res.ok) {
        throw new Error('Delete failed');
      }
      return await res.json();
    } catch (err) {
      console.warn('Online delete failed, deleted from offline DB.', err);
      return { message: 'File deleted from offline storage.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const resetAllData = async () => {
    await offlineDB.clearAllData();
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    alert('All local data has been reset. The page will now reload.');
    window.location.reload();
  };

  const fetchTableData = async (table, endpoint = '', method = 'GET', body = null) => {
    try {
      if (token && token.startsWith('offline-token')) throw new Error('offline');

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
      console.warn('Table operation error, falling back to offline DB:', error);
      
      const docIdMatch = endpoint.match(/^\/([^/?]+)/);
      const docId = docIdMatch ? docIdMatch[1] : null;

      switch (method) {
        case 'GET': {
          if (docId) {
            const data = await offlineDB.getOfflineTableItemCache(table, docId);
            if (!data) throw new Error('Item not found in offline cache.');
            return data;
          }
          const queryParams = new URLSearchParams(endpoint.split('?')[1] || '');
          const query = Object.fromEntries(queryParams.entries());
          const data = await offlineDB.queryTable(table, query);
          return { data, totalCount: data.length };
        }
        case 'POST':
          return await offlineDB.addTableItem(table, body);
        case 'PUT':
          if (!docId) throw new Error('Document ID required for PUT');
          await offlineDB.updateTableItem(table, docId, body);
          return { modified: 1 };
        case 'DELETE':
            if (docId) {
              const deleted = await offlineDB.deleteTableItem(table, docId);
              return { deleted };
            }
            // NOTE: Offline mode does not support bulk delete by query.
            throw new Error('Offline bulk delete not supported');
        case 'PATCH':
            // NOTE: Offline mode does not support bulk update by query.
            throw new Error('Offline bulk update not supported');
        default:
          throw error;
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await fetchUserProfile(token);
      }
      setLoading(false);
    };
    initAuth();
  }, []);


  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading,
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
      deleteFile,
      resetAllData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

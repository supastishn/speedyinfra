import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function StorageManager() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { listFiles, uploadFiles, downloadFile, deleteFile } = useAuth();

  const fetchFiles = async () => {
    try {
      setError('');
      setMessage('');
      const fileList = await listFiles();
      setFiles(fileList);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    const formData = new FormData();
    formData.append('files', selectedFile);

    try {
      const result = await uploadFiles(formData);
      setMessage(result.message);
      setSelectedFile(null);
      document.getElementById('file-input').value = '';
      await fetchFiles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (filename) => {
    try {
      const result = await deleteFile(filename);
      setMessage(result.message);
      await fetchFiles();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="storage-manager">
      <h2>File Storage</h2>
      {error && <div className="error-display">{error}</div>}
      {message && <div className="message-display">{message}</div>}

      <div className="card">
        <h3>Upload File</h3>
        <input id="file-input" type="file" onChange={handleFileChange} className="styled-input" />
        <button onClick={handleUpload} disabled={!selectedFile} className="primary-btn">
          Upload
        </button>
      </div>

      <div className="card">
        <h3>Uploaded Files</h3>
        {files.length === 0 ? (
          <p>No files found.</p>
        ) : (
          <ul className="file-list">
            {files.map((file) => (
              <li key={file} className="file-item">
                <span>{file}</span>
                <div className="file-actions">
                  <button onClick={() => downloadFile(file)} className="demo-btn">Download</button>
                  <button onClick={() => handleDelete(file)} className="danger primary-btn">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

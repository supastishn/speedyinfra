import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function TableManager() {
  const [tableName, setTableName] = useState('products');
  const [documentId, setDocumentId] = useState('');
  const [queryFilter, setQueryFilter] = useState('{}');
  const [documentData, setDocumentData] = useState('');
  const [results, setResults] = useState(null);
  const { token, projectName } = useAuth();

  const fetchTableData = async (method, endpoint, body = null) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'X-Project-Name': projectName,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`http://localhost:3000/rest/v1/tables/${tableName}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });

      const data = await response.json();
      setResults(data);
      return data;
    } catch (error) {
      console.error('Operation failed:', error);
      setResults({ error: error.message });
    }
  };

  const handleCreate = () => {
    let dataObj;
    try {
      dataObj = JSON.parse(documentData || '{}');
    } catch {
      return setResults({ error: 'Invalid JSON data' });
    }
    fetchTableData('POST', '', dataObj);
  };

  const handleRead = () => {
    let query;
    try {
      query = JSON.parse(queryFilter || '{}');
    } catch {
      return setResults({ error: 'Invalid query JSON' });
    }
    
    const queryString = Object.entries(query)
      .map(([key, val]) => `${key}=${val}`)
      .join('&');
    
    fetchTableData('GET', `?${queryString}`);
  };

  const handleUpdate = () => {
    let query, dataObj;
    try {
      query = JSON.parse(queryFilter || '{}');
      dataObj = JSON.parse(documentData || '{}');
    } catch {
      return setResults({ error: 'Invalid JSON input' });
    }
    
    const queryString = Object.entries(query)
      .map(([key, val]) => `${key}=${val}`)
      .join('&');
    
    fetchTableData('PATCH', `?${queryString}`, dataObj);
  };

  const handleDelete = () => {
    let query;
    try {
      query = JSON.parse(queryFilter || '{}');
    } catch {
      return setResults({ error: 'Invalid query JSON' });
    }
    
    const queryString = Object.entries(query)
      .map(([key, val]) => `${key}=${val}`)
      .join('&');
    
    fetchTableData('DELETE', `?${queryString}`);
  };

  return (
    <div className="table-manager">
      <h2>Table API Demo</h2>
      
      <div className="card">
        <label>
          Table Name:
          <input 
            value={tableName} 
            onChange={e => setTableName(e.target.value)}
          />
        </label>
      </div>
      
      <div className="card grid">
        <div>
          <h3>Query Filter (JSON)</h3>
          <textarea
            value={queryFilter}
            onChange={e => setQueryFilter(e.target.value)}
            placeholder={'{"name":"Product1"}'}
          />
        </div>
        
        <div>
          <h3>Document Data (JSON)</h3>
          <textarea
            value={documentData}
            onChange={e => setDocumentData(e.target.value)}
            placeholder={'{"price":19.99}'}
          />
        </div>
      </div>

      <div className="card button-group">
        <button onClick={handleCreate}>Create Document</button>
        <button onClick={handleRead}>Read Documents</button>
        <button onClick={handleUpdate}>Update Documents</button>
        <button onClick={handleDelete}>Delete Documents</button>
      </div>

      {results && (
        <div className="card results">
          <h3>Results:</h3>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

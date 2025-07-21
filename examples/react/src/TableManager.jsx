import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function TableManager() {
  const [tableName, setTableName] = useState('products');
  const [documentId, setDocumentId] = useState('');
  const [queryFilter, setQueryFilter] = useState('{}');
  const [documentData, setDocumentData] = useState('');
  const [results, setResults] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [count, setCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [viewType, setViewType] = useState('json');
  const { token, projectName } = useAuth();

  useEffect(() => {
    setErrorMessage('');
    setValidationError('');
  }, [tableName, documentId, queryFilter, documentData]);

  const fetchTableData = async (method, endpoint, body = null) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'X-Project-Name': projectName,
        'Content-Type': 'application/json'
      };

      let fetchPath = `http://localhost:3000/rest/v1/tables/${tableName}${endpoint}`;

      // Add pagination to read requests
      if (method === 'GET' && !endpoint.includes('?')) {
        fetchPath += `?skip=${(page-1)*perPage}&limit=${perPage}`;
      } else if (method === 'GET' && endpoint.includes('?')) {
        fetchPath += `&skip=${(page-1)*perPage}&limit=${perPage}`;
      }

      const response = await fetch(fetchPath, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        setResults(null);
        if (response.status === 400 && data.error) {
          setValidationError(data.error);
        } else {
          setErrorMessage(data.error || data.message || data);
        }
        return;
      }

      setResults(data);
      setErrorMessage('');
      setValidationError('');

      // Document count display from header
      if (method === 'GET' && Array.isArray(data)) {
        setCount(data.length);
        // Add actual count from response header
        const totalCount = response.headers.get('X-Total-Count');
        if (totalCount) {
          setCount(parseInt(totalCount));
        }
      }

      // Pagination metadata from header
      if (method === 'GET' && response.headers.get('X-Total-Count')) {
        setCount(parseInt(response.headers.get('X-Total-Count')));
      } else if (method === 'GET') {
        if (typeof data === 'object' && !Array.isArray(data)) {
          setCount(1);
        } else if (Array.isArray(data)) {
          setCount(data.length);
          // Fetch total count for pagination
          const countRes = await fetch(`http://localhost:3000/rest/v1/tables/${tableName}/count`, {
            method: 'POST',
            headers,
            body: JSON.stringify(JSON.parse(queryFilter || '{}'))
          });
          if (countRes.ok) {
            const countData = await countRes.json();
            setCount(countData.count);
          }
        }
      }
    } catch (error) {
      console.error('Operation failed:', error);
      setErrorMessage(error.message);
      setResults(null);
    }
  };

  // Document operations by ID
  const handleReadById = () => {
    if (!documentId) return setErrorMessage('Document ID required');
    fetchTableData('GET', `/${documentId}`);
  };

  const handleUpdateById = () => {
    if (!documentId) return setErrorMessage('Document ID required');
    let dataObj;
    try {
      dataObj = JSON.parse(documentData || '{}');
    } catch {
      return setErrorMessage('Invalid JSON data');
    }
    fetchTableData('PATCH', `/${documentId}`, dataObj);
  };

  const handleDeleteById = () => {
    if (!documentId) return setErrorMessage('Document ID required');
    fetchTableData('DELETE', `/${documentId}`);
  };

  // Counting endpoint
  const handleCount = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'X-Project-Name': projectName,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(
        `http://localhost:3000/rest/v1/tables/${tableName}/count`,
        {
          method: 'POST',
          headers,
          body: queryFilter
        }
      );
      
      const data = await response.json();
      setResults({ count: data.count });
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Folder creation API
  const handleCreateFolder = () => {
    if (!tableName) return setErrorMessage('Folder name required');
    fetchTableData('POST', '/_folders', { name: tableName });
  };

  // Error scenario demo
  const triggerErrorDemo = () => {
    fetchTableData('GET', '/invalid-endpoint');
  };

  // Validation demo
  const triggerValidationDemo = () => {
    setTableName('products');
    setDocumentData('{"price": -5}');
    setQueryFilter('{}');
  };

  const handleCreate = () => {
    let dataObj;
    try {
      dataObj = JSON.parse(documentData || '{}');
    } catch {
      return setErrorMessage('Invalid JSON data');
    }
    fetchTableData('POST', '', dataObj);
  };

  const handleBulkCreate = () => {
    let dataArray;
    try {
      dataArray = JSON.parse(documentData);
      if (!Array.isArray(dataArray)) {
        throw new Error('Bulk create requires array input');
      }
    } catch (e) {
      return setErrorMessage('Invalid format for bulk create. Must be JSON array');
    }
    fetchTableData('POST', '/bulk', dataArray);
  };

  const handleRead = () => {
    let query;
    try {
      query = JSON.parse(queryFilter || '{}');
    } catch {
      return setErrorMessage('Invalid query JSON');
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
      return setErrorMessage('Invalid JSON input');
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
      return setErrorMessage('Invalid query JSON');
    }

    const queryString = Object.entries(query)
      .map(([key, val]) => `${key}=${val}`)
      .join('&');

    fetchTableData('DELETE', `?${queryString}`);
  };

  const loadDemoData = (demoType) => {
    setDocumentId('');
    setErrorMessage('');
    setValidationError('');

    switch(demoType) {
      case 'users':
        setTableName('_users');
        setQueryFilter('{"email":{"$exists":true}}');
        setDocumentData(JSON.stringify([
          {"email": "user1@demo.com", "password": "demo123"},
          {"email": "user2@demo.com", "password": "demo123"}
        ], null, 2));
        break;

      case 'products':
        setTableName('products');
        setQueryFilter('{"category":"electronics"}');
        setDocumentData(JSON.stringify([
          {"name": "Laptop", "price": 999.99, "stock": 15},
          {"name": "Phone", "price": 799.99, "stock": 30},
          {"name": "Tablet", "price": 399.99, "stock": 20}
        ], null, 2));
        break;

      case 'orders':
        setTableName('orders');
        setQueryFilter('{"status":"pending"}');
        setDocumentData(JSON.stringify({
          customer: "John Doe",
          items: [ {product: "Phone", quantity: 2} ],
          total: 1599.98,
          status: "shipped"
        }, null, 2));
        break;

      case 'nested':
        setTableName('complex_data');
        setQueryFilter('{"metadata.tags":{"$in":["priority"]}}');
        setDocumentData(JSON.stringify([
          {
            title: "Main Document",
            metadata: {
              tags: ["priority", "backend"],
              author: { name: "Admin", id: 123 }
            },
            revisions: [1, 2, 3]
          }
        ], null, 2));
        break;
    }
  };

  // Table view rendering
  const renderTable = (data) => {
    if (!Array.isArray(data) || data.length === 0) return <div>No data</div>;
    const headers = Object.keys(data[0]);
    return (
      <table>
        <thead>
          <tr>
            {headers.map(h => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {headers.map(h => <td key={h}>{String(row[h])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="table-manager">
      <h2>Table API Demo</h2>

      {/* Demo buttons */}
      <div className="demo-buttons">
        <button onClick={() => loadDemoData('users')}>Demo: Users</button>
        <button onClick={() => loadDemoData('products')}>Demo: Products</button>
        <button onClick={() => loadDemoData('orders')}>Demo: Orders</button>
        <button onClick={() => loadDemoData('nested')}>Demo: Nested Data</button>
      </div>

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

          <div className="doc-id-input">
            <label>Document ID:</label>
            <input
              value={documentId}
              onChange={e => setDocumentId(e.target.value)}
              placeholder="Specify for single document operations"
            />
          </div>
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
        <button onClick={handleCreate}>Create</button>
        <button onClick={handleBulkCreate}>Bulk Create</button>
        <button onClick={handleRead}>Read</button>
        <button onClick={handleUpdate}>Update</button>
        <button onClick={handleDelete}>Delete</button>
        <button onClick={handleReadById}>Get by ID</button>
        <button onClick={handleUpdateById}>Update by ID</button>
        <button onClick={handleDeleteById}>Delete by ID</button>
        <button onClick={handleCount}>Count Documents</button>
        <button onClick={handleCreateFolder}>Create Folder</button>
        <button onClick={triggerErrorDemo}>Trigger Error</button>
        <button onClick={triggerValidationDemo}>Validation Demo</button>
      </div>

      {/* Pagination controls */}
      {results && Array.isArray(results) && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p-1)}
          >Prev</button>

          <span>Page {page} of {Math.ceil(count / perPage)}</span>

          <button
            disabled={results.length < perPage || count <= page * perPage}
            onClick={() => setPage(p => p+1)}
          >Next</button>

          <select value={perPage} onChange={e => setPerPage(Number(e.target.value))}>
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
          </select>
        </div>
      )}

      {/* Error display */}
      {errorMessage && (
        <div className="error">
          <h3>Error ⚠️</h3>
          <pre>{errorMessage}</pre>
        </div>
      )}

      {/* Validation error display */}
      {validationError && (
        <div className="validation-error">
          <h3>Validation Error ⚠️</h3>
          <pre>{validationError}</pre>
        </div>
      )}

      {results && (
        <div className="card results">
          <h3>Results:</h3>
          <div>
            <label>
              <input 
                type="radio" 
                name="viewType" 
                checked={viewType === 'json'} 
                onChange={() => setViewType('json')}
              /> JSON View
            </label>
            <label>
              <input 
                type="radio" 
                name="viewType" 
                checked={viewType === 'table'} 
                onChange={() => setViewType('table')}
              /> Table View
            </label>
          </div>
          {viewType === 'json' && (
            <pre>{JSON.stringify(results, null, 2)}</pre>
          )}
          {viewType === 'table' && Array.isArray(results) && (
            renderTable(results)
          )}
        </div>
      )}
    </div>
  );
}

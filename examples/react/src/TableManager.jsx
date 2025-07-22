import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

function APIResultDisplay({ results, viewType, setViewType }) {
  const renderTableResults = data => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return <div>No data available</div>
    }
    const headers = Object.keys(data[0])
    return (
      <table>
        <thead>
          <tr>{headers.map(header => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {headers.map(header => (
                <td key={`${index}-${header}`}>
                  {String(row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
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
      {viewType === 'json' && <pre>{JSON.stringify(results, null, 2)}</pre>}
      {viewType === 'table' && renderTableResults(results)}
    </div>
  )
}

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

  // ... rest of TableManager logic unchanged ...

  // (Paste all TableManager logic from above, except for the renderTable function and the results display block)

  return (
    <div className="table-manager">
      <h2>Table API Demo</h2>

      {/* Demo buttons */}
      <div className="demo-buttons">
        <button className="demo-btn" onClick={() => loadDemoData('users')}>Users</button>
        <button className="demo-btn" onClick={() => loadDemoData('products')}>Products</button>
        <button className="demo-btn" onClick={() => loadDemoData('orders')}>Orders</button>
        <button className="demo-btn" onClick={() => loadDemoData('nested')}>Nested Data</button>
      </div>

      <div className="card">
        <label>
          Table Name:
          <input
            className="styled-input"
            value={tableName}
            onChange={e => setTableName(e.target.value)}
          />
        </label>
      </div>

      <div className="grid">
        <div className="card">
          <h3 className="card-header">Query Filter (JSON)</h3>
          <textarea
            className="styled-textarea"
            value={queryFilter}
            onChange={e => setQueryFilter(e.target.value)}
            placeholder={'{"name":"Product1"}'}
          />

          <div className="doc-id-input">
            <label className="input-label">Document ID:</label>
            <input
              className="styled-input"
              value={documentId}
              onChange={e => setDocumentId(e.target.value)}
              placeholder="Specify for single document operations"
            />
          </div>
        </div>

        <div className="card">
          <h3 className="card-header">Document Data (JSON)</h3>
          <textarea
            className="styled-textarea"
            value={documentData}
            onChange={e => setDocumentData(e.target.value)}
            placeholder={'{"price":19.99}'}
          />
        </div>
      </div>

      <div className="button-group card">
        <button className="primary-btn" onClick={handleCreate}>Create</button>
        <button className="primary-btn" onClick={handleBulkCreate}>Bulk Create</button>
        <button className="primary-btn" onClick={handleRead}>Read</button>
        <button className="primary-btn" onClick={handleUpdate}>Update</button>
        <button className="primary-btn" onClick={handleDelete}>Delete</button>
        <button className="primary-btn" onClick={handleReadById}>Get by ID</button>
        <button className="primary-btn" onClick={handleUpdateById}>Update by ID</button>
        <button className="primary-btn" onClick={handleDeleteById}>Delete by ID</button>
        <button className="primary-btn" onClick={handleCount}>Count Documents</button>
        <button className="primary-btn" onClick={handleCreateFolder}>Create Folder</button>
        <button className="primary-btn" onClick={triggerErrorDemo}>Trigger Error</button>
        <button className="primary-btn" onClick={triggerValidationDemo}>Validation Demo</button>
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
        <APIResultDisplay results={results} viewType={viewType} setViewType={setViewType} />
      )}
    </div>
  );
}

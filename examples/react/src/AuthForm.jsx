import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext'

export default function AuthForm({ formType }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('')
  const { login, register, user } = useAuth()
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async e => {
    e.preventDefault()
    setError('');
    try {
      const handler = formType === 'login' ? login : register
      await handler(email, password, rememberMe)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="card">
      <h3 className="card-header">
        {formType === 'login' ? 'Login' : 'Create Account'}
      </h3>
      {error && <div className="error-display">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            className="styled-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            className="styled-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength="6"
            required
          />
        </div>
        <div style={{ textAlign: 'left' }}>
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Remember me
          </label>
        </div>
        <button 
          className="primary-btn" 
          type="submit"
          style={{ marginTop: '15px', width: '100%' }}
        >
          {formType === 'login' ? 'Sign In' : 'Register'}
        </button>
      </form>
    </div>
  )
}

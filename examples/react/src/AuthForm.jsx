import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function AuthForm({ formType }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, register } = useAuth()

  const handleSubmit = e => {
    e.preventDefault()
    const handler = formType === 'login' ? login : register
    handler(email, password)
  }

  return (
    <div className="card">
      <h3 className="card-header">
        {formType === 'login' ? 'Login' : 'Create Account'}
      </h3>
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

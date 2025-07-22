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
    <form onSubmit={handleSubmit}>
      <h2>{formType === 'login' ? 'Login' : 'Register'}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        minLength="6"
        required
      />
      <button type="submit">
        {formType === 'login' ? 'Sign In' : 'Create Account'}
      </button>
    </form>
  )
}

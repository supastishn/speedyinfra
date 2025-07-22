import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function UserActions() {
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const { updateUser, deleteUser } = useAuth()

  return (
    <div>
      <h2>Manage Account</h2>
      <div className="card">
        <h3>Update Email</h3>
        <input
          type="email"
          placeholder="New email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
        />
        <button onClick={() => updateUser({ email: newEmail })}>
          Update Email
        </button>
      </div>
      <div className="card">
        <h3>Update Password</h3>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          minLength="6"
        />
        <button onClick={() => updateUser({ password: newPassword })}>
          Update Password
        </button>
      </div>
      <div className="card">
        <button onClick={deleteUser} className="danger">
          Delete Account
        </button>
      </div>
    </div>
  )
}

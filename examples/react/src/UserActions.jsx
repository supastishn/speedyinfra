import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function UserActions() {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { updateUser, deleteUser } = useAuth();

  const handleUpdate = async (data) => {
    try {
      setError('');
      setMessage('');
      await updateUser(data);
      setMessage('Update successful.');
      if (data.email) setNewEmail('');
      if (data.password) setNewPassword('');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm('Are you sure you want to delete your account? This action cannot be undone.')
    ) {
      try {
        setError('');
        setMessage('');
        await deleteUser();
      } catch (e) {
        setError(e.message);
      }
    }
  };

  return (
    <div>
      <h2>Manage Account</h2>
      {error && <div className="error-display">{error}</div>}
      {message && <div className="message-display">{message}</div>}
      <div className="card">
        <h3>Update Email</h3>
        <input
          type="email"
          placeholder="New email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <button onClick={() => handleUpdate({ email: newEmail })}>Update Email</button>
      </div>
      <div className="card">
        <h3>Update Password</h3>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength="6"
        />
        <button onClick={() => handleUpdate({ password: newPassword })}>Update Password</button>
      </div>
      <div className="card">
        <button onClick={handleDelete} className="danger">
          Delete Account
        </button>
      </div>
    </div>
  );
}

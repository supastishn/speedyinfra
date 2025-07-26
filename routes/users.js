
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getTableDB, promisifyDBMethod } = require('../util/db');

// Helpers
const getUser = async (id, projectName) => {
  const usersDB = getTableDB('_users', projectName);
  const findOneUser = promisifyDBMethod(usersDB, 'findOne');
  return await findOneUser({ _id: id });
};

const updateUser = async (id, data, projectName) => {
  const updatedData = {};
  if (data.email) updatedData.email = data.email;
  if (data.password) updatedData.password = await bcrypt.hash(data.password, 10);

  const usersDB = getTableDB('_users', projectName);
  const updateUser = promisifyDBMethod(usersDB, 'update');
  await updateUser({ _id: id }, { $set: updatedData });
};

/**
 * Additional endpoints for React SPA integration
 */

// Get user profile (token-based)
router.get('/profile', async (req, res) => {
  try {
    const user = await getUser(req.user.userId, req.projectName);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update authenticated user
router.put('/update', async (req, res) => {
  try {
    const { userId } = req.user;
    if (!await getUser(userId, req.projectName)) {
      return res.status(404).json({ error: 'User not found' });
    }

    await updateUser(userId, req.body, req.projectName);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete authenticated user
router.delete('/delete', async (req, res) => {
  try {
    const { userId } = req.user;
    const usersDB = getTableDB('_users', req.projectName);
    const removeUser = promisifyDBMethod(usersDB, 'remove');

    const numRemoved = await removeUser({ _id: userId });
    if (numRemoved === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id, req.projectName);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!await getUser(id, req.projectName)) {
      return res.status(404).json({ error: 'User not found' });
    }

    await updateUser(id, req.body, req.projectName);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usersDB = getTableDB('_users', req.projectName);
    const removeUser = promisifyDBMethod(usersDB, 'remove');

    const numRemoved = await removeUser({ _id: id });
    if (numRemoved === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

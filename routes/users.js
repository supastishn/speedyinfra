
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getTableDB, promisifyDBMethod } = require('../util/db');
const { authenticateToken } = require('../util/auth');

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const usersDB = getTableDB('_users', req.projectName);
    const findOneUser = promisifyDBMethod(usersDB, 'findOne');

    const user = await findOneUser({ _id: id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user by ID
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    const usersDB = getTableDB('_users', req.projectName);
    const updateUser = promisifyDBMethod(usersDB, 'update');
    const findOneUser = promisifyDBMethod(usersDB, 'findOne');

    const user = await findOneUser({ _id: id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedData = {};
    if (email) {
      updatedData.email = email;
    }
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    await updateUser({ _id: id }, { $set: updatedData });
    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user by ID
router.delete('/:id', authenticateToken, async (req, res) => {
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

/**
 * Additional endpoints for React SPA integration
 */

// Get user profile (token-based)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const usersDB = getTableDB('_users', req.projectName);
    const findOneUser = promisifyDBMethod(usersDB, 'findOne');

    const user = await findOneUser({ _id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const { password, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update authenticated user
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    req.params.id = userId;
    // Reuse the update logic
    const { email, password } = req.body;

    const usersDB = getTableDB('_users', req.projectName);
    const updateUser = promisifyDBMethod(usersDB, 'update');
    const findOneUser = promisifyDBMethod(usersDB, 'findOne');

    const user = await findOneUser({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedData = {};
    if (email) {
      updatedData.email = email;
    }
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    await updateUser({ _id: userId }, { $set: updatedData });
    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete authenticated user
router.delete('/delete', authenticateToken, async (req, res) => {
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

module.exports = router;

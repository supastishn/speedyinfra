
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getTableDB, promisifyDBMethod } = require('../util/db');
const { updateUserSchema } = require('../util/validation');
const { authorizeRole } = require('../util/auth');

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

const deleteUserById = async (id, projectName) => {
  const usersDB = getTableDB('_users', projectName);
  const removeUser = promisifyDBMethod(usersDB, 'remove');
  return await removeUser({ _id: id });
};

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /rest/v1/users/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
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

/**
 * @swagger
 * /rest/v1/users/update:
 *   put:
 *     summary: Update authenticated user's profile
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid data
 */
router.put('/update', async (req, res) => {
  try {
    const { error } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { userId } = req.user;
    if (!(await getUser(userId, req.projectName))) {
      return res.status(404).json({ error: 'User not found' });
    }

    await updateUser(userId, req.body, req.projectName);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rest/v1/users/delete:
 *   delete:
 *     summary: Delete authenticated user's account
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/delete', async (req, res) => {
  try {
    const { userId } = req.user;
    const numRemoved = await deleteUserById(userId, req.projectName);
    if (numRemoved === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rest/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
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

/**
 * @swagger
 * /rest/v1/users/{id}:
 *   put:
 *     summary: Update user by ID (admin only)
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:id', authorizeRole(['admin']), async (req, res) => {
  try {
    const { error } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { id } = req.params;
    if (!(await getUser(id, req.projectName))) {
      return res.status(404).json({ error: 'User not found' });
    }

    await updateUser(id, req.body, req.projectName);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rest/v1/users/{id}:
 *   delete:
 *     summary: Delete user by ID (admin only)
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/:id', authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const numRemoved = await deleteUserById(id, req.projectName);
    if (numRemoved === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

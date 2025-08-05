const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getTableDB, promisifyDBMethod, getProjectConfig } = require('../util/db');
const { registerSchema, loginSchema } = require('../util/validation');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user registration
 */

/**
 * @swagger
 * /rest/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request (e.g., user exists, invalid data)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const usersDB = getTableDB('_users', req.projectName);
    const findOneUser = promisifyDBMethod(usersDB, 'findOne');
    const insertUser = promisifyDBMethod(usersDB, 'insert');
    const countUsers = promisifyDBMethod(usersDB, 'count');

    const existing = await findOneUser({ email });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userCount = await countUsers({});
    const role = userCount === 0 ? 'admin' : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      email,
      password: hashedPassword,
      role,
      createdAt: new Date()
    };
    
    const savedUser = await insertUser(newUser);
    const { password: _, ...safeUser } = savedUser;
    res.status(201).json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rest/v1/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Login successful, returns JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const usersDB = getTableDB('_users', req.projectName);
    const findOneUser = promisifyDBMethod(usersDB, 'findOne');

    const user = await findOneUser({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { jwtSecret } = getProjectConfig(req.projectName);
    const expiresIn = rememberMe ? '30d' : '1h';
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn }
    );

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

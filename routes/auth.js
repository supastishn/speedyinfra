const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getTableDB, promisifyDBMethod, getProjectConfig } = require('../util/db');
const { registerSchema, loginSchema } = require('../util/validation');

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const usersDB = getTableDB('_users', req.projectName);
    const findOneUser = promisifyDBMethod(usersDB, 'findOne');
    const insertUser = promisifyDBMethod(usersDB, 'insert');

    const existing = await findOneUser({ email });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { 
      email, 
      password: hashedPassword, 
      createdAt: new Date() 
    };
    
    const savedUser = await insertUser(newUser);
    const { password: _, ...safeUser } = savedUser;
    res.status(201).json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

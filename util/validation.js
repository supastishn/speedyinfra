
const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  password: Joi.string().min(6),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateUserSchema,
};

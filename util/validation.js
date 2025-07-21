
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

const tableDataSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().min(0),
  category: Joi.string().valid('electronics', 'books', 'clothing'),
  tags: Joi.array().items(Joi.string()),
  metadata: Joi.object(),
  revisions: Joi.array().items(Joi.number()),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateUserSchema,
  tableDataSchema,
};

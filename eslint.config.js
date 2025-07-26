import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['examples/react/**', 'node_modules/**', 'projects/**', 'coverage/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      },
      parserOptions: {
        ecmaVersion: 2020
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'prettier/prettier': 'error'
    }
  },
  eslintConfigPrettier
];

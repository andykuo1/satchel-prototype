/* eslint-env node */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  plugins: [],
  rules: {
    'no-console': 'error',
    'no-unused-vars': [
      'error',
      { vars: 'all', args: 'none', ignoreRestSiblings: false }
    ],
  },
};

// Recommended ESLint configuration for Uptown Marketplace
// Copy this to .eslintrc.js to enforce development guidelines

module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Prevent accessing properties on unknown types
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',

    // Require proper error handling
    '@typescript-eslint/no-throw-literal': 'error',

    // Prevent improper type assertions
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'never',
      },
    ],

    // Require proper async/await usage
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-floating-promises': 'error',

    // Prevent any usage without explicit annotation
    '@typescript-eslint/no-explicit-any': 'warn',

    // Require proper null checks
    '@typescript-eslint/strict-boolean-expressions': [
      'error',
      {
        allowString: false,
        allowNumber: false,
        allowNullableObject: false,
        allowNullableBoolean: false,
        allowNullableString: false,
        allowNullableNumber: false,
        allowAny: false,
      },
    ],

    // Custom rules for our patterns
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Prevent unused variables
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  },
  ignorePatterns: [
    // Build outputs
    '.next/',
    'out/',
    'build/',
    'dist/',

    // Dependencies
    'node_modules/',

    // Templates and examples
    'templates/',
    '*.template.ts',
    '*.template.tsx',

    // Configuration files
    '*.config.js',
    '*.config.ts',
    'next.config.js',
    'tailwind.config.js',
    'postcss.config.js',

    // Recommended config files (they're templates)
    '.eslintrc.recommended.js',
    'tsconfig.strict.json',
    '.vscode/settings.recommended.json',
  ],
  overrides: [
    {
      // Special rules for service files
      files: ['src/services/**/*.ts'],
      rules: {
        // Encourage proper error handling in services
        '@typescript-eslint/no-explicit-any': 'error',
        'prefer-const': 'error',
      },
    },
    {
      // Special rules for page components
      files: ['src/app/**/page.tsx'],
      rules: {
        // Encourage proper Suspense usage
        'react-hooks/rules-of-hooks': 'error',
      },
    },
    {
      // Allow relaxed rules for development and config files
      files: [
        '**/*.config.js',
        '**/*.config.ts',
        'scripts/**/*',
        'templates/**/*',
        '*.template.ts',
        '*.template.tsx',
      ],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },
  ],
};

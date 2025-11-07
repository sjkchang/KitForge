module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier', // Must be last to override other configs
    ],
    env: {
        node: true,
        es2022: true,
    },
    rules: {
        // TypeScript-specific rules
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'warn',

        // General rules
        'no-console': 'off', // Allow console for now
        'prefer-const': 'warn',
        'no-var': 'error',
    },
    ignorePatterns: [
        'node_modules',
        'dist',
        'build',
        '.next',
        '.turbo',
        'coverage',
        '*.config.js',
        '*.config.ts',
    ],
};

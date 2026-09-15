import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * ECWT monorepo uchun umumiy ESLint konfiguratsiyasi.
 * Har bir workspace paketi shu fayldan foydalanadi (ESLint 9 flat config
 * yuqoriga qarab qidiradi).
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/.expo/**',
      '**/src/generated/**',
      '**/.pgdata/**',
      '**/coverage/**',
      // Next.js o'zi yaratadi va 'tahrirlanmasin' deb belgilaydi
      '**/next-env.d.ts',
      '**/*.config.js',
      '**/*.config.mjs',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ...globals.es2022 },
    },
    rules: {
      // Ishlab chiqish tezligini sekinlashtiradigan, lekin xatolikni ushlamaydigan
      // qoidalarni ogohlantirish darajasiga tushiramiz.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
    },
  },

  // React (mobil va admin)
  {
    files: ['apps/mobile/**/*.{ts,tsx}', 'apps/admin/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Testlar
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    languageOptions: { globals: { ...globals.jest } },
  },

  // Seed va skriptlar
  {
    files: ['**/prisma/seed.ts', '**/scripts/**'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
);

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import sonarjs from 'eslint-plugin-sonarjs'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      sonarjs,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Cyclomatic complexity: warn at 25, error at 50
      // Legacy code may exceed, but new code should stay under 25
      'complexity': ['warn', { max: 25 }],

      // SonarJS cognitive complexity: warn at 30
      'sonarjs/cognitive-complexity': ['warn', 30],

      // Duplicate code detection (increased threshold for test files)
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],

      // Function length: warn at 150 (accommodates render functions with JSX)
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],

      // File length: warn at 800, error at 2000
      'max-lines': ['warn', { max: 800, skipBlankLines: true, skipComments: true }],

      // Max parameters: warn at 6
      'max-params': ['warn', 6],
    },
  },
  // Relaxed rules for test files
  {
    files: ['**/__tests__/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
])

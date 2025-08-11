import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // TypeScript Rules
      "@typescript-eslint/no-explicit-any": "error", // Prevent using 'any' type
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-use-before-define": ["warn", {
        "functions": false,
        "classes": true,
        "variables": true,
        "allowNamedExports": false,
        "enums": false,
        "typedefs": false,
        "ignoreTypeReferences": true
      }],
      
      // React Hooks Rules
      "react-hooks/exhaustive-deps": ["warn", {
        "additionalHooks": "(useMyCustomHook|useMyOtherCustomHook)"
      }],
      "react-hooks/rules-of-hooks": "error",
      
      // Import/Export Rules
      "import/no-anonymous-default-export": ["error", {
        "allowArray": false,
        "allowArrowFunction": false,
        "allowAnonymousClass": false,
        "allowAnonymousFunction": false,
        "allowCallExpression": false,
        "allowNew": false,
        "allowLiteral": false,
        "allowObject": false
      }],
      
      // Next.js Specific Rules
      "@next/next/no-img-element": "error", // Enforce using Next.js Image component
      
      // General Best Practices
      "no-console": ["warn", { 
        "allow": ["warn", "error", "info"] 
      }],
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always", { "null": "ignore" }],
      "no-duplicate-imports": "error",
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    // Special overrides for specific file patterns
    files: ["**/*.config.{js,ts,mjs}", "**/*.setup.{js,ts}", "**/scripts/**/*"],
    rules: {
      "no-console": "off", // Allow console in config and script files
      "@typescript-eslint/no-var-requires": "off", // Allow require in config files
    },
  },
  {
    // Ignore patterns - files/folders to skip
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/public/**",
      "**/.vercel/**",
      "**/coverage/**",
      "**/*.min.js",
      "**/dist/**",
      "**/build/**",
    ],
  },
];

export default eslintConfig;

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
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "solana-programs/**",
    ],
  },
  {
    rules: {
      // Disable strict any rules (too noisy for game code)
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      // Disable hooks exhaustive deps (game loops have intentional deps)
      "react-hooks/exhaustive-deps": "off",
      // Allow img tag (using canvas-based games)
      "@next/next/no-img-element": "off",
      // Allow <a> tags without using Link (for external links)
      "@next/next/no-html-link-for-pages": "off",
      // Allow unescaped entities in JSX (quotes, apostrophes)
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;

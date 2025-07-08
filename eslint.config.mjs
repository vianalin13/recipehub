import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: ["./.next/**", "node_modules/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      //code style
      "semi": ["error", "always"],
      "curly": "error",

      //best practices
      "eqeqeq": ["error", "always"],
      "no-unused-vars": ["warn", {"argsIgnorePattern": "^_"}],
      "no-console": "warn",
      "strict": ["error", "never"],

             //react/next.js
       "react-hooks/rules-of-hooks": "error",
       "react-hooks/exhaustive-deps": "warn",

       //typescript
       "@typescript-eslint/no-explicit-any": "warn",
       "prefer-const": "error",

       //import organization
      "import/order": [
        "error",
        {
          "groups": [
            "builtin", //fs, path, url
            "external", //react, next
            "internal", //@/components/button
            "parent", //parent folder
            "sibling", //sibling folder
            "index" //index.ts
          ],
          "alphabetize": {"order": "asc", "caseInsensitive": true},
          "newlines-between": "always" //blank line between each group
        }
      ],

      //accessibility
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
    }
  }
];

export default eslintConfig;

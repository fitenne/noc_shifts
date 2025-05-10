import mantine from "eslint-config-mantine";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  ...mantine,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    rules: {
      "import/no-unresolved": "off", // ???
    },
  },
  { ignores: ["**/*.{mjs,cjs,js,d.ts,d.mts}"] }
);

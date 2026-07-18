import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = compat.extends("next/core-web-vitals");

// The FlatCompat shim injects a loaded `parser` object (with a `parse`
// function) into the resolved flat config. Next's lint worker transports the
// config across a process boundary and cannot serialize function values,
// which aborts `next lint` with "Cannot serialize key 'parse' in parser".
// Strip those objects — ESLint falls back to its default parser (espree).
for (const item of config) {
  if (item && typeof item === "object" && item.parser && typeof item.parser === "object") {
    delete item.parser;
  }
  if (
    item &&
    typeof item === "object" &&
    item.languageOptions?.parser &&
    typeof item.languageOptions.parser === "object"
  ) {
    delete item.languageOptions.parser;
  }
}

config.push({
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  },
});

export default config;
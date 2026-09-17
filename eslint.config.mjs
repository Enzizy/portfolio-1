import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    // The site uses visible "//" labels throughout its JSX.
    rules: { "react/jsx-no-comment-textnodes": "off" },
  },
  {
    // These existing interactive components intentionally reset local state in effects.
    files: [
      "components/ArcadeGame.tsx",
      "components/CommandPalette.tsx",
      "components/PixelCatCompanion.tsx",
      "components/PortfolioSplash.tsx",
      "components/TargetCursor.tsx",
      "components/TextType.tsx",
    ],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  {
    // TextType passes a ref through createElement to its selected host element.
    files: ["components/TextType.tsx"],
    rules: { "react-hooks/refs": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

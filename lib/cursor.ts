export type CursorVariant = "bracket" | "reticle" | "ring" | "orb";

/** Elements that get a text caret, where a custom pointer would only be in the way. */
export const CURSOR_TEXT_SELECTOR = [
  "input:not([type])",
  'input[type="text"]',
  'input[type="email"]',
  'input[type="search"]',
  'input[type="url"]',
  'input[type="tel"]',
  'input[type="password"]',
  'input[type="number"]',
  "textarea",
  '[contenteditable="true"]',
].join(",");

export const CURSOR_TARGET_SELECTOR =
  'a, button:not(:disabled), select:not(:disabled), summary, [role="button"], .cursor-target';

/**
 * Each layout gets the pointer its surface asks for: V3's drafting sheet takes a
 * surveyor's reticle, V2's rounded dashboard a soft ring, V4's particle field a
 * glowing orb, everything else the original snapping brackets.
 */
export function cursorVariantFor(pathname: string | null | undefined): CursorVariant {
  if (!pathname) return "bracket";
  if (pathname === "/v3" || pathname.startsWith("/v3/")) return "reticle";
  if (pathname === "/v4" || pathname.startsWith("/v4/")) return "orb";
  if (pathname === "/v5" || pathname.startsWith("/v5/")) return "ring";
  if (pathname === "/v2" || pathname.startsWith("/v2/")) return "ring";
  return "bracket";
}

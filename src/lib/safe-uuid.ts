/**
 * Safe UUID generator that works across all browser environments,
 * including non-secure contexts (HTTP with IP), mobile WebViews, and older browsers.
 */
export function safeUUID(): string {
  try {
    if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fallback if crypto access is blocked
  }

  // RFC4122 v4 compliant fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

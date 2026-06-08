// Test stubs: neutralise framework-only modules so server modules can be
// imported in Vitest (Node) without a request/RSC context.
export {}; // for "server-only"

// For "next/headers": a no-op cookies() (the engine never reads cookies).
export function cookies() {
  return { get: () => undefined };
}

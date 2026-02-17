// Provides the module map for convex-test.
// import.meta.glob is a Vite feature processed at build time by Vitest.
// The path is relative to this file's location (tests/unit/convex/).
export const modules = import.meta.glob("../../../convex/**/*.*s");

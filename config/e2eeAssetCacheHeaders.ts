// The OpenMLS WebAssembly module of encrypted messages lives in public/e2ee
// under a content-hashed name, `mls-wasm-<first 16 hex of its SHA-256>.wasm`
// (scripts/build-mls-wasm.cjs deletes older hashed files on rebuild). Next
// serves public files with max-age=0, so every sign-in and engine start
// would revalidate 1.8 MB. A new build gets a new name, so a year-long
// immutable policy never pins stale bytes; the loader still checks the bytes
// against the bundled SHA-256 before use. Only hashed names match the rule.
export const e2eeAssetCacheHeaders = {
  source: "/e2ee/:file(mls-wasm-[0-9a-f]{16}\\.wasm)",
  headers: [
    { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
  ],
};

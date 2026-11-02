import type { WasmModule } from "./wasm-types";

/**
 * Default `loadWasm` (contract 12): fetches the hash-pinned module from
 * public/e2ee through the WASM package's loader. Dynamically imported so the
 * glue code never enters the main bundle.
 */
export async function loadDefaultWasm(): Promise<WasmModule> {
  const { loadMlsWasm } = await import("./wasm");
  return loadMlsWasm();
}

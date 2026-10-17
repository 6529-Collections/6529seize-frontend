/**
 * Loader for the OpenMLS WebAssembly module (E2EE contract section 10).
 *
 * The module is built from `native/mls-wasm` by `6529 run build:mls-wasm` and
 * served from `public/e2ee/` under a content-hashed name. Before
 * instantiating, the loader checks the bytes against the SHA-256 in
 * `manifest.ts`, which ships inside the reviewed JS bundle. A swapped or
 * corrupted binary is refused.
 *
 * Import this module only through a dynamic `import()` so neither the glue
 * nor the binary enters the main bundle.
 */
import initMlsWasm, {
  MlsDevice,
  entryDigest,
  epochCommitment,
  hTag,
  messageDigest,
  moduleInfo,
  revokeDigest,
  rosterDigest,
  verifyEd25519,
} from "./generated/mls_wasm";
import { MLS_WASM_MANIFEST } from "./manifest";

export { MLS_WASM_MANIFEST } from "./manifest";
export type { MlsDevice } from "./generated/mls_wasm";

/** The module surface returned by {@link loadMlsWasm}. */
export interface MlsWasmExports {
  readonly MlsDevice: typeof MlsDevice;
  readonly hTag: typeof hTag;
  readonly verifyEd25519: typeof verifyEd25519;
  readonly messageDigest: typeof messageDigest;
  readonly revokeDigest: typeof revokeDigest;
  readonly entryDigest: typeof entryDigest;
  readonly rosterDigest: typeof rosterDigest;
  readonly epochCommitment: typeof epochCommitment;
  readonly moduleInfo: typeof moduleInfo;
}

interface LoadMlsWasmOptions {
  /** Module bytes supplied by the caller (tests, desktop). Still hash-checked. */
  readonly bytes?: Uint8Array;
  /** URL to fetch instead of the manifest path (for example a CDN prefix). */
  readonly url?: string;
}

const LOAD_ERROR = "E2EE_WASM:LOAD_FAILED";
const INTEGRITY_ERROR = "E2EE_WASM:INTEGRITY";

let loading: Promise<MlsWasmExports> | null = null;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

async function fetchModule(url: string): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error(`${LOAD_ERROR}: ${url} returned ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function verifyModule(bytes: Uint8Array<ArrayBuffer>): Promise<void> {
  // Typed as optional: older WebViews and plain-HTTP origins lack WebCrypto.
  const subtle: SubtleCrypto | undefined = (
    globalThis as { crypto?: Crypto }
  ).crypto?.subtle;
  if (subtle === undefined) {
    throw new Error(`${LOAD_ERROR}: WebCrypto is not available`);
  }
  if (bytes.byteLength !== MLS_WASM_MANIFEST.bytes) {
    throw new Error(
      `${INTEGRITY_ERROR}: module size does not match the manifest`
    );
  }
  const digest = toHex(await subtle.digest("SHA-256", bytes));
  if (digest !== MLS_WASM_MANIFEST.sha256) {
    throw new Error(
      `${INTEGRITY_ERROR}: module hash does not match the manifest`
    );
  }
}

async function instantiate(
  options: LoadMlsWasmOptions
): Promise<MlsWasmExports> {
  const bytes = options.bytes
    ? new Uint8Array(options.bytes)
    : await fetchModule(options.url ?? MLS_WASM_MANIFEST.file);
  await verifyModule(bytes);
  await initMlsWasm({ module_or_path: bytes });
  return Object.freeze({
    MlsDevice,
    hTag,
    verifyEd25519,
    messageDigest,
    revokeDigest,
    entryDigest,
    rosterDigest,
    epochCommitment,
    moduleInfo,
  });
}

/**
 * Fetch (unless `bytes` is given), verify and instantiate the module once.
 * Later calls return the same instance; a failed load can be retried.
 */
export function loadMlsWasm(
  options: LoadMlsWasmOptions = {}
): Promise<MlsWasmExports> {
  loading ??= instantiateOnce(options);
  return loading;
}

async function instantiateOnce(
  options: LoadMlsWasmOptions
): Promise<MlsWasmExports> {
  try {
    return await instantiate(options);
  } catch (error: unknown) {
    loading = null;
    throw error;
  }
}

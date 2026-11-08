import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MLS_WASM_MANIFEST } from "@/lib/e2ee/wasm/manifest";

// The Device Farm probe ships in its own bundle with the module's path,
// hash and size as defaults; a module rebuild must update them too.
describe("Device Farm E2EE probe module defaults", () => {
  it("equal lib/e2ee/wasm/manifest.ts", () => {
    const probe = readFileSync(
      join(
        process.cwd(),
        "tests/device-farm/specs/e2ee-capabilities.probe.spec.cjs"
      ),
      "utf8"
    );
    const defaults = {
      file: /E2EE_WASM_PATH \|\|\s*"([^"]+)"/.exec(probe)?.[1],
      sha256: /E2EE_WASM_SHA256 \|\|\s*"([0-9a-f]+)"/.exec(probe)?.[1],
      bytes: Number(/E2EE_WASM_BYTES \|\|\s*(\d+)/.exec(probe)?.[1]),
    };
    expect(defaults).toEqual({
      file: MLS_WASM_MANIFEST.file,
      sha256: MLS_WASM_MANIFEST.sha256,
      bytes: MLS_WASM_MANIFEST.bytes,
    });
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MLS_WASM_MANIFEST } from "@/lib/e2ee/wasm/manifest";

// The Device Farm E2EE probe ships in its own bundle with the module's path,
// hash and size as defaults; a module rebuild must update them too.
describe("Device Farm E2EE probe module defaults", () => {
  it("match lib/e2ee/wasm/manifest.ts", () => {
    const probe = readFileSync(
      join(
        process.cwd(),
        "tests/device-farm/specs/e2ee-capabilities.probe.spec.cjs"
      ),
      "utf8"
    );
    expect(probe).toContain(
      `process.env.E2EE_WASM_PATH || "${MLS_WASM_MANIFEST.file}"`
    );
    expect(probe).toContain(`"${MLS_WASM_MANIFEST.sha256}"`);
    expect(probe).toContain(
      `process.env.E2EE_WASM_BYTES || ${MLS_WASM_MANIFEST.bytes}`
    );
  });
});

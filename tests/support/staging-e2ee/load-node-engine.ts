import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";

/** Keep the production engine and its dependencies in one Node module graph. */
export async function loadNodeEngine(): Promise<
  typeof import("./node-engine")
> {
  const directory = await mkdtemp(join(tmpdir(), "e2ee-staging-engine-"));
  const outfile = join(directory, "engine.cjs");
  try {
    await build({
      entryPoints: ["tests/support/staging-e2ee/node-engine.ts"],
      outfile,
      bundle: true,
      platform: "node",
      format: "cjs",
      target: "node22",
      logLevel: "silent",
    });
    const requireModule = createRequire(join(process.cwd(), "package.json"));
    return requireModule(outfile) as typeof import("./node-engine");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

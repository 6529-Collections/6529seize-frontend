/**
 * @jest-environment node
 */
import { buildSync } from "esbuild";
import path from "node:path";
import { brotliCompressSync, constants } from "node:zlib";

// The flight recorder ships in the root bundle; the collector modules it
// reuses are budgeted by collectorBundleSize.
const BUDGET_BROTLI_BYTES = 2.5 * 1024;
const ALREADY_IN_ROOT_BUNDLE = [
  "@/config/env",
  "@/utils/monitoring/mobileLaunchTimingSanitizers",
  "@/services/analytics/telemetry/collector",
  "@/services/analytics/telemetry/environment",
  "@/services/analytics/telemetry/wire",
];

describe("flight recorder bundle size", () => {
  it(`stays within ${BUDGET_BROTLI_BYTES} bytes brotli`, () => {
    const root = path.resolve(__dirname, "../../..");
    const result = buildSync({
      stdin: {
        contents: 'export * from "@/services/diagnostics/flightRecorder";',
        resolveDir: root,
        loader: "ts",
      },
      absWorkingDir: root,
      tsconfig: path.join(root, "tsconfig.json"),
      bundle: true,
      minify: true,
      format: "esm",
      platform: "browser",
      target: "es2020",
      write: false,
      external: ALREADY_IN_ROOT_BUNDLE,
      logLevel: "silent",
    });
    const code = result.outputFiles[0]!.contents;
    const brotli = brotliCompressSync(code, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length;
    process.stdout.write(
      `flight recorder: ${code.length} B minified, ${brotli} B brotli\n`
    );
    expect(brotli).toBeLessThanOrEqual(BUDGET_BROTLI_BYTES);
  });
});

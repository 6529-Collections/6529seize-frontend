/**
 * @jest-environment node
 */
import { buildSync } from "esbuild";
import path from "node:path";
import { brotliCompressSync, constants } from "node:zlib";

// R14 §4.1 budget: the collector client, its web-vitals observers and the
// schema's product-event registry included, stays at about 5 KB brotli
// (5.1 KB measured with the flight-recorder hooks). The guard leaves 0.4 KB
// of headroom. Modules the root bundle already ships are external.
const BUDGET_BROTLI_BYTES = 5.5 * 1024;
const ALREADY_IN_ROOT_BUNDLE = [
  "react",
  "react/jsx-runtime",
  "next/navigation",
  "@capacitor/core",
  "@/config/env",
  "@/components/auth/Auth",
  "@/components/cookies/CookieConsentContext",
  "@/services/auth/auth.utils",
  "@/services/analytics/pageClassification",
  "@/services/websocket/WebSocketContext",
  "@/services/websocket/WebSocketTypes",
  "@/utils/monitoring/mobileLaunchTimingSanitizers",
  // Budgeted on its own by flightRecorderBundleSize.
  "@/services/diagnostics/flightRecorder",
];

describe("first-party collector bundle size", () => {
  it(`stays within ${BUDGET_BROTLI_BYTES} bytes brotli, vitals included`, () => {
    const root = path.resolve(__dirname, "../../../..");
    const result = buildSync({
      stdin: {
        // Every entry point other modules import, so nothing that ships in
        // the real bundle is tree-shaken away here.
        contents: [
          'export { default } from "@/components/providers/FirstPartyTelemetry";',
          'export { countApiRequest, countBoundaryError, flushTelemetry, markPageNotFound, recordProductEvent } from "@/services/analytics/telemetry/collector";',
        ].join("\n"),
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
      jsx: "automatic",
      write: false,
      external: ALREADY_IN_ROOT_BUNDLE,
      define: { "process.env.NODE_ENV": '"production"' },
      logLevel: "silent",
    });
    const code = result.outputFiles[0]!.contents;
    const brotli = brotliCompressSync(code, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length;
    // Printed so a PR can quote the measured size.
    process.stdout.write(
      `first-party collector: ${code.length} B minified, ${brotli} B brotli\n`
    );
    expect(brotli).toBeLessThanOrEqual(BUDGET_BROTLI_BYTES);
  });
});

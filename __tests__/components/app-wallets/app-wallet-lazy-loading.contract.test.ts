import fs from "node:fs";
import path from "node:path";

// These modules are reachable from the root providers, so they ship on every
// route. ethers and the Node crypto polyfills must only load on demand.
const ROOT_GRAPH_MODULES = [
  "components/app-wallets/AppWalletsContext.tsx",
  "components/app-wallets/AppWalletModal.tsx",
  "components/app-wallets/app-wallet-helpers.ts",
  "components/app-wallets/app-wallet-envelope.ts",
  "utils/wallet-validation.utils.ts",
  "wagmiConfig/wagmiAppWalletConnector.ts",
  "wagmiConfig/appWalletConnectorType.ts",
  "components/providers/useAppWalletConnectors.ts",
  "helpers/waves/drop.helpers.ts",
];

const HEAVY_STATIC_IMPORT =
  /^\s*import\s+(?!type\b)[^;]*?\bfrom\s+["'](?:ethers|(?:node:)?crypto|ethereum-cryptography(?:\/[^"']*)?|\.\/app-wallet-crypto)["']/m;

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

// Any value import, side-effect import or re-export of the app-wallet
// connector module. Type-only imports and exports are erased at build time.
const STATIC_CONNECTOR_IMPORT =
  /^\s*(?:(?:import|export)\s+(?!type\b)[^;]*?\bfrom\s+|import\s+)["'][^"']*\bwagmiAppWalletConnector["']/m;
const CONNECTOR_SCAN_ROOTS = [
  "components",
  "contexts",
  "hooks",
  "wagmiConfig",
  "app",
];
// The connector module itself, and AppKitAdapterManager, which is only ever
// reached through the wallet stack's import() in WagmiSetup.
const CONNECTOR_STATIC_IMPORT_ALLOWED = new Set([
  "wagmiConfig/wagmiAppWalletConnector.ts",
  "components/providers/AppKitAdapterManager.ts",
]);

function listSourceFiles(relativeDirectory: string): string[] {
  const absoluteDirectory = path.join(process.cwd(), relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) return [];
  return fs
    .readdirSync(absoluteDirectory, { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = `${relativeDirectory}/${entry.name}`;
      if (entry.isDirectory()) return listSourceFiles(relativePath);
      return /\.(?:[cm]?[jt]sx?)$/u.test(entry.name) ? [relativePath] : [];
    });
}

describe("app-wallet lazy loading contract", () => {
  it.each(ROOT_GRAPH_MODULES)(
    "%s has no static ethers or crypto import",
    (relativePath) => {
      expect(readSource(relativePath)).not.toMatch(HEAVY_STATIC_IMPORT);
    }
  );

  it("loads the app-wallet connector only on demand", () => {
    const scannedFiles = CONNECTOR_SCAN_ROOTS.flatMap(listSourceFiles);
    // Guards the walker itself: an empty scan would pass vacuously.
    expect(scannedFiles).toContain("components/providers/WagmiSetup.tsx");
    const staticImporters = scannedFiles.filter(
      (relativePath) =>
        !CONNECTOR_STATIC_IMPORT_ALLOWED.has(relativePath) &&
        STATIC_CONNECTOR_IMPORT.test(readSource(relativePath))
    );
    expect(staticImporters).toEqual([]);
    expect(
      readSource("components/providers/WagmiSetup.tsx")
    ).toMatch(/import\(\s*["']@\/components\/providers\/AppKitAdapterManager["']\s*\)/);
    expect(
      readSource("components/providers/useAppWalletConnectors.ts")
    ).toMatch(/import\(\s*["']@\/wagmiConfig\/wagmiAppWalletConnector["']\s*\)/);
  });

  it("recognizes every static form of a connector import", () => {
    for (const source of [
      'import { createAppWalletConnector } from "@/wagmiConfig/wagmiAppWalletConnector";',
      'import "../wagmiConfig/wagmiAppWalletConnector";',
      'export { APP_WALLET_CONNECTOR_TYPE } from "./wagmiAppWalletConnector";',
      'export * from "@/wagmiConfig/wagmiAppWalletConnector";',
    ]) {
      expect(source).toMatch(STATIC_CONNECTOR_IMPORT);
    }
    for (const source of [
      'import type { createAppWalletConnector } from "@/wagmiConfig/wagmiAppWalletConnector";',
      'export type { AppWallet } from "./wagmiAppWalletConnector";',
      'const load = () => import("@/wagmiConfig/wagmiAppWalletConnector");',
    ]) {
      expect(source).not.toMatch(STATIC_CONNECTOR_IMPORT);
    }
  });

  it("loads the app-wallet cipher implementation on demand", () => {
    expect(readSource("components/app-wallets/app-wallet-helpers.ts")).toMatch(
      /import\(\s*["']\.\/app-wallet-crypto["']\s*\)/
    );
  });
});

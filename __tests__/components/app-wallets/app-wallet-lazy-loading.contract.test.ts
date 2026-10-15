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
  "helpers/waves/drop.helpers.ts",
];

const HEAVY_STATIC_IMPORT =
  /^\s*import\s+(?!type\b)[^;]*?\bfrom\s+["'](?:ethers|(?:node:)?crypto|ethereum-cryptography(?:\/[^"']*)?|\.\/app-wallet-crypto)["']/m;

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("app-wallet lazy loading contract", () => {
  it.each(ROOT_GRAPH_MODULES)(
    "%s has no static ethers or crypto import",
    (relativePath) => {
      expect(readSource(relativePath)).not.toMatch(HEAVY_STATIC_IMPORT);
    }
  );

  it("loads the app-wallet cipher implementation on demand", () => {
    expect(readSource("components/app-wallets/app-wallet-helpers.ts")).toMatch(
      /import\(\s*["']\.\/app-wallet-crypto["']\s*\)/
    );
  });
});

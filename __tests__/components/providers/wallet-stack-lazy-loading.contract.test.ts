import fs from "node:fs";
import path from "node:path";

// These modules are reachable from the root providers, so they ship on every
// route. Reown AppKit, WalletConnect and the Coinbase connector must only load
// through import() once a stored session or a connect intent needs them.
const ROOT_GRAPH_MODULES = [
  "components/providers/Providers.tsx",
  "components/providers/WagmiSetup.tsx",
  "components/providers/walletSessionGate.ts",
  "components/providers/AppKitBootstrapContext.tsx",
  "components/providers/createPublicWagmiConfig.ts",
  "components/providers/DeferredWagmiProvider.tsx",
  "components/auth/SeizeConnectProvider.tsx",
  "components/auth/AppKitModalBridge.tsx",
  "components/auth/appKitModalBridgeStoreContext.ts",
];

const WALLET_STACK_STATIC_IMPORT =
  /^\s*import\s+(?!type\b)[^;]*?\bfrom\s+["'](?:@reown\/[^"']+|@walletconnect\/[^"']+|@coinbase\/[^"']+|(?:@wagmi|wagmi)\/connectors|(?:@\/components\/providers|\.)\/AppKitAdapterManager|@\/utils\/appkit-initialization\.utils|\.\/AppKitModalHooks)["']/m;

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("wallet stack lazy loading contract", () => {
  it.each(ROOT_GRAPH_MODULES)(
    "%s has no static wallet SDK import",
    (relativePath) => {
      expect(readSource(relativePath)).not.toMatch(WALLET_STACK_STATIC_IMPORT);
    }
  );

  it("loads the AppKit adapter and initializer on demand", () => {
    const source = readSource("components/providers/WagmiSetup.tsx");
    expect(source).toMatch(
      /import\(\s*["']@\/components\/providers\/AppKitAdapterManager["']\s*\)/
    );
    expect(source).toMatch(
      /import\(\s*["']@\/utils\/appkit-initialization\.utils["']\s*\)/
    );
  });

  it("loads the AppKit modal hooks on demand", () => {
    expect(readSource("components/auth/AppKitModalBridge.tsx")).toMatch(
      /import\(\s*["']\.\/AppKitModalHooks["']\s*\)/
    );
  });
});

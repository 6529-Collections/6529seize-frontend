import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

type LockfileSnapshot = {
  dependencies?: Record<string, string>;
};

type PnpmLockfile = {
  overrides?: Record<string, string>;
  packages?: Record<string, unknown>;
  snapshots?: Record<string, LockfileSnapshot>;
};

type PnpmWorkspace = {
  overrides?: Record<string, string>;
};

// Keep the regression boundary explicit so dependency upgrades must re-evaluate
// whether AppKit still needs this override before changing the expected stack.
const affectedVersion = "2.23.7";
const affectedProvider = `@walletconnect/universal-provider@${affectedVersion}`;
const patchedVersion = "2.23.9";
const appKitVersion = "1.8.19";
const appKitSnapshotKey = new RegExp(
  `^@reown/appkit(?:-[^@]+)?@${appKitVersion.replaceAll(".", "\\.")}(?:\\(|$)`
);
const alignedRelayPackages = [
  "core",
  "sign-client",
  "types",
  "universal-provider",
  "utils",
] as const;
const repoRoot = resolve(__dirname, "..");

function readYaml<T>(filename: string): T {
  return parse(readFileSync(resolve(repoRoot, filename), "utf8")) as T;
}

describe("WalletConnect relay resilience", () => {
  it("keeps AppKit on the relay reconnection fix", () => {
    const workspace = readYaml<PnpmWorkspace>("pnpm-workspace.yaml");
    const lockfile = readYaml<PnpmLockfile>("pnpm-lock.yaml");

    expect(workspace.overrides?.[affectedProvider]).toBe(patchedVersion);
    expect(lockfile.overrides?.[affectedProvider]).toBe(patchedVersion);

    const appKitProviderVersions = Object.entries(lockfile.snapshots ?? {})
      .filter(([key]) => appKitSnapshotKey.test(key))
      .flatMap(([, snapshot]) => {
        const version =
          snapshot.dependencies?.["@walletconnect/universal-provider"];
        return version ? [version.split("(", 1)[0]] : [];
      });

    expect(appKitProviderVersions.length).toBeGreaterThan(0);
    expect(new Set(appKitProviderVersions)).toEqual(new Set([patchedVersion]));

    for (const packageName of alignedRelayPackages) {
      expect(
        lockfile.packages?.[`@walletconnect/${packageName}@${patchedVersion}`]
      ).toBeDefined();
      expect(
        lockfile.packages?.[`@walletconnect/${packageName}@${affectedVersion}`]
      ).toBeUndefined();
    }
  });
});

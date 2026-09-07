import fs from "node:fs";
import path from "node:path";

type PublicPolicy = {
  RELEASE_INTEGRITY: string;
  RELEASE_PACKAGE: string;
  RELEASE_VERSION: string;
  validateArguments: (args: string[]) => void;
  validateEnvironment: (environment: NodeJS.ProcessEnv) => void;
  validateRepositoryFiles: (repositoryRoot: string) => void;
};

type SecurePackageRunner = {
  runSecurePnpm: (options: {
    args: string[];
    environment: NodeJS.ProcessEnv;
    pnpmBinary: string;
    repositoryRoot: string;
    spawn: jest.Mock;
    platform: NodeJS.Platform;
  }) => number;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const policy =
  require("../../scripts/public-package-policy.cjs") as PublicPolicy;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const runner =
  require("../../scripts/run-secure-pnpm.cjs") as SecurePackageRunner;

const repositoryRoot = process.cwd();

describe("public Coordinator package policy", () => {
  it("pins the reviewed public package without GitHub Packages", () => {
    expect(() => policy.validateRepositoryFiles(repositoryRoot)).not.toThrow();

    const manifest = JSON.parse(
      fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
    ) as { devDependencies: Record<string, string> };
    const npmrc = fs.readFileSync(path.join(repositoryRoot, ".npmrc"), "utf8");
    const lockfile = fs.readFileSync(
      path.join(repositoryRoot, "pnpm-lock.yaml"),
      "utf8"
    );

    expect(manifest.devDependencies[policy.RELEASE_PACKAGE]).toBe(
      policy.RELEASE_VERSION
    );
    expect(lockfile).toContain(policy.RELEASE_INTEGRITY);
    expect(npmrc).not.toContain("_authToken");
    expect(npmrc).not.toContain("npm.pkg.github.com");
    expect(lockfile).not.toContain("npm.pkg.github.com");
  });

  it("keeps registry and credential overrides outside package commands", () => {
    expect(() => policy.validateArguments(["install", "--registry=x"])).toThrow(
      "pnpm option is not allowed"
    );
    expect(() =>
      policy.validateArguments(["install", "--config.userconfig=x"])
    ).toThrow("pnpm option is not allowed");
    expect(() =>
      policy.validateArguments(["add", "https://packages.example/pkg.tgz"])
    ).toThrow("direct dependency source is not allowed");
    expect(() =>
      policy.validateArguments([
        "add",
        "package@https://packages.example/pkg.tgz",
      ])
    ).toThrow("direct dependency source is not allowed");
    expect(() =>
      policy.validateEnvironment({
        NODE_ENV: "test",
        npm_config_registry: "https://example.com",
      })
    ).toThrow("package environment override is not allowed");
    expect(() =>
      policy.validateEnvironment({
        NODE_ENV: "test",
        "npm_config_//registry.npmjs.org/:_authToken": "secret",
      })
    ).toThrow("package environment override is not allowed");
    expect(() =>
      policy.validateEnvironment({
        NODE_ENV: "test",
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
      })
    ).toThrow("NODE_TLS_REJECT_UNAUTHORIZED cannot disable TLS checks");
  });

  it("runs pnpm through Socket Firewall without package tokens", () => {
    const spawn = jest.fn(() => ({ status: 0 }));
    const result = runner.runSecurePnpm({
      args: ["install", "--frozen-lockfile"],
      environment: {
        NODE_ENV: "test",
        NODE_AUTH_TOKEN: "old-github-package-token",
        NPM_TOKEN: "unrelated-npm-token",
        SFW_BIN: process.execPath,
      },
      pnpmBinary: process.execPath,
      repositoryRoot,
      spawn,
      platform: process.platform,
    });

    expect(result).toBe(0);
    expect(spawn).toHaveBeenCalledTimes(1);
    const [, args, options] = spawn.mock.calls[0] as unknown as [
      string,
      string[],
      { env: NodeJS.ProcessEnv },
    ];
    expect(args).toEqual([process.execPath, "install", "--frozen-lockfile"]);
    expect(options.env).not.toHaveProperty("NODE_AUTH_TOKEN");
    expect(options.env).not.toHaveProperty("NPM_TOKEN");
    expect(options.env["SEIZE_SECURE_INSTALL"]).toBe("1");
    expect(options.env["npm_config_registry"]).toBe(
      "https://registry.npmjs.org/"
    );
    expect(options.env["npm_config_userconfig"]).toBe(
      path.join(repositoryRoot, ".npmrc")
    );
    expect(options.env["npm_config_globalconfig"]).toBe(
      path.join(repositoryRoot, ".npmrc")
    );
  });

  it("removes obsolete private-package helpers", () => {
    for (const relativePath of [
      "scripts/private-github-packages-auth.sh",
      "scripts/private-github-packages-credential.ps1",
      "scripts/private-github-packages-policy.cjs",
      "scripts/run-pnpm-with-private-github-bypass.cjs",
    ]) {
      expect(fs.existsSync(path.join(repositoryRoot, relativePath))).toBe(
        false
      );
    }
  });
});

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type PublicPolicy = {
  RELEASE_INTEGRITY: string;
  RELEASE_PACKAGE: string;
  RELEASE_VERSION: string;
  validateArguments: (args: string[]) => void;
  validateEnvironment: (environment: NodeJS.ProcessEnv) => void;
  validateLockfile: (text: string) => void;
  validatePackageJson: (text: string) => void;
  validateRepositoryFiles: (repositoryRoot: string) => void;
  validateWorkspace: (text: string) => void;
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
    for (const option of [
      "-C",
      "-g",
      "-w",
      "--filter=app",
      "--filter-prod=app",
      "--ignore-workspace",
      "--config.dangerously-allow-all-builds=true",
    ]) {
      expect(() => policy.validateArguments(["install", option])).toThrow(
        "pnpm option is not allowed"
      );
    }
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
      policy.validateArguments(["add", "package@workspace:*"])
    ).toThrow("direct dependency source is not allowed");
    expect(() =>
      policy.validateArguments(["add", "package@//packages.example/pkg.tgz"])
    ).toThrow("direct dependency source is not allowed");
    expect(() =>
      policy.validateArguments([
        "add",
        `alias@npm:${policy.RELEASE_PACKAGE}@${policy.RELEASE_VERSION}`,
      ])
    ).toThrow("direct dependency source is not allowed");
    for (const source of [
      "owner/repository",
      "./package",
      "../package.tgz",
      "package.tgz",
      "git@github.com:owner/repository.git",
      "ssh://git@github.com/owner/repository.git",
    ]) {
      expect(() => policy.validateArguments(["add", source])).toThrow(
        "direct dependency source is not allowed"
      );
    }
    expect(() =>
      policy.validateArguments(["add", "@reviewed-scope/package@1.2.3"])
    ).not.toThrow();
    for (const option of ["--latest", "-L"]) {
      expect(() => policy.validateArguments(["update", option])).toThrow(
        "pnpm option is not allowed"
      );
    }
    for (const args of [
      ["add", policy.RELEASE_PACKAGE],
      ["install", `${policy.RELEASE_PACKAGE}@${policy.RELEASE_VERSION}`],
      ["remove", policy.RELEASE_PACKAGE],
      ["update", `${policy.RELEASE_PACKAGE}@latest`],
    ]) {
      expect(() => policy.validateArguments(args)).toThrow(
        "cannot be changed by a package command"
      );
    }
    expect(() =>
      policy.validateEnvironment({
        NODE_ENV: "test",
        npm_config_registry: "https://example.com",
      })
    ).toThrow("package environment override is not allowed");
    expect(() =>
      policy.validateEnvironment({
        NODE_ENV: "test",
        npm_config_dangerously_allow_all_builds: "true",
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

  it("rejects an unreviewed package manifest", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
    ) as {
      devDependencies: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    manifest.devDependencies[policy.RELEASE_PACKAGE] =
      `^${policy.RELEASE_VERSION}`;
    expect(() => policy.validatePackageJson(JSON.stringify(manifest))).toThrow(
      `must be an exact ${policy.RELEASE_VERSION} dev dependency`
    );

    manifest.devDependencies[policy.RELEASE_PACKAGE] = policy.RELEASE_VERSION;
    manifest.peerDependencies = { [policy.RELEASE_PACKAGE]: "*" };
    expect(() => policy.validatePackageJson(JSON.stringify(manifest))).toThrow(
      "may exist only in devDependencies"
    );
  });

  it("rejects changes to the reviewed age exception", () => {
    const workspace = fs.readFileSync(
      path.join(repositoryRoot, "pnpm-workspace.yaml"),
      "utf8"
    );

    expect(() =>
      policy.validateWorkspace(
        workspace.replace(
          `"${policy.RELEASE_PACKAGE}"`,
          `"${policy.RELEASE_PACKAGE}@${policy.RELEASE_VERSION}"`
        )
      )
    ).toThrow("must contain only");
    expect(() =>
      policy.validateWorkspace(
        workspace.replace(
          `  - "${policy.RELEASE_PACKAGE}"`,
          `  - "${policy.RELEASE_PACKAGE}"\n  - "unreviewed-package"`
        )
      )
    ).toThrow("must contain only");
  });

  it("rejects changes to the reviewed lockfile resolution", () => {
    const lockfile = fs.readFileSync(
      path.join(repositoryRoot, "pnpm-lock.yaml"),
      "utf8"
    );

    expect(() =>
      policy.validateLockfile(
        lockfile.replace(policy.RELEASE_INTEGRITY, "sha512-wrong")
      )
    ).toThrow("does not pin the reviewed public package");
    expect(() =>
      policy.validateLockfile(`${lockfile}\n# npm.pkg.github.com\n`)
    ).toThrow("cannot resolve packages from GitHub Packages");
  });

  const itWithSymlinkSupport = process.platform === "win32" ? it.skip : it;

  itWithSymlinkSupport(
    "rejects repository policy files that are symlinks",
    () => {
      const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "public-package-policy-")
      );
      try {
        for (const relativePath of [
          "package.json",
          "pnpm-workspace.yaml",
          "pnpm-lock.yaml",
        ]) {
          fs.copyFileSync(
            path.join(repositoryRoot, relativePath),
            path.join(temporaryRoot, relativePath)
          );
        }
        fs.symlinkSync(
          path.join(repositoryRoot, ".npmrc"),
          path.join(temporaryRoot, ".npmrc")
        );

        expect(() => policy.validateRepositoryFiles(temporaryRoot)).toThrow(
          ".npmrc must be a regular file"
        );
      } finally {
        fs.rmSync(temporaryRoot, { recursive: true, force: true });
      }
    }
  );

  it("runs pnpm through Socket Firewall without package tokens", () => {
    const rejectedSpawn = jest.fn(() => ({ status: 0 }));
    expect(() =>
      runner.runSecurePnpm({
        args: ["install"],
        environment: {
          NODE_ENV: "test",
          npm_config_registry: "https://packages.example",
          SFW_BIN: process.execPath,
        },
        pnpmBinary: process.execPath,
        repositoryRoot,
        spawn: rejectedSpawn,
        platform: process.platform,
      })
    ).toThrow("package environment override is not allowed");
    expect(rejectedSpawn).not.toHaveBeenCalled();

    let observedConfigHome: string | undefined;
    const spawn = jest.fn(
      (
        _command: string,
        _args: string[],
        options: { env: NodeJS.ProcessEnv }
      ) => {
        observedConfigHome = options.env["XDG_CONFIG_HOME"];
        expect(observedConfigHome).toBeDefined();
        expect(fs.statSync(observedConfigHome as string).isDirectory()).toBe(
          true
        );
        return { status: 0 };
      }
    );
    const result = runner.runSecurePnpm({
      args: ["install", "--frozen-lockfile"],
      environment: {
        NODE_ENV: "test",
        NODE_AUTH_TOKEN: "old-github-package-token",
        NPM_TOKEN: "unrelated-npm-token",
        xdg_config_home: "/tmp/untrusted-pnpm-config",
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
    expect(options.env["XDG_CONFIG_HOME"]).toBe(observedConfigHome);
    expect(options.env).not.toHaveProperty("xdg_config_home");
    expect(observedConfigHome).not.toBe("/tmp/untrusted-pnpm-config");
    expect(fs.existsSync(observedConfigHome as string)).toBe(false);
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

  it("clears inherited package tokens from long-lived environments", () => {
    const codexEnvironment = fs.readFileSync(
      path.join(repositoryRoot, ".codex/environments/environment.toml"),
      "utf8"
    );
    const stagingScript = fs.readFileSync(
      path.join(repositoryRoot, "scripts/staging.sh"),
      "utf8"
    );

    expect(codexEnvironment).toContain("unset NODE_AUTH_TOKEN NPM_TOKEN");
    expect(stagingScript).toContain("unset NODE_AUTH_TOKEN NPM_TOKEN");
  });
});

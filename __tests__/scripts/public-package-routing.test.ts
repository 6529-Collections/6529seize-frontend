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
  parseSecureInvocationArguments: (args: string[]) => {
    args: string[];
    pnpmBinary: string;
    repositoryRoot: string;
  };
  quoteWindowsShellArgument: (value: string) => string;
  resolveSfwCommand: (environment: NodeJS.ProcessEnv) => string;
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
      "-r",
      "--recursive",
      "--config.dangerously-allow-all-builds=true",
      "--allow-build=unreviewed-package",
      "--global-pnpmfile=hook.cjs",
    ]) {
      expect(() => policy.validateArguments(["install", option])).toThrow(
        "pnpm option is not allowed"
      );
    }
    for (const option of [
      "-Dg",
      "-Dr",
      "--rec",
      "--dangerously-allow-all-b=true",
    ]) {
      expect(() =>
        policy.validateArguments(["add", option, "package"])
      ).toThrow("pnpm option is not allowed");
    }
    expect(() =>
      policy.validateArguments(["add", "-D", "package"])
    ).not.toThrow();
    expect(() =>
      policy.validateArguments(["install", "--frozen-lockfile", "--prod"])
    ).not.toThrow();
    expect(() => policy.validateArguments(["audit", "--fix"])).not.toThrow();
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
        npm_config_global_pnpmfile: "/tmp/hook.cjs",
      })
    ).toThrow("package environment override is not allowed");
    expect(() =>
      policy.validateEnvironment({
        NODE_ENV: "test",
        npm_config_store_dir: "relative-store",
      })
    ).toThrow("package store directory must be absolute");
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

    delete manifest.peerDependencies;
    const manifestWithPnpm = {
      ...manifest,
      pnpm: { configDependencies: { "hook-package": "1.0.0" } },
    };
    expect(() =>
      policy.validatePackageJson(JSON.stringify(manifestWithPnpm))
    ).toThrow("package.json pnpm settings are not allowed");

    const manifestWithDependenciesMeta = {
      ...manifest,
      dependenciesMeta: { "unreviewed-package": { built: true } },
    };
    expect(() =>
      policy.validatePackageJson(JSON.stringify(manifestWithDependenciesMeta))
    ).toThrow("package.json dependency build settings are not allowed");

    const manifestWithAlias = {
      ...manifest,
      dependencies: {
        "coordinator-next": `npm:${policy.RELEASE_PACKAGE}@0.0.5`,
      },
    };
    expect(() =>
      policy.validatePackageJson(JSON.stringify(manifestWithAlias))
    ).toThrow("cannot be referenced through another dependency");

    const manifestWithDirectSource = {
      ...manifest,
      dependencies: {
        sharp: "https://example.invalid/sharp.tgz",
      },
    };
    expect(() =>
      policy.validatePackageJson(JSON.stringify(manifestWithDirectSource))
    ).toThrow("package.json direct dependency source is not allowed: sharp");
  });

  it("rejects changes to the reviewed age exception", () => {
    const workspace = fs.readFileSync(
      path.join(repositoryRoot, "pnpm-workspace.yaml"),
      "utf8"
    );

    expect(() =>
      policy.validateWorkspace(
        workspace.replace(
          `"${policy.RELEASE_PACKAGE}@${policy.RELEASE_VERSION}"`,
          `"${policy.RELEASE_PACKAGE}"`
        )
      )
    ).toThrow("must contain only");
    expect(() =>
      policy.validateWorkspace(
        workspace.replace(
          `"${policy.RELEASE_PACKAGE}@${policy.RELEASE_VERSION}"`,
          `"${policy.RELEASE_PACKAGE}@0.0.5"`
        )
      )
    ).toThrow("must contain only");
    expect(() =>
      policy.validateWorkspace(`${workspace}\nregistry: https://example.com\n`)
    ).toThrow("setting is not allowed: registry");
    expect(() =>
      policy.validateWorkspace(
        `${workspace}\n"registries":\n  reviewed: https://example.com\n`
      )
    ).toThrow("setting is not allowed: registries");
    expect(() =>
      policy.validateWorkspace(`${workspace}\nglobalPnpmfile: ./hook.cjs\n`)
    ).toThrow("setting is not allowed: globalPnpmfile");
    for (const escapedSetting of [
      '"reg\\u0069stry": https://example.com',
      '"dangerouslyAllowAllBu\\u0069lds": true',
    ]) {
      expect(() =>
        policy.validateWorkspace(`${workspace}\n${escapedSetting}\n`)
      ).toThrow("quoted top-level keys cannot contain escapes");
    }
    for (const setting of [
      "configDependencies:\n  hook-package: 1.0.0",
      "dangerouslyAllowAllBuilds: true",
      "packages:\n  - .deepsec",
      "onlyBuiltDependencies:\n  - unreviewed-package",
      "ignoredBuiltDependencies:\n  - unreviewed-package",
    ]) {
      expect(() =>
        policy.validateWorkspace(`${workspace}\n${setting}\n`)
      ).toThrow("setting is not allowed");
    }
    expect(() =>
      policy.validateWorkspace(
        workspace.replace("  sharp: true", "  unreviewed-package: true")
      )
    ).toThrow("allowBuilds must contain only approved packages");
    expect(() =>
      policy.validateWorkspace(
        workspace.replace(
          "overrides:\n",
          `overrides:\n  "${policy.RELEASE_PACKAGE}": "0.0.5"\n`
        )
      )
    ).toThrow("cannot be changed by overrides");
    expect(() =>
      policy.validateWorkspace(
        workspace.replace(
          "overrides:\n",
          "overrides:\n  sharp: https://example.invalid/sharp.tgz\n"
        )
      )
    ).toThrow("overrides must use registry package versions only");
    expect(() =>
      policy.validateWorkspace(
        workspace.replace("overrides:\n", "overrides:\n  <<: *defaults\n")
      )
    ).toThrow("overrides must use registry package versions only");
    expect(() =>
      policy.validateWorkspace(
        workspace.replace(
          `  - "${policy.RELEASE_PACKAGE}@${policy.RELEASE_VERSION}"`,
          `  - "${policy.RELEASE_PACKAGE}@${policy.RELEASE_VERSION}"\n  - "unreviewed-package"`
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
    expect(() =>
      policy.validateLockfile(
        `${lockfile}\n# npm:${policy.RELEASE_PACKAGE}@0.0.5\n`
      )
    ).toThrow("references an unreviewed package version");
    expect(() =>
      policy.validateLockfile(
        `${lockfile}\n  malicious@1.0.0:\n    resolution: {integrity: sha512-safe, tarball: https://packages.example/malicious.tgz}\n`
      )
    ).toThrow("cannot resolve a non-public tarball");
    expect(() =>
      policy.validateLockfile(
        `${lockfile}\n  malicious@1.0.0:\n    resolution: {repo: https://example.com/repository.git, commit: abc123}\n`
      )
    ).toThrow("unsupported package resolution");
    expect(() =>
      policy.validateLockfile(
        `${lockfile}\n  malicious@1.0.0:\n    "resolution": {integrity: sha512-safe, tarball: https://example.invalid/sharp.tgz}\n`
      )
    ).toThrow("unsupported package resolution");
    expect(() =>
      policy.validateLockfile(
        `${lockfile}\n  malicious@1.0.0:\n    "resol\\u0075tion": {integrity: sha512-safe, tarball: https://example.invalid/sharp.tgz}\n`
      )
    ).toThrow("escape sequences are not supported");
    expect(() =>
      policy.validateLockfile(
        `${lockfile}\n  "@6529-collections/release-reque\\u0073t@0.0.5":\n    resolution: {integrity: sha512-unreviewed}\n`
      )
    ).toThrow("escape sequences are not supported");
    expect(() =>
      policy.validateLockfile(
        `${lockfile}\n  malicious@1.0.0:\n    resolution:\n      integrity: sha512-safe\n`
      )
    ).toThrow("unsupported package resolution");
    expect(() =>
      policy.validateLockfile(
        `${lockfile}\n  malicious@1.0.0:\n    resolution: &source {integrity: sha512-safe}\n  copy@1.0.0:\n    resolution: *source\n`
      )
    ).toThrow("aliases and merge keys are not supported");
    expect(() =>
      policy.validateLockfile(
        `${lockfile}\n# "resolution": ignored\n# "resol\\u0075tion": ignored\n`
      )
    ).not.toThrow();
  });

  it("checks parsed Coordinator lockfile nodes instead of YAML block text", () => {
    const lockfile = fs.readFileSync(
      path.join(repositoryRoot, "pnpm-lock.yaml"),
      "utf8"
    );
    const packageKey = `'${policy.RELEASE_PACKAGE}@${policy.RELEASE_VERSION}'`;
    const tampered = lockfile
      .replace(
        `'${policy.RELEASE_PACKAGE}':\n        specifier: ${policy.RELEASE_VERSION}\n        version: ${policy.RELEASE_VERSION}`,
        `'${policy.RELEASE_PACKAGE}':\n        specifier: 0.0.5\n        version: 0.0.5`
      )
      .replace(
        `${packageKey}:\n    resolution: {integrity: ${policy.RELEASE_INTEGRITY}}`,
        `${packageKey}:\n    resolution: {integrity: sha512-wrong, tarball: https://registry.npmjs.org/other/-/other-1.0.0.tgz}`
      )
      .replace(
        `${packageKey}:\n    dependencies:`,
        `${packageKey}:\n    dependencies:\n      ajv: 8.20.0\n      ajv-formats: 3.0.1(ajv@8.20.0)\n      unreviewed: 1.0.0\n\ncoordinator-importer-decoy: |-\n  '${policy.RELEASE_PACKAGE}':\n        specifier: ${policy.RELEASE_VERSION}\n        version: ${policy.RELEASE_VERSION}\ncoordinator-package-decoy: |-\n  ${packageKey}:\n    resolution: {integrity: ${policy.RELEASE_INTEGRITY}}\ncoordinator-snapshot-decoy: |-\n  ${packageKey}:\n    dependencies:`
      );

    expect(() => policy.validateLockfile(tampered)).toThrow(
      "does not pin the reviewed public package"
    );
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

  it("rejects project pnpm hook files", () => {
    const temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "public-package-policy-")
    );
    try {
      for (const relativePath of [
        ".npmrc",
        "package.json",
        "pnpm-workspace.yaml",
        "pnpm-lock.yaml",
      ]) {
        fs.copyFileSync(
          path.join(repositoryRoot, relativePath),
          path.join(temporaryRoot, relativePath)
        );
      }
      fs.writeFileSync(
        path.join(temporaryRoot, ".pnpmfile.cjs"),
        "module.exports = {};\n"
      );

      expect(() => policy.validateRepositoryFiles(temporaryRoot)).toThrow(
        ".pnpmfile.cjs is not allowed"
      );
    } finally {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("rejects an npm lockfile before a package command starts", () => {
    const temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "public-package-policy-")
    );
    try {
      for (const relativePath of [
        ".npmrc",
        "package.json",
        "pnpm-workspace.yaml",
        "pnpm-lock.yaml",
      ]) {
        fs.copyFileSync(
          path.join(repositoryRoot, relativePath),
          path.join(temporaryRoot, relativePath)
        );
      }
      fs.writeFileSync(path.join(temporaryRoot, "package-lock.json"), "{}\n");

      expect(() => policy.validateRepositoryFiles(temporaryRoot)).toThrow(
        "package-lock.json is not allowed"
      );
    } finally {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

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
        npm_config_store_dir: path.join(repositoryRoot, ".pnpm-store"),
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
    expect(options.env["npm_config_store_dir"]).toBe(
      path.join(repositoryRoot, ".pnpm-store")
    );
    expect(options.env).not.toHaveProperty("xdg_config_home");
    expect(observedConfigHome).not.toBe("/tmp/untrusted-pnpm-config");
    expect(fs.existsSync(observedConfigHome as string)).toBe(false);
  });

  it("keeps supported package commands and platform boundaries explicit", () => {
    for (const args of [
      ["install", "--frozen-lockfile"],
      ["install", "--frozen-lockfile", "--prod"],
      ["add", "-D", "reviewed-package@1.0.0"],
      ["remove", "reviewed-package"],
      ["update", "reviewed-package"],
      ["audit"],
      ["audit", "--fix"],
    ]) {
      expect(() => policy.validateArguments(args)).not.toThrow();
    }

    const invocation = runner.parseSecureInvocationArguments([
      "--seize-secure-repository-root",
      repositoryRoot,
      "--seize-secure-pnpm-binary",
      process.execPath,
      "--",
      "install",
      "--frozen-lockfile",
    ]);
    expect(invocation).toEqual({
      args: ["install", "--frozen-lockfile"],
      pnpmBinary: fs.realpathSync(process.execPath),
      repositoryRoot: fs.realpathSync(repositoryRoot),
    });

    const windowsSpawn = jest.fn(() => ({ status: 19 }));
    expect(
      runner.runSecurePnpm({
        args: ["install", "--frozen-lockfile"],
        environment: { NODE_ENV: "test", SFW_BIN: process.execPath },
        pnpmBinary: process.execPath,
        repositoryRoot,
        spawn: windowsSpawn,
        platform: "win32",
      })
    ).toBe(19);
    expect(windowsSpawn).toHaveBeenCalledWith(
      `"${process.execPath}"`,
      [
        `"${fs.realpathSync(process.execPath)}"`,
        '"install"',
        '"--frozen-lockfile"',
      ],
      expect.objectContaining({ shell: true })
    );
    expect(() => runner.quoteWindowsShellArgument("bad%PATH%")).toThrow(
      "cannot contain shell expansion characters"
    );
    expect(() =>
      runner.resolveSfwCommand({
        NODE_ENV: "test",
        SFW_BIN: path.join(repositoryRoot, "missing-sfw"),
      })
    ).toThrow("SFW_BIN does not exist");
  });

  it("rejects an invalid repository state produced by a package command", () => {
    const temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "public-package-policy-")
    );
    try {
      for (const relativePath of [
        ".npmrc",
        "package.json",
        "pnpm-workspace.yaml",
        "pnpm-lock.yaml",
      ]) {
        fs.copyFileSync(
          path.join(repositoryRoot, relativePath),
          path.join(temporaryRoot, relativePath)
        );
      }
      const spawn = jest.fn(() => {
        fs.appendFileSync(
          path.join(temporaryRoot, "pnpm-workspace.yaml"),
          "\nregistry: https://example.invalid\n"
        );
        return { status: 0 };
      });

      expect(() =>
        runner.runSecurePnpm({
          args: ["update"],
          environment: { NODE_ENV: "test", SFW_BIN: process.execPath },
          pnpmBinary: process.execPath,
          repositoryRoot: temporaryRoot,
          spawn,
          platform: process.platform,
        })
      ).toThrow("setting is not allowed: registry");
      expect(spawn).toHaveBeenCalledTimes(1);
    } finally {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
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

  it("keeps policy loading and build approvals fail-closed", () => {
    const policySource = fs.readFileSync(
      path.join(repositoryRoot, "scripts/public-package-policy.cjs"),
      "utf8"
    );
    const dependencies = [
      ...policySource.matchAll(/require\("([^"]+)"\)/g),
    ].map((match) => match[1]);
    expect(dependencies).toEqual(["node:fs", "node:path"]);

    const wrapper = fs.readFileSync(
      path.join(repositoryRoot, "bin/6529"),
      "utf8"
    );
    expect(wrapper).not.toContain('exec "$REAL_PNPM" approve-builds');
    expect(wrapper).toContain("Build approvals require a reviewed change");

    for (const relativePath of [
      "README.md",
      "ops/docs/developer/pnpm-and-socket-firewall.md",
    ]) {
      expect(
        fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8")
      ).not.toContain("6529 approve-builds");
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
    const ec2StagingScript = fs.readFileSync(
      path.join(repositoryRoot, "dev-setup/run-staging-ec2-setup.sh"),
      "utf8"
    );

    expect(codexEnvironment).toContain("unset NODE_AUTH_TOKEN NPM_TOKEN");
    expect(stagingScript).toContain("unset NODE_AUTH_TOKEN NPM_TOKEN");
    expect(ec2StagingScript).toContain("unset NODE_AUTH_TOKEN NPM_TOKEN");
    expect(stagingScript).toContain("./bin/6529 ci");
    expect(ec2StagingScript).toContain("./bin/6529 ci");
  });
});

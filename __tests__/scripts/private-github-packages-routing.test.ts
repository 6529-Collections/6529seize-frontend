import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse as parseYaml } from "yaml";

type Environment = {
  HTTP_PROXY?: string;
  HTTPS_PROXY?: string;
  NODE_AUTH_TOKEN?: string;
  NODE_EXTRA_CA_CERTS?: string;
  NO_PROXY?: string;
  PATH?: string | undefined;
  SSL_CERT_DIR?: string;
  SSL_CERT_FILE?: string;
  http_proxy?: string;
  https_proxy?: string;
  no_proxy?: string;
  npm_config_globalconfig?: string;
  npm_config_npm_globalconfig?: string;
  [key: string]: string | undefined;
};

type PolicyModule = {
  ALLOWED_INTEGRITY: string;
  ALLOWED_PACKAGE_NAME: string;
  ALLOWED_PACKAGE_SPEC: string;
  ALLOWED_PACKAGE_VERSION: string;
  ALLOWED_REGISTRY_HOST: string;
  ALLOWED_REGISTRY_ORIGIN: string;
  ALLOWED_SCOPE: string;
  ALLOWED_TARBALL_URL: string;
  AUTH_KEY: string;
  AUTH_PLACEHOLDER: string;
  PUBLIC_REGISTRY_ORIGIN: string;
  SCOPE_REGISTRY_KEY: string;
  validateAuthEnvironment: (environment: Environment) => void;
  validateLockfile: (lockfileText: string) => void;
  validateNpmrc: (npmrcText: string) => void;
  validatePackageJson: (packageJsonText: string) => void;
  validatePnpmArguments: (args: string[]) => void;
  validatePnpmConfigEnvironment: (environment: Environment) => void;
  validateWorkspace: (workspaceText: string) => void;
};

type RoutingModule = {
  AUTHENTICATED_PNPM_ARGUMENTS: string[];
  ROUTED_NO_PROXY: string;
  TOKEN_FREE_REBUILD_ARGUMENTS: string[];
  TOKEN_FREE_REBUILD_PACKAGES: string[];
  TOKEN_FREE_ROOT_REBUILD_ARGUMENTS: string[];
  createRoutedEnvironment: (environment: Environment) => Environment;
  isLoopbackProxy: (proxyValue: unknown) => boolean;
  parseNoProxy: (value: string | undefined) => string[];
  runPnpm: (options: {
    args: string[];
    environment: Environment;
    repositoryRoot: string;
    spawn: jest.Mock;
  }) => number;
  validateSocketEnvironment: (environment: Environment) => void;
};

type SecureRunnerModule = {
  ROUTING_HELPER_PATH: string;
  runSecurePnpm: (options: {
    args: string[];
    environment: Environment;
    platform?: NodeJS.Platform;
    repositoryRoot: string;
    spawn: jest.Mock;
  }) => number;
  quoteWindowsShellArgument: (value: string) => string;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const policy =
  require("../../scripts/private-github-packages-policy.cjs") as PolicyModule;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const routing =
  require("../../scripts/run-pnpm-with-private-github-bypass.cjs") as RoutingModule;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const secureRunner =
  require("../../scripts/run-secure-pnpm.cjs") as SecureRunnerModule;

const REPOSITORY_ROOT = process.cwd();
const TEST_TOKEN = "read-only-test-token";

function validNpmrc() {
  return [
    "save-exact=true",
    "allow-git=none",
    `${policy.SCOPE_REGISTRY_KEY}=${policy.ALLOWED_REGISTRY_ORIGIN}`,
    `${policy.AUTH_KEY}=${policy.AUTH_PLACEHOLDER}`,
    "",
  ].join("\n");
}

function validPackageJson() {
  return JSON.stringify({
    private: true,
    devDependencies: {
      [policy.ALLOWED_PACKAGE_NAME]: policy.ALLOWED_PACKAGE_VERSION,
    },
  });
}

function validLockfile() {
  return [
    "lockfileVersion: '9.0'",
    "",
    "importers:",
    "",
    "  .:",
    "    devDependencies:",
    `      '${policy.ALLOWED_PACKAGE_NAME}':`,
    `        specifier: ${policy.ALLOWED_PACKAGE_VERSION}`,
    `        version: ${policy.ALLOWED_PACKAGE_VERSION}`,
    "",
    "packages:",
    "",
    `  '${policy.ALLOWED_PACKAGE_SPEC}':`,
    `    resolution: {integrity: ${policy.ALLOWED_INTEGRITY}, tarball: ${policy.ALLOWED_TARBALL_URL}}`,
    "",
    "snapshots:",
    "",
    `  '${policy.ALLOWED_PACKAGE_SPEC}': {}`,
    "",
  ].join("\n");
}

function validWorkspace() {
  return [
    "minimumReleaseAge: 10080",
    "minimumReleaseAgeExclude:",
    `  - "${policy.ALLOWED_PACKAGE_SPEC}"`,
    "",
  ].join("\n");
}

function socketEnvironment(caPath: string): Environment {
  const proxy = "http://127.0.0.1:43129";
  return {
    NODE_AUTH_TOKEN: TEST_TOKEN,
    NODE_EXTRA_CA_CERTS: caPath,
    HTTPS_PROXY: proxy,
    HTTP_PROXY: proxy,
    https_proxy: proxy,
    http_proxy: proxy,
    NO_PROXY: "localhost,127.0.0.1,::1",
    no_proxy: "localhost,127.0.0.1,::1",
    SSL_CERT_FILE: caPath,
    SSL_CERT_DIR: path.dirname(caPath),
    npm_config_npm_globalconfig: "/generated/by/pnpm",
    npm_config_globalconfig: "/generated/by/socket",
  };
}

describe("private GitHub Packages repository policy", () => {
  it("loads before node_modules exists by using only Node built-ins", () => {
    const policySource = fs.readFileSync(
      path.join(
        REPOSITORY_ROOT,
        "scripts",
        "private-github-packages-policy.cjs"
      ),
      "utf8"
    );
    const requiredModules = [
      ...policySource.matchAll(/require\(["']([^"']+)["']\)/g),
    ].map((match) => match[1]);

    expect(requiredModules).toEqual(["node:fs", "node:path"]);
  });

  it("accepts only the exact scope, host, package, version, and lock integrity", () => {
    expect(() => policy.validateNpmrc(validNpmrc())).not.toThrow();
    expect(() => policy.validatePackageJson(validPackageJson())).not.toThrow();
    expect(() => policy.validateLockfile(validLockfile())).not.toThrow();
    expect(() => policy.validateWorkspace(validWorkspace())).not.toThrow();
    expect(() =>
      policy.validatePnpmArguments(["add", "-D", policy.ALLOWED_PACKAGE_SPEC])
    ).not.toThrow();
  });

  it("fails closed when NODE_AUTH_TOKEN is missing or malformed", () => {
    expect(() => policy.validateAuthEnvironment({})).toThrow(
      "NODE_AUTH_TOKEN is required"
    );
    expect(() =>
      policy.validateAuthEnvironment({ NODE_AUTH_TOKEN: `${TEST_TOKEN}\n` })
    ).toThrow("NODE_AUTH_TOKEN has an invalid value");
  });

  it("rejects a wrong registry host", () => {
    const npmrc = validNpmrc().replace(
      policy.ALLOWED_REGISTRY_ORIGIN,
      "https://packages.example.invalid"
    );
    expect(() => policy.validateNpmrc(npmrc)).toThrow(
      `${policy.SCOPE_REGISTRY_KEY} must equal ${policy.ALLOWED_REGISTRY_ORIGIN}`
    );
  });

  it("rejects another scope mapped to the allowed host", () => {
    const npmrc = `${validNpmrc()}@another-scope:registry=${policy.ALLOWED_REGISTRY_ORIGIN}\n`;
    expect(() => policy.validateNpmrc(npmrc)).toThrow(
      `only ${policy.SCOPE_REGISTRY_KEY} and ${policy.AUTH_KEY}`
    );
  });

  it("rejects using NODE_AUTH_TOKEN for another host", () => {
    const npmrc = `${validNpmrc()}//packages.example.invalid/:_authToken=${policy.AUTH_PLACEHOLDER}\n`;
    expect(() => policy.validateNpmrc(npmrc)).toThrow(
      "NODE_AUTH_TOKEN may only authenticate npm.pkg.github.com"
    );
  });

  it("rejects another private package or a version change", () => {
    const extraPackage = JSON.stringify({
      devDependencies: {
        [policy.ALLOWED_PACKAGE_NAME]: policy.ALLOWED_PACKAGE_VERSION,
        [`${policy.ALLOWED_SCOPE}/another-package`]: "0.0.1",
      },
    });
    expect(() => policy.validatePackageJson(extraPackage)).toThrow(
      "cannot extend the @6529-collections private-registry bypass"
    );

    const changedVersion = validPackageJson().replace(
      policy.ALLOWED_PACKAGE_VERSION,
      "0.0.2"
    );
    expect(() => policy.validatePackageJson(changedVersion)).toThrow(
      "must be an exact 0.0.1 devDependency"
    );
  });

  it("checks dependency fields without rejecting unrelated package text", () => {
    const packageJson = JSON.parse(validPackageJson()) as Record<
      string,
      unknown
    >;
    packageJson["description"] =
      "Documentation may mention @6529-collections/another-package.";
    expect(() =>
      policy.validatePackageJson(JSON.stringify(packageJson))
    ).not.toThrow();

    packageJson["dependencies"] = {
      external: `${policy.ALLOWED_TARBALL_URL}/unexpected`,
    };
    expect(() =>
      policy.validatePackageJson(JSON.stringify(packageJson))
    ).toThrow("dependency specs cannot contain GitHub Packages URLs");
  });

  it("rejects lockfile integrity, tarball, and package extensions", () => {
    expect(() =>
      policy.validateLockfile(
        validLockfile().replace(policy.ALLOWED_INTEGRITY, "sha512-changed")
      )
    ).toThrow("must keep its exact tarball and integrity");

    expect(() =>
      policy.validateLockfile(
        validLockfile().replaceAll("release-request", "another-package")
      )
    ).toThrow("cannot extend the @6529-collections lockfile scope");

    const commentSpoof = validLockfile().replace(
      `    resolution: {integrity: ${policy.ALLOWED_INTEGRITY}, tarball: ${policy.ALLOWED_TARBALL_URL}}`,
      [
        `    # resolution: {integrity: ${policy.ALLOWED_INTEGRITY}, tarball: ${policy.ALLOWED_TARBALL_URL}}`,
        "    resolution: {integrity: sha512-changed, tarball: https://registry.npmjs.org/release-request/-/release-request-0.0.1.tgz}",
      ].join("\n")
    );
    expect(() => policy.validateLockfile(commentSpoof)).toThrow(
      "must keep its exact tarball and integrity"
    );
  });

  it("rejects CLI attempts to change routing or extend the package bypass", () => {
    expect(() =>
      policy.validatePnpmArguments([
        "add",
        `${policy.ALLOWED_SCOPE}/another-package@0.0.1`,
      ])
    ).toThrow("cannot extend or update the private package bypass");
    expect(() =>
      policy.validatePnpmArguments([
        "install",
        "--registry=https://example.com",
      ])
    ).toThrow("registry, credential, proxy, and TLS overrides are not allowed");
    expect(() =>
      policy.validatePnpmArguments([
        "install",
        "--config.userConfig=/tmp/alternate-npmrc",
      ])
    ).toThrow("registry, credential, proxy, and TLS overrides are not allowed");
    expect(() =>
      policy.validatePnpmArguments([
        "install",
        "--auth-token=must-not-be-an-argument",
      ])
    ).toThrow("registry, credential, proxy, and TLS overrides are not allowed");
    expect(() =>
      policy.validatePnpmArguments(["install", "--no-strict-ssl"])
    ).toThrow("registry, credential, proxy, and TLS overrides are not allowed");
    expect(() =>
      policy.validatePnpmArguments(["install", "--no-proxy"])
    ).toThrow("registry, credential, proxy, and TLS overrides are not allowed");
    expect(() =>
      policy.validatePnpmArguments(["install", "--ignore-scripts=false"])
    ).toThrow("registry, credential, proxy, and TLS overrides are not allowed");
    expect(() =>
      policy.validatePnpmArguments([
        "add",
        `${policy.ALLOWED_REGISTRY_ORIGIN}/download/package.tgz`,
      ])
    ).toThrow("URLs cannot be supplied on the command line");
  });

  it("accepts only pnpm's exact generated scoped-registry environment", () => {
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config__6529_collections_registry: policy.ALLOWED_REGISTRY_ORIGIN,
      })
    ).not.toThrow();
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config__6529_collections_registry:
          "https://packages.example.invalid",
      })
    ).toThrow("must equal the committed https://npm.pkg.github.com");
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config_registry: policy.PUBLIC_REGISTRY_ORIGIN,
      })
    ).not.toThrow();
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config_registry: "https://registry.npmjs.org",
      })
    ).not.toThrow();
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config_registry: "https://packages.example.invalid",
      })
    ).toThrow("must equal the default https://registry.npmjs.org/");
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config__jsr_registry: "https://npm.jsr.io/",
      })
    ).not.toThrow();
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config_npm_globalconfig: "/generated/by/pnpm",
      })
    ).not.toThrow();
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config__another_scope_registry: policy.ALLOWED_REGISTRY_ORIGIN,
      })
    ).toThrow("cannot extend npm.pkg.github.com to another scope");
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config_strict_ssl: "false",
      })
    ).toThrow("pnpm network override environment is not allowed");
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config_ignore_scripts: "false",
      })
    ).toThrow("pnpm lifecycle-script override environment is not allowed");
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config__auth_token: "another-token",
      })
    ).toThrow("only NODE_AUTH_TOKEN may supply package credentials");
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
      })
    ).toThrow("cannot disable TLS verification");
  });
});

describe("host-specific Socket Firewall routing", () => {
  let temporaryDirectory: string;
  let socketCaPath: string;

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "private-github-routing-")
    );
    socketCaPath = path.join(temporaryDirectory, "socket-ca.pem");
    fs.writeFileSync(socketCaPath, "test CA fixture");
  });

  afterEach(() => {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it("keeps public hosts on Socket and bypasses only npm.pkg.github.com", () => {
    const environment = socketEnvironment(socketCaPath);
    const routed = routing.createRoutedEnvironment(environment);

    expect(routed.HTTPS_PROXY).toBe(environment.HTTPS_PROXY);
    expect(routed.HTTP_PROXY).toBe(environment.HTTP_PROXY);
    expect(routing.parseNoProxy(routed.NO_PROXY)).toEqual([
      "localhost",
      "127.0.0.1",
      "::1",
      policy.ALLOWED_REGISTRY_HOST,
    ]);
    expect(routing.parseNoProxy(routed.NO_PROXY)).not.toContain(
      "registry.npmjs.org"
    );
    expect(routing.parseNoProxy(routed.NO_PROXY)).not.toContain(
      `subdomain.${policy.ALLOWED_REGISTRY_HOST}`
    );
    expect(routed.NODE_EXTRA_CA_CERTS).toBe(socketCaPath);
    expect(routed.SSL_CERT_FILE).toBeUndefined();
    expect(routed.SSL_CERT_DIR).toBeUndefined();
    expect(routed.npm_config_npm_globalconfig).toBeUndefined();
    expect(routed.npm_config_globalconfig).toBeUndefined();
  });

  it("removes mixed-case pnpm CA and global config overrides", () => {
    const environment = socketEnvironment(socketCaPath);
    environment["npm_config_GlobalConfig"] = "/tmp/alternate-globalconfig";
    environment["NpM_CoNfIg_CaFiLe"] = "/tmp/alternate-ca";
    environment["npm_config_store_dir"] = "/tmp/pnpm-store";

    const routed = routing.createRoutedEnvironment(environment);

    expect(routed["npm_config_GlobalConfig"]).toBeUndefined();
    expect(routed["NpM_CoNfIg_CaFiLe"]).toBeUndefined();
    expect(routed["npm_config_store_dir"]).toBe("/tmp/pnpm-store");
  });

  it("rejects a non-loopback Socket proxy or a pre-existing broad bypass", () => {
    const nonLoopback = socketEnvironment(socketCaPath);
    nonLoopback.HTTPS_PROXY = "http://proxy.example.com:8080";
    nonLoopback.HTTP_PROXY = nonLoopback.HTTPS_PROXY;
    nonLoopback.https_proxy = nonLoopback.HTTPS_PROXY;
    nonLoopback.http_proxy = nonLoopback.HTTPS_PROXY;
    expect(() => routing.validateSocketEnvironment(nonLoopback)).toThrow(
      "Socket Firewall must provide a loopback HTTP proxy"
    );

    const broadBypass = socketEnvironment(socketCaPath);
    broadBypass.NO_PROXY = "localhost,registry.npmjs.org";
    expect(() => routing.validateSocketEnvironment(broadBypass)).toThrow(
      "loopback-only NO_PROXY"
    );
  });

  it("requires the Socket CA and accepts only loopback proxy URLs", () => {
    expect(routing.isLoopbackProxy("http://127.0.0.1:43129")).toBe(true);
    expect(routing.isLoopbackProxy("https://127.0.0.1:43129")).toBe(false);
    expect(routing.isLoopbackProxy("http://localhost:43129")).toBe(false);

    const missingCa = socketEnvironment(
      path.join(temporaryDirectory, "missing.pem")
    );
    expect(() => routing.validateSocketEnvironment(missingCa)).toThrow(
      "Socket Firewall must provide its CA as an extra Node root"
    );
  });

  it("uses auth only while scripts are disabled, then rebuilds token-free", () => {
    const spawn = jest.fn(() => ({ status: 0 }));
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const environment = socketEnvironment(socketCaPath);

    expect(
      routing.runPnpm({
        args: ["install", "--frozen-lockfile"],
        environment,
        repositoryRoot: REPOSITORY_ROOT,
        spawn,
      })
    ).toBe(0);

    expect(spawn).toHaveBeenNthCalledWith(
      1,
      "pnpm",
      [
        "install",
        "--frozen-lockfile",
        ...routing.AUTHENTICATED_PNPM_ARGUMENTS,
      ],
      expect.objectContaining({
        env: expect.objectContaining({ NODE_AUTH_TOKEN: TEST_TOKEN }),
      })
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      routing.TOKEN_FREE_REBUILD_ARGUMENTS,
      expect.objectContaining({
        env: expect.not.objectContaining({ NODE_AUTH_TOKEN: expect.anything() }),
      })
    );
    expect(spawn).toHaveBeenNthCalledWith(
      3,
      "pnpm",
      routing.TOKEN_FREE_ROOT_REBUILD_ARGUMENTS,
      expect.objectContaining({
        env: expect.not.objectContaining({ NODE_AUTH_TOKEN: expect.anything() }),
      })
    );
    expect(spawn).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(spawn.mock.calls[0]?.slice(0, 2))).not.toContain(
      TEST_TOKEN
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(TEST_TOKEN);
  });

  it("rebuilds exactly the workspace-approved packages without auth", () => {
    const workspace = parseYaml(
      fs.readFileSync(path.join(REPOSITORY_ROOT, "pnpm-workspace.yaml"), "utf8")
    ) as { allowBuilds?: Record<string, boolean> };
    const approvedPackages = Object.entries(workspace.allowBuilds ?? {})
      .filter(([, allowed]) => allowed)
      .map(([packageName]) => packageName);

    expect(routing.TOKEN_FREE_REBUILD_PACKAGES).toEqual(approvedPackages);
    expect(routing.TOKEN_FREE_REBUILD_ARGUMENTS).toEqual([
      "rebuild",
      ...approvedPackages,
    ]);
    expect(routing.TOKEN_FREE_ROOT_REBUILD_ARGUMENTS).toEqual([
      "rebuild",
      "--pending",
    ]);
  });

  it("does not run lifecycle scripts when the authenticated phase fails", () => {
    const spawn = jest.fn(() => ({ status: 1 }));

    expect(
      routing.runPnpm({
        args: ["install", "--frozen-lockfile"],
        environment: socketEnvironment(socketCaPath),
        repositoryRoot: REPOSITORY_ROOT,
        spawn,
      })
    ).toBe(1);
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it("launches the routing helper inside Socket Firewall", () => {
    const spawn = jest.fn(() => ({ status: 0 }));
    const environment = {
      PATH: process.env["PATH"],
      NODE_AUTH_TOKEN: TEST_TOKEN,
    };

    expect(
      secureRunner.runSecurePnpm({
        args: ["install", "--frozen-lockfile"],
        environment,
        repositoryRoot: REPOSITORY_ROOT,
        spawn,
      })
    ).toBe(0);

    expect(spawn).toHaveBeenCalledWith(
      "sfw",
      [
        process.execPath,
        secureRunner.ROUTING_HELPER_PATH,
        "install",
        "--frozen-lockfile",
      ],
      expect.objectContaining({
        env: expect.objectContaining({
          NODE_AUTH_TOKEN: TEST_TOKEN,
          SEIZE_SECURE_INSTALL: "1",
        }),
      })
    );
    expect(JSON.stringify(spawn.mock.calls[0]?.slice(0, 2))).not.toContain(
      TEST_TOKEN
    );
  });

  it("quotes every Windows shell path and argument", () => {
    const spawn = jest.fn(() => ({ status: 0 }));
    const environment = {
      PATH: process.env["PATH"],
      NODE_AUTH_TOKEN: TEST_TOKEN,
    };

    expect(
      secureRunner.runSecurePnpm({
        args: ["install", "--frozen-lockfile"],
        environment,
        platform: "win32",
        repositoryRoot: REPOSITORY_ROOT,
        spawn,
      })
    ).toBe(0);

    expect(spawn).toHaveBeenCalledWith(
      '"sfw"',
      [
        process.execPath,
        secureRunner.ROUTING_HELPER_PATH,
        "install",
        "--frozen-lockfile",
      ].map(secureRunner.quoteWindowsShellArgument),
      expect.objectContaining({ shell: true })
    );
    expect(() =>
      secureRunner.quoteWindowsShellArgument("unsafe%PATH%")
    ).toThrow("shell expansion characters");
  });
});

describe("GitHub Actions package access", () => {
  it("keeps package auth, Socket routing, and fork handling narrow", () => {
    const workflowDirectory = path.join(REPOSITORY_ROOT, ".github/workflows");
    const workflowFiles = fs
      .readdirSync(workflowDirectory)
      .filter((file) => /\.ya?ml$/.test(file));
    let installJobCount = 0;

    for (const workflowFile of workflowFiles) {
      const workflow = parseYaml(
        fs.readFileSync(path.join(workflowDirectory, workflowFile), "utf8")
      ) as {
        on?: {
          pull_request?: unknown;
          [key: string]: unknown;
        };
        permissions?: {
          packages?: string;
          [key: string]: string | undefined;
        };
        jobs?: Record<
          string,
          {
            if?: string;
            permissions?: {
              packages?: string;
              [key: string]: string | undefined;
            };
            steps?: Array<{
              env?: {
                NODE_AUTH_TOKEN?: string;
                SFW_BIN?: string;
                [key: string]: string | undefined;
              };
              run?: string;
            }>;
          }
        >;
      };

      const handlesForkPullRequests = workflow.on?.pull_request !== undefined;

      for (const [jobName, job] of Object.entries(workflow.jobs ?? {})) {
        const frozenInstallSteps = (job.steps ?? []).filter((step) =>
          [
            "./bin/6529 install:frozen",
            "node scripts/release-bus-install-dependencies.cjs",
            'node "$RELEASE_BUS_INSTALL_TOOL"',
          ].some((command) => step.run?.includes(command))
        );
        const effectivePermissions =
          job.permissions ?? workflow.permissions ?? {};

        if (frozenInstallSteps.length > 0) {
          installJobCount += 1;
          expect(effectivePermissions.packages).toBe("read");
          for (const installStep of frozenInstallSteps) {
            expect(installStep.env?.NODE_AUTH_TOKEN).toBe(
              "${{ github.token }}"
            );
            expect(installStep.env?.SFW_BIN).toMatch(
              /^\${{ steps\.[A-Za-z0-9_-]+\.outputs\.firewall-path-binary }}$/
            );
          }

          if (handlesForkPullRequests) {
            expect(job.if).toContain(
              "github.event.pull_request.head.repo.full_name == github.repository"
            );
          }
        }

        if (
          effectivePermissions.packages === "read" &&
          frozenInstallSteps.length === 0
        ) {
          throw new Error(
            `${workflowFile} job ${jobName} grants package read without a frozen install`
          );
        }
      }
    }

    expect(installJobCount).toBeGreaterThan(0);
  });
});

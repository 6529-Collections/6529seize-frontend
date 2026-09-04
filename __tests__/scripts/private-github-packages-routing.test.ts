import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
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
  SECURE_PNPM_BINARY_ARGUMENT: string;
  SECURE_REPOSITORY_ROOT_ARGUMENT: string;
  SCOPE_REGISTRY_KEY: string;
  validateAuthEnvironment: (environment: Environment) => void;
  validateLockfile: (lockfileText: string) => void;
  validateNpmrc: (npmrcText: string) => void;
  validatePackageJson: (packageJsonText: string) => void;
  validatePnpmArguments: (args: string[]) => void;
  validatePnpmConfigEnvironment: (environment: Environment) => void;
  validateRepositoryFiles: (repositoryRoot: string) => void;
  validateWorkspace: (workspaceText: string) => void;
};

type RoutingModule = {
  AUTHENTICATED_FROZEN_INSTALL_ARGUMENTS: string[];
  GLOBAL_CONFIG_ENVIRONMENT_VARIABLE: string;
  IGNORE_PNPMFILE_ENVIRONMENT_VARIABLE: string;
  IGNORE_SCRIPTS_ENVIRONMENT_VARIABLE: string;
  NPM_GLOBAL_CONFIG_ENVIRONMENT_VARIABLE: string;
  ROUTED_NO_PROXY: string;
  TOKEN_FREE_LOCKFILE_ARGUMENTS: string[];
  TOKEN_FREE_REBUILD_ARGUMENTS: string[];
  USER_CONFIG_ENVIRONMENT_VARIABLE: string;
  createRoutedEnvironment: (environment: Environment) => Environment;
  isAuthenticatedFrozenInstall: (args: string[]) => boolean;
  isLoopbackProxy: (proxyValue: unknown) => boolean;
  parseNoProxy: (value: string | undefined) => string[];
  pnpmSpawnArguments: (
    args: string[],
    platform: NodeJS.Platform,
    pnpmBinary?: string
  ) => {
    command: string;
    commandArguments: string[];
    shell: boolean;
  };
  runPnpm: (options: {
    args: string[];
    environment: Environment;
    platform?: NodeJS.Platform;
    pnpmBinary?: string;
    repositoryRoot: string;
    spawn: jest.Mock;
  }) => number;
  validateSocketEnvironment: (environment: Environment) => void;
};

type SecureRunnerModule = {
  ROUTING_HELPER_PATH: string;
  SECURE_PNPM_BINARY_ARGUMENT: string;
  SECURE_REPOSITORY_ROOT_ARGUMENT: string;
  parseSecureInvocationArguments: (args: string[]) => {
    args: string[];
    pnpmBinary: string;
    repositoryRoot: string;
  };
  runSecurePnpm: (options: {
    args: string[];
    environment: Environment;
    platform?: NodeJS.Platform;
    pnpmBinary: string;
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

const REPOSITORY_ROOT = path.resolve(__dirname, "../..");
const TEST_TOKEN = "read-only-test-token";
const AUTH_HELPER_RELATIVE_PATH = "scripts/private-github-packages-auth.sh";
const AUTH_HELPER_PATH = path.join(REPOSITORY_ROOT, AUTH_HELPER_RELATIVE_PATH);

function isolatedAuthTestEnvironment(): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (key.toLowerCase() === "node_auth_token") {
      delete environment[key];
    }
  }
  delete environment["CI"];
  return environment;
}

function runAuthHarness({
  environment = isolatedAuthTestEnvironment(),
  input,
  statements,
}: {
  environment?: NodeJS.ProcessEnv;
  input?: string;
  statements: string[];
}) {
  return spawnSync(
    "/bin/bash",
    [
      "-c",
      ["set -euo pipefail", 'source "$1"', ...statements].join("\n"),
      "private-package-auth-test",
      AUTH_HELPER_RELATIVE_PATH,
    ],
    {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
      env: environment,
      input,
      timeout: 1_000,
    }
  );
}

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

function writeValidRepositoryPolicyFiles(repositoryRoot: string) {
  fs.writeFileSync(path.join(repositoryRoot, ".npmrc"), validNpmrc());
  fs.writeFileSync(
    path.join(repositoryRoot, "package.json"),
    validPackageJson()
  );
  fs.writeFileSync(
    path.join(repositoryRoot, "pnpm-lock.yaml"),
    validLockfile()
  );
  fs.writeFileSync(
    path.join(repositoryRoot, "pnpm-workspace.yaml"),
    validWorkspace()
  );
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
    expect(() => policy.validatePnpmArguments(["add", "f"])).not.toThrow();
  });

  it("parses the effective release-age exception instead of YAML comments", () => {
    const commentSpoof = [
      `# - "${policy.ALLOWED_PACKAGE_SPEC}"`,
      "minimumReleaseAgeExclude:",
      `  - "${policy.ALLOWED_SCOPE}/*"`,
      "",
    ].join("\n");

    expect(() => policy.validateWorkspace(commentSpoof)).toThrow(
      `must keep the ${policy.ALLOWED_PACKAGE_SPEC} release-age exception`
    );
    expect(() =>
      policy.validateWorkspace(
        `${validWorkspace()}configDependencies:\n  policy: 1.0.0\n`
      )
    ).toThrow("cannot configure pnpm hooks or config dependencies");
  });

  it("rejects workspace registry, credential, proxy, CA, and TLS settings", () => {
    for (const setting of [
      "strict-ssl: false",
      'cafile: "/tmp/untrusted-ca.pem"',
      'https-proxy: "https://proxy.example"',
      '"@other:registry": "https://registry.example"',
      '"//registry.example/:_authToken": "not-allowed"',
    ]) {
      expect(() =>
        policy.validateWorkspace(`${validWorkspace()}${setting}\n`)
      ).toThrow(
        "cannot configure registry, credential, proxy, CA, or TLS overrides"
      );
    }
  });

  it("rejects YAML anchors, aliases, and merge keys in package policy files", () => {
    expect(() =>
      policy.validateWorkspace(
        `${validWorkspace()}network: &network\n  strict-ssl: false\n<<: *network\n`
      )
    ).toThrow("cannot use YAML anchors, aliases, or merge keys");

    expect(() =>
      policy.validateLockfile(
        validLockfile().replace(
          "packages:",
          "privatePackages: &privatePackages\n  '@6529-collections/other@1.0.0': {}\npackages:\n  <<: *privatePackages"
        )
      )
    ).toThrow("cannot use YAML anchors, aliases, or merge keys");
  });

  it("rejects explicit YAML mapping keys in package policy files", () => {
    expect(() =>
      policy.validateWorkspace(`${validWorkspace()}? strict-ssl\n: false\n`)
    ).toThrow("cannot use YAML explicit mapping keys");

    expect(() =>
      policy.validateLockfile(
        validLockfile().replace(
          "packages:",
          "packages:\n\n  ? '@6529-collections/other@1.0.0'\n  : {}"
        )
      )
    ).toThrow("cannot use YAML explicit mapping keys");
  });

  it("rejects YAML tags, directives, and hidden private-scope references", () => {
    expect(() =>
      policy.validateLockfile(
        validLockfile().replace(
          "packages:",
          "packages:\n\n  !!str '@6529-collections/other@1.0.0':\n    resolution: {integrity: sha512-not-approved}"
        )
      )
    ).toThrow("cannot use YAML tags or directives");

    expect(() =>
      policy.validateLockfile(
        validLockfile().replace(
          `  '${policy.ALLOWED_PACKAGE_SPEC}': {}`,
          [
            `  '${policy.ALLOWED_PACKAGE_SPEC}':`,
            "    dependencies:",
            `      hidden: '${policy.ALLOWED_SCOPE}/other@1.0.0'`,
          ].join("\n")
        )
      )
    ).toThrow(`cannot contain hidden or additional ${policy.ALLOWED_SCOPE}`);

    expect(() =>
      policy.validateWorkspace(`%YAML 1.2\n---\n${validWorkspace()}`)
    ).toThrow("cannot use YAML tags or directives");
  });

  it("fails closed when NODE_AUTH_TOKEN is missing or malformed", () => {
    expect(() => policy.validateAuthEnvironment({})).toThrow(
      "NODE_AUTH_TOKEN is required"
    );
    expect(() =>
      policy.validateAuthEnvironment({ NODE_AUTH_TOKEN: `${TEST_TOKEN}\n` })
    ).toThrow("NODE_AUTH_TOKEN has an invalid value");
    expect(() =>
      policy.validateAuthEnvironment({ node_auth_token: TEST_TOKEN })
    ).not.toThrow();
    expect(() =>
      policy.validateAuthEnvironment({
        NODE_AUTH_TOKEN: TEST_TOKEN,
        node_auth_token: TEST_TOKEN,
      })
    ).toThrow("must use exactly one environment-variable spelling");
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

  it("rejects pnpm hook configuration in .npmrc", () => {
    expect(() =>
      policy.validateNpmrc(
        `${validNpmrc()}global-pnpmfile=/tmp/untrusted-pnpmfile.cjs\n`
      )
    ).toThrow("pnpm hooks and config dependencies are not allowed");
  });

  it("rejects unapproved registry, credential, proxy, and TLS settings in .npmrc", () => {
    for (const setting of [
      "strict-ssl=false",
      "cafile=/tmp/untrusted-ca.pem",
      "node-options=--require=./steal.cjs",
      "proxy=http://proxy.example.invalid",
      "@another-scope:registry=https://registry.npmjs.org",
      "//registry.npmjs.org/:_authToken=unapproved",
    ]) {
      expect(() => policy.validateNpmrc(`${validNpmrc()}${setting}\n`)).toThrow(
        "unapproved registry, credential, proxy, or TLS setting"
      );
    }
  });

  it("rejects project relocation settings in .npmrc", () => {
    expect(() =>
      policy.validateNpmrc(`${validNpmrc()}dir=/tmp/other-project\n`)
    ).toThrow("settings are not allowed in .npmrc");
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
      "must be an exact 0.0.3 devDependency"
    );
  });

  it("rejects private-package aliases and indirect resolver settings", () => {
    const packageJson = JSON.parse(validPackageJson()) as Record<
      string,
      unknown
    >;
    packageJson["dependencies"] = {
      innocent: `npm:${policy.ALLOWED_SCOPE}/another-package@1.0.0`,
    };
    expect(() =>
      policy.validatePackageJson(JSON.stringify(packageJson))
    ).toThrow("cannot alias or indirectly resolve");

    packageJson["dependencies"] = {
      innocent: `npm:${policy.ALLOWED_PACKAGE_SPEC}`,
    };
    expect(() =>
      policy.validatePackageJson(JSON.stringify(packageJson))
    ).toThrow("cannot alias or indirectly resolve");

    delete packageJson["dependencies"];
    packageJson["pnpm"] = {
      overrides: {
        innocent: `npm:${policy.ALLOWED_SCOPE}/another-package@1.0.0`,
      },
    };
    expect(() =>
      policy.validatePackageJson(JSON.stringify(packageJson))
    ).toThrow("package.json pnpm cannot indirectly resolve");

    expect(() =>
      policy.validateWorkspace(
        `${validWorkspace()}overrides:\n  innocent: npm:${policy.ALLOWED_SCOPE}/another-package@1.0.0\n`
      )
    ).toThrow("pnpm-workspace.yaml cannot indirectly resolve");
    expect(() =>
      policy.validateWorkspace(
        `${validWorkspace()}overrides:\n  innocent: "npm:\\u00406529-collections/another-package@1.0.0"\n`
      )
    ).toThrow("pnpm-workspace.yaml cannot indirectly resolve");
    expect(() =>
      policy.validateWorkspace(
        `${validWorkspace()}overrides:\n  innocent: "https://npm.pkg.github.com/download/another-package"\n`
      )
    ).toThrow("cannot contain npm.pkg.github.com resolver URLs");
    expect(() =>
      policy.validateWorkspace(
        `${validWorkspace()}overrides:\n  innocent: "https://packages.example.invalid/npm.pkg.github.com/download/package"\n`
      )
    ).not.toThrow();
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

    const escapedUnexpectedTarball = validLockfile().replace(
      "snapshots:",
      [
        "  'public-package@1.0.0':",
        '    resolution: {tarball: "https://npm.pkg.github.c\\u006fm/download/public-package/1.0.0/not-allowed"}',
        "",
        "snapshots:",
      ].join("\n")
    );
    expect(() => policy.validateLockfile(escapedUnexpectedTarball)).toThrow(
      `unexpected ${policy.ALLOWED_REGISTRY_HOST} lockfile URL`
    );

    const uppercaseSchemeUnexpectedTarball = validLockfile().replace(
      "snapshots:",
      [
        "  'public-package@1.0.0':",
        "    resolution: {tarball: HTTPS://npm.pkg.github.com/download/@6529-collections/other/1.0.0/not-allowed}",
        "",
        "snapshots:",
      ].join("\n")
    );
    expect(() =>
      policy.validateLockfile(uppercaseSchemeUnexpectedTarball)
    ).toThrow(`unexpected ${policy.ALLOWED_REGISTRY_HOST} lockfile URL`);

    const controlEscapedTarball = validLockfile().replace(
      "snapshots:",
      [
        "  'public-package@1.0.0':",
        '    resolution: {tarball: "https://npm.pkg.github.c\\nom/download/public-package/1.0.0/not-allowed"}',
        "",
        "snapshots:",
      ].join("\n")
    );
    expect(() => policy.validateLockfile(controlEscapedTarball)).toThrow(
      "pnpm-lock.yaml contains a non-canonical control character"
    );
  });

  it("rejects CLI attempts to change routing or extend the package bypass", () => {
    expect(() =>
      policy.validatePnpmArguments(["config", "get", policy.AUTH_KEY])
    ).toThrow("only install, add, update, and audit");
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
      policy.validatePnpmArguments([
        "install",
        policy.SECURE_REPOSITORY_ROOT_ARGUMENT,
      ])
    ).toThrow("reserved for trusted package tooling");
    expect(() =>
      policy.validatePnpmArguments([
        "install",
        `${policy.SECURE_PNPM_BINARY_ARGUMENT}=/tmp/untrusted-pnpm`,
      ])
    ).toThrow("reserved for trusted package tooling");
    for (const compoundConfigOverride of [
      "--config.@evil:registry=https://evil.example",
      `--config.//evil.example/:_authToken=${policy.AUTH_PLACEHOLDER}`,
    ]) {
      expect(() =>
        policy.validatePnpmArguments([
          "add",
          "@evil/foo",
          compoundConfigOverride,
        ])
      ).toThrow(
        "registry, credential, proxy, and TLS overrides are not allowed"
      );
    }
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
      policy.validatePnpmArguments(["install", "--ignore-pnpmfile=false"])
    ).toThrow("registry, credential, proxy, and TLS overrides are not allowed");
    for (const args of [
      ["update", "--dir", "/tmp/other-project"],
      ["add", "-C/tmp/other-project", policy.ALLOWED_PACKAGE_SPEC],
      ["update", "--global"],
      ["install", "--lockfile-dir=/tmp/other-project"],
      ["update", "--filter", "other-workspace-package"],
    ]) {
      expect(() => policy.validatePnpmArguments(args)).toThrow(
        "project, workspace, global, and lockfile-root overrides are not allowed"
      );
    }
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
        "npm_config_strict-ssl": "false",
      })
    ).toThrow("pnpm network override environment is not allowed");
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        "NPM_CONFIG_STRICT-SSL": "false",
      })
    ).toThrow("pnpm network override environment is not allowed");
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config_ignore_scripts: "false",
      })
    ).toThrow("pnpm lifecycle or hook override environment is not allowed");
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config_pnpmfile: "/tmp/untrusted-pnpmfile.cjs",
      })
    ).toThrow("pnpm hook or config-dependency environment is not allowed");
    expect(() =>
      policy.validatePnpmConfigEnvironment({
        npm_config_dir: "/tmp/other-project",
      })
    ).toThrow("pnpm project, workspace, global, or lockfile-root environment");
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

  it("removes mixed-case TLS and pnpm config overrides", () => {
    const environment = socketEnvironment(socketCaPath);
    environment["npm_config_GlobalConfig"] = "/tmp/alternate-globalconfig";
    environment["NpM_CoNfIg_CaFiLe"] = "/tmp/alternate-ca";
    environment["sSl_CeRt_FiLe"] = "/tmp/alternate-cert-file";
    environment["SsL_cErT_dIr"] = "/tmp/alternate-cert-dir";
    environment["npm_config_store_dir"] = "/tmp/pnpm-store";

    const routed = routing.createRoutedEnvironment(environment);

    expect(routed["npm_config_GlobalConfig"]).toBeUndefined();
    expect(routed["NpM_CoNfIg_CaFiLe"]).toBeUndefined();
    expect(
      Object.keys(routed).some((key) => key.toLowerCase() === "ssl_cert_file")
    ).toBe(false);
    expect(
      Object.keys(routed).some((key) => key.toLowerCase() === "ssl_cert_dir")
    ).toBe(false);
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

  it("uses auth only while scripts and pnpm hooks are disabled, then rebuilds token-free", () => {
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
    const spawnCalls = spawn.mock.calls as unknown as Array<
      [string, string[], { env: Environment }]
    >;
    const trustedNpmrcPath = path.join(REPOSITORY_ROOT, ".npmrc");

    expect(spawn).toHaveBeenNthCalledWith(
      1,
      "pnpm",
      ["install", "--frozen-lockfile"],
      expect.objectContaining({
        env: expect.objectContaining({
          NODE_AUTH_TOKEN: TEST_TOKEN,
          [routing.USER_CONFIG_ENVIRONMENT_VARIABLE]: trustedNpmrcPath,
          [routing.GLOBAL_CONFIG_ENVIRONMENT_VARIABLE]: trustedNpmrcPath,
          [routing.NPM_GLOBAL_CONFIG_ENVIRONMENT_VARIABLE]: trustedNpmrcPath,
          [routing.IGNORE_PNPMFILE_ENVIRONMENT_VARIABLE]: "true",
          [routing.IGNORE_SCRIPTS_ENVIRONMENT_VARIABLE]: "true",
        }),
      })
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      routing.TOKEN_FREE_REBUILD_ARGUMENTS,
      expect.objectContaining({
        env: expect.objectContaining({
          [routing.IGNORE_PNPMFILE_ENVIRONMENT_VARIABLE]: "true",
        }),
      })
    );
    expect(spawnCalls[1]?.[2].env).not.toHaveProperty("NODE_AUTH_TOKEN");
    expect(spawnCalls[1]?.[2].env).not.toHaveProperty(
      routing.IGNORE_SCRIPTS_ENVIRONMENT_VARIABLE
    );
    expect(spawn).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(spawn.mock.calls[0]?.slice(0, 2))).not.toContain(
      TEST_TOKEN
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(TEST_TOKEN);
  });

  it("canonicalizes package auth and removes every case variant before rebuilds", () => {
    const spawn = jest.fn(() => ({ status: 0 }));
    jest.spyOn(console, "error").mockImplementation();
    const environment = socketEnvironment(socketCaPath);
    delete environment.NODE_AUTH_TOKEN;
    environment["node_auth_token"] = TEST_TOKEN;

    expect(
      routing.runPnpm({
        args: ["install", "--frozen-lockfile"],
        environment,
        repositoryRoot: REPOSITORY_ROOT,
        spawn,
      })
    ).toBe(0);
    const spawnCalls = spawn.mock.calls as unknown as Array<
      [string, string[], { env: Environment }]
    >;
    const authKeys = Object.keys(spawnCalls[0]?.[2].env ?? {}).filter(
      (key) => key.toLowerCase() === "node_auth_token"
    );

    expect(authKeys).toEqual(["NODE_AUTH_TOKEN"]);
    for (const rebuildCall of spawnCalls.slice(1)) {
      expect(
        Object.keys(rebuildCall[2].env).some(
          (key) => key.toLowerCase() === "node_auth_token"
        )
      ).toBe(false);
    }
  });

  it("does not pass install-only flags to audit", () => {
    const spawn = jest.fn(() => ({ status: 0 }));
    jest.spyOn(console, "error").mockImplementation();

    expect(
      routing.runPnpm({
        args: ["audit", "--fix"],
        environment: socketEnvironment(socketCaPath),
        repositoryRoot: REPOSITORY_ROOT,
        spawn,
      })
    ).toBe(0);
    const spawnCalls = spawn.mock.calls as unknown as Array<
      [string, string[], { env: Environment }]
    >;

    expect(spawnCalls.map((call) => call[1])).toEqual([
      ["audit", "--fix"],
      routing.TOKEN_FREE_LOCKFILE_ARGUMENTS,
      routing.AUTHENTICATED_FROZEN_INSTALL_ARGUMENTS,
      routing.TOKEN_FREE_REBUILD_ARGUMENTS,
    ]);
    expect(spawnCalls[0]?.[2].env).toEqual(
      expect.objectContaining({
        [routing.IGNORE_PNPMFILE_ENVIRONMENT_VARIABLE]: "true",
        [routing.IGNORE_SCRIPTS_ENVIRONMENT_VARIABLE]: "true",
      })
    );
    expect(spawnCalls[0]?.[2].env).not.toHaveProperty("NODE_AUTH_TOKEN");
    expect(spawnCalls[1]?.[2].env).not.toHaveProperty("NODE_AUTH_TOKEN");
    expect(spawnCalls[2]?.[2].env.NODE_AUTH_TOKEN).toBe(TEST_TOKEN);
    expect(spawnCalls[3]?.[2].env).not.toHaveProperty("NODE_AUTH_TOKEN");
  });

  it("resolves package mutations without auth before the fixed frozen fetch", () => {
    const spawn = jest.fn(() => ({ status: 0 }));
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(
      routing.runPnpm({
        args: ["add", "public-package@1.0.0"],
        environment: socketEnvironment(socketCaPath),
        repositoryRoot: REPOSITORY_ROOT,
        spawn,
      })
    ).toBe(0);
    const spawnCalls = spawn.mock.calls as unknown as Array<
      [string, string[], { env: Environment }]
    >;

    expect(spawnCalls.map((call) => call[1])).toEqual([
      ["add", "public-package@1.0.0", "--lockfile-only"],
      routing.TOKEN_FREE_LOCKFILE_ARGUMENTS,
      routing.AUTHENTICATED_FROZEN_INSTALL_ARGUMENTS,
      routing.TOKEN_FREE_REBUILD_ARGUMENTS,
    ]);
    for (const call of [spawnCalls[0], spawnCalls[1], spawnCalls[3]]) {
      expect(call?.[2].env).not.toHaveProperty("NODE_AUTH_TOKEN");
    }
    expect(spawnCalls[2]?.[2].env.NODE_AUTH_TOKEN).toBe(TEST_TOKEN);
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(TEST_TOKEN);
  });

  it("rejects a newly resolved private dependency before auth is attached", () => {
    writeValidRepositoryPolicyFiles(temporaryDirectory);
    const spawn = jest.fn(
      (_command: string, _args: string[], _options: { env: Environment }) => {
        const packageJson = JSON.parse(validPackageJson()) as Record<
          string,
          unknown
        >;
        packageJson["dependencies"] = {
          publicPackage: `npm:${policy.ALLOWED_SCOPE}/another-package@1.0.0`,
        };
        fs.writeFileSync(
          path.join(temporaryDirectory, "package.json"),
          JSON.stringify(packageJson)
        );
        return { status: 0 };
      }
    );

    expect(() =>
      routing.runPnpm({
        args: ["add", "public-package@1.0.0"],
        environment: socketEnvironment(socketCaPath),
        repositoryRoot: temporaryDirectory,
        spawn,
      })
    ).toThrow(`cannot alias or indirectly resolve ${policy.ALLOWED_SCOPE}`);
    expect(spawn).toHaveBeenCalledTimes(1);
    const firstCall = spawn.mock.calls[0] as unknown as [
      string,
      string[],
      { env: Environment },
    ];
    expect(firstCall[2].env).not.toHaveProperty("NODE_AUTH_TOKEN");
  });

  it("quotes every inner pnpm argument before using the Windows shell", () => {
    expect(
      routing.pnpmSpawnArguments(["add", "safe&package"], "win32")
    ).toEqual({
      command: '"pnpm"',
      commandArguments: ['"add"', '"safe&package"'],
      shell: true,
    });
    expect(
      routing.pnpmSpawnArguments(
        ["install", "--frozen-lockfile"],
        "linux",
        "/trusted/bin/pnpm"
      )
    ).toEqual({
      command: "/trusted/bin/pnpm",
      commandArguments: ["install", "--frozen-lockfile"],
      shell: false,
    });
  });

  it("rejects repository-local pnpm hook files", () => {
    writeValidRepositoryPolicyFiles(temporaryDirectory);
    fs.writeFileSync(
      path.join(temporaryDirectory, ".pnpmfile.cjs"),
      "module.exports = {};\n"
    );

    expect(() => policy.validateRepositoryFiles(temporaryDirectory)).toThrow(
      ".pnpmfile.cjs is not allowed"
    );
  });

  it("rejects package-lock.json in the direct secure-helper preflight", () => {
    writeValidRepositoryPolicyFiles(temporaryDirectory);
    fs.writeFileSync(path.join(temporaryDirectory, "package-lock.json"), "{}");

    expect(() => policy.validateRepositoryFiles(temporaryDirectory)).toThrow(
      "package-lock.json is not allowed"
    );
  });

  it("rejects indirect private-package resolvers before authenticated pnpm", () => {
    const packageJson = JSON.parse(validPackageJson()) as Record<
      string,
      unknown
    >;
    packageJson["dependencies"] = {
      innocent: `npm:${policy.ALLOWED_SCOPE}/another-package@1.0.0`,
    };
    for (const fixture of [
      {
        packageJson: JSON.stringify(packageJson),
        workspace: validWorkspace(),
      },
      {
        packageJson: validPackageJson(),
        workspace: `${validWorkspace()}overrides:\n  innocent: "npm:\\u00406529-collections/another-package@1.0.0"\n`,
      },
      {
        packageJson: validPackageJson(),
        workspace: `${validWorkspace()}overrides:\n  innocent: "https://npm.pkg.github.com/download/another-package"\n`,
      },
    ]) {
      writeValidRepositoryPolicyFiles(temporaryDirectory);
      fs.writeFileSync(
        path.join(temporaryDirectory, "package.json"),
        fixture.packageJson
      );
      fs.writeFileSync(
        path.join(temporaryDirectory, "pnpm-workspace.yaml"),
        fixture.workspace
      );
      const spawn = jest.fn(() => ({ status: 0 }));

      expect(() =>
        routing.runPnpm({
          args: ["install"],
          environment: socketEnvironment(socketCaPath),
          repositoryRoot: temporaryDirectory,
          spawn,
        })
      ).toThrow(/cannot (?:alias|contain|indirectly resolve)/);
      expect(spawn).not.toHaveBeenCalled();
    }
  });

  it("rejects additional workspace projects before authenticated pnpm", () => {
    writeValidRepositoryPolicyFiles(temporaryDirectory);
    fs.writeFileSync(
      path.join(temporaryDirectory, "pnpm-workspace.yaml"),
      `${validWorkspace()}packages:\n  - "packages/*"\n`
    );
    const spawn = jest.fn(() => ({ status: 0 }));

    expect(() =>
      routing.runPnpm({
        args: ["install"],
        environment: socketEnvironment(socketCaPath),
        repositoryRoot: temporaryDirectory,
        spawn,
      })
    ).toThrow("cannot add workspace projects");
    expect(spawn).not.toHaveBeenCalled();
  });

  it("rebuilds workspace-approved pending packages exactly once without auth", () => {
    const workspace = parseYaml(
      fs.readFileSync(path.join(REPOSITORY_ROOT, "pnpm-workspace.yaml"), "utf8")
    ) as { allowBuilds?: Record<string, boolean> };

    expect(Object.keys(workspace.allowBuilds ?? {})).not.toHaveLength(0);
    expect(Object.values(workspace.allowBuilds ?? {})).toEqual(
      expect.arrayContaining([true])
    );
    expect(Object.values(workspace.allowBuilds ?? {})).not.toContain(false);
    expect(routing.TOKEN_FREE_REBUILD_ARGUMENTS).toEqual([
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
        pnpmBinary: process.execPath,
        repositoryRoot: REPOSITORY_ROOT,
        spawn,
      })
    ).toBe(0);

    expect(spawn).toHaveBeenCalledWith(
      "sfw",
      [
        process.execPath,
        secureRunner.ROUTING_HELPER_PATH,
        secureRunner.SECURE_REPOSITORY_ROOT_ARGUMENT,
        REPOSITORY_ROOT,
        secureRunner.SECURE_PNPM_BINARY_ARGUMENT,
        process.execPath,
        "--",
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
    expect(
      secureRunner.parseSecureInvocationArguments([
        secureRunner.SECURE_REPOSITORY_ROOT_ARGUMENT,
        REPOSITORY_ROOT,
        secureRunner.SECURE_PNPM_BINARY_ARGUMENT,
        process.execPath,
        "--",
        "install",
      ])
    ).toEqual({
      args: ["install"],
      pnpmBinary: process.execPath,
      repositoryRoot: REPOSITORY_ROOT,
    });
    expect(() =>
      secureRunner.parseSecureInvocationArguments([
        secureRunner.SECURE_REPOSITORY_ROOT_ARGUMENT,
        "relative/path",
        "--",
        "install",
      ])
    ).toThrow("requires an absolute path");
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
        pnpmBinary: process.execPath,
        repositoryRoot: REPOSITORY_ROOT,
        spawn,
      })
    ).toBe(0);

    expect(spawn).toHaveBeenCalledWith(
      '"sfw"',
      [
        process.execPath,
        secureRunner.ROUTING_HELPER_PATH,
        secureRunner.SECURE_REPOSITORY_ROOT_ARGUMENT,
        REPOSITORY_ROOT,
        secureRunner.SECURE_PNPM_BINARY_ARGUMENT,
        process.execPath,
        "--",
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

describe("documented private-package setup flows", () => {
  describe("private-package authentication UX", () => {
    it("uses a pre-supplied token without prompting", () => {
      const environment = isolatedAuthTestEnvironment();
      environment["NODE_AUTH_TOKEN"] = TEST_TOKEN;
      const result = runAuthHarness({
        environment,
        statements: [
          "ensure_private_package_auth",
          'printf "auth-present=%s\\n" "${NODE_AUTH_TOKEN:+yes}"',
        ],
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("auth-present=yes\n");
      expect(result.stderr).not.toContain("input hidden");
      expect(`${result.stdout}${result.stderr}`).not.toContain(TEST_TOKEN);
    });

    it("rejects an empty pre-supplied token in a non-interactive shell", () => {
      const environment = isolatedAuthTestEnvironment();
      environment["NODE_AUTH_TOKEN"] = "";
      const result = runAuthHarness({
        environment,
        statements: ["ensure_private_package_auth"],
      });

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("non-interactive shells");
      expect(result.stderr).not.toContain("input hidden");
    });

    it("prompts silently in an interactive terminal", () => {
      const result = runAuthHarness({
        input: `${TEST_TOKEN}\n`,
        statements: [
          "private_package_auth_is_interactive() { return 0; }",
          "set -x",
          "ensure_private_package_auth",
          'printf "auth-present=%s\\n" "${NODE_AUTH_TOKEN:+yes}"',
        ],
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("auth-present=yes\n");
      expect(result.stderr).toContain("input hidden");
      expect(`${result.stdout}${result.stderr}`).not.toContain(TEST_TOKEN);
    });

    it("accepts non-empty interactive input ending at EOF", () => {
      const result = runAuthHarness({
        input: TEST_TOKEN,
        statements: [
          "private_package_auth_is_interactive() { return 0; }",
          "ensure_private_package_auth",
          'printf "auth-present=%s\\n" "${NODE_AUTH_TOKEN:+yes}"',
        ],
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("auth-present=yes\n");
      expect(`${result.stdout}${result.stderr}`).not.toContain(TEST_TOKEN);
    });

    it("rejects empty interactive input", () => {
      const result = runAuthHarness({
        input: "\n",
        statements: [
          "private_package_auth_is_interactive() { return 0; }",
          "ensure_private_package_auth",
        ],
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("NODE_AUTH_TOKEN cannot be empty");
    });

    it("fails immediately without auth in a non-interactive shell", () => {
      const result = runAuthHarness({
        statements: ["ensure_private_package_auth"],
      });

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("non-interactive shells");
      expect(result.stderr).not.toContain("input hidden");
    });

    it("never prompts in CI even when a terminal is available", () => {
      const environment = isolatedAuthTestEnvironment();
      environment["CI"] = "true";
      const result = runAuthHarness({
        environment,
        input: `${TEST_TOKEN}\n`,
        statements: [
          "private_package_auth_is_interactive() { return 0; }",
          "ensure_private_package_auth",
        ],
      });

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("package commands in CI");
      expect(result.stderr).not.toContain("input hidden");
      expect(`${result.stdout}${result.stderr}`).not.toContain(TEST_TOKEN);
    });

    it("loads the Codex token without printing it", () => {
      const result = runAuthHarness({
        statements: [
          "private_package_auth_keychain_is_available() { return 0; }",
          `private_package_auth_read_keychain() { printf '%s' '${TEST_TOKEN}'; }`,
          "set -x",
          "load_private_package_auth_for_codex",
          'printf "auth-present=%s\\n" "${NODE_AUTH_TOKEN:+yes}"',
        ],
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("auth-present=yes\n");
      expect(`${result.stdout}${result.stderr}`).not.toContain(TEST_TOKEN);
    });

    it("fails closed when the Codex Keychain item is missing", () => {
      const result = runAuthHarness({
        statements: [
          "private_package_auth_keychain_is_available() { return 0; }",
          "private_package_auth_read_keychain() { return 1; }",
          "load_private_package_auth_for_codex",
        ],
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "No GitHub Packages token was found in the macOS Keychain"
      );
    });

    it("can source the authentication helper more than once", () => {
      const result = runAuthHarness({
        statements: ['source "$1"', 'printf "resource=ok\\n"'],
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("resource=ok\n");
    });

    it("does not trust an inherited include-guard marker", () => {
      const environment = isolatedAuthTestEnvironment();
      environment["PRIVATE_GITHUB_PACKAGES_AUTH_SH_LOADED"] = "1";
      const result = runAuthHarness({
        environment,
        statements: [
          'printf "helper=%s\\n" "$(type -t ensure_private_package_auth)"',
        ],
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("helper=function\n");
    });
  });

  it("dispatches package operations directly to the secure helper", () => {
    const wrapper = fs.readFileSync(
      path.join(REPOSITORY_ROOT, "bin", "6529"),
      "utf8"
    );
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(REPOSITORY_ROOT, "package.json"), "utf8")
    ) as { scripts?: Record<string, string> };

    expect(wrapper).not.toContain('"$REAL_PNPM" run install:secure');
    expect(wrapper).not.toContain("scripts/assert-no-package-lock.cjs");
    expect(wrapper.match(/run-secure-pnpm\.cjs/g)).toHaveLength(8);
    expect(wrapper.match(/--seize-secure-pnpm-binary/g)).toHaveLength(8);
    expect(wrapper.match(/ensure_private_package_auth/g)).toHaveLength(8);
    expect(wrapper).toContain('SEIZE_STAGING_TRUSTED_PNPM_BINARY="$REAL_PNPM"');
    expect(packageJson.scripts).not.toHaveProperty("install:secure");
    expect(packageJson.scripts).not.toHaveProperty("install:secure:frozen");
    expect(packageJson.scripts).not.toHaveProperty("install:secure:prod");
  });

  it("prompts only after validating the eight package commands", () => {
    const wrapper = fs.readFileSync(
      path.join(REPOSITORY_ROOT, "bin", "6529"),
      "utf8"
    );
    const commandBranches = [
      ...wrapper.matchAll(
        /^  ([^)\n]+)\)\n([\s\S]*?)(?=^  [^)\n]+\)\n|^esac$)/gm
      ),
    ];
    const promptedCommands = commandBranches
      .filter((match) => match[2]?.includes("ensure_private_package_auth"))
      .map((match) => match[1]);

    expect(promptedCommands).toEqual([
      "i",
      "install",
      "ci",
      "install:frozen",
      "install:prod",
      "add",
      "update",
      "update:all",
    ]);

    for (const command of promptedCommands.filter(
      (entry) => entry !== "update:all"
    )) {
      const branch = commandBranches.find((match) => match[1] === command)?.[2];
      expect(branch).toBeDefined();
      expect(branch?.indexOf("ensure_private_package_auth")).toBeGreaterThan(
        branch?.indexOf("fi") ?? -1
      );
    }
  });

  it("keeps Codex setup non-interactive and removes captured auth", () => {
    const authHelper = fs.readFileSync(AUTH_HELPER_PATH, "utf8");
    const setupHelper = fs.readFileSync(
      path.join(REPOSITORY_ROOT, "scripts", "setup-codex-worktree.sh"),
      "utf8"
    );
    const environmentSetup = fs.readFileSync(
      path.join(REPOSITORY_ROOT, ".codex", "environments", "environment.toml"),
      "utf8"
    );
    const installIndex = environmentSetup.indexOf(
      "bash ./scripts/setup-codex-worktree.sh"
    );
    const authRemovalIndex = environmentSetup.indexOf("unset NODE_AUTH_TOKEN");

    expect(setupHelper.indexOf("set +x")).toBeLessThan(
      setupHelper.indexOf("load_private_package_auth_for_codex")
    );
    expect(setupHelper).toContain('exec "$REPO_ROOT/bin/6529" install');
    expect(setupHelper).not.toContain("add-generic-password");
    expect(authHelper).toContain(
      'PRIVATE_GITHUB_PACKAGES_KEYCHAIN_SERVICE="6529seize-frontend-github-packages"'
    );
    expect(authHelper).toContain("/usr/bin/security find-generic-password");
    expect(authHelper).not.toContain("gh auth token");
    expect(installIndex).toBeGreaterThanOrEqual(0);
    expect(authRemovalIndex).toBeGreaterThan(installIndex);
    expect(environmentSetup).toContain("unset NODE_AUTH_TOKEN");
    expect(environmentSetup).not.toContain("env | awk");
    expect(environmentSetup).toContain(
      "for file in .env.development .env.production; do"
    );
    expect(environmentSetup).toContain('cp "$PRIMARY_WORKTREE/$file" .');
    expect(environmentSetup).toContain('chmod 600 "$file"');
  });

  it("requires runtime auth before staging setup can mutate the checkout", () => {
    const setupScript = fs.readFileSync(
      path.join(REPOSITORY_ROOT, "dev-setup", "run-staging-ec2-setup.sh"),
      "utf8"
    );
    const authGuardIndex = setupScript.indexOf(
      '[[ -z "${NODE_AUTH_TOKEN:-}" ]]'
    );
    const authPreflightIndex = setupScript.indexOf(
      "require_private_package_auth\n",
      setupScript.indexOf("main()")
    );
    const inputIndex = setupScript.indexOf(
      "collect_all_inputs",
      authPreflightIndex
    );
    const envWriteIndex = setupScript.indexOf(
      "create_env_file",
      authPreflightIndex
    );
    const dependencyInstallIndex = setupScript.indexOf(
      'install_dependencies "$package_auth_token"',
      authPreflightIndex
    );
    const authUnsetIndex = setupScript.indexOf(
      "unset NODE_AUTH_TOKEN",
      authPreflightIndex
    );
    const localTokenUnsetIndex = setupScript.indexOf(
      "unset package_auth_token",
      dependencyInstallIndex
    );
    const buildIndex = setupScript.indexOf(
      "build_project",
      dependencyInstallIndex
    );
    const startIndex = setupScript.indexOf("start_pm2", dependencyInstallIndex);

    expect(authGuardIndex).toBeGreaterThanOrEqual(0);
    expect(authPreflightIndex).toBeGreaterThan(authGuardIndex);
    expect(authUnsetIndex).toBeGreaterThan(authPreflightIndex);
    expect(authUnsetIndex).toBeLessThan(inputIndex);
    expect(authPreflightIndex).toBeLessThan(inputIndex);
    expect(authPreflightIndex).toBeLessThan(envWriteIndex);
    expect(authPreflightIndex).toBeLessThan(dependencyInstallIndex);
    expect(setupScript).toContain(
      'NODE_AUTH_TOKEN="$package_auth_token" ./bin/6529 install:frozen'
    );
    expect(localTokenUnsetIndex).toBeGreaterThan(dependencyInstallIndex);
    expect(localTokenUnsetIndex).toBeLessThan(buildIndex);
    expect(localTokenUnsetIndex).toBeLessThan(startIndex);
    expect(setupScript).toContain('rm -rf "$REPO_ROOT/node_modules"');
    expect(setupScript).toContain("./bin/6529 install:frozen");
    expect(setupScript).not.toContain("gh auth token");
  });

  it("scopes runtime auth to the staging refresh install", () => {
    const stagingScript = fs.readFileSync(
      path.join(REPOSITORY_ROOT, "scripts", "staging.sh"),
      "utf8"
    );
    const authGuardIndex = stagingScript.indexOf(
      '[[ -z "${NODE_AUTH_TOKEN:-}" ]]'
    );
    const authUnsetIndex = stagingScript.indexOf("unset NODE_AUTH_TOKEN");
    const trustedPnpmCaptureIndex = stagingScript.indexOf(
      'trusted_pnpm_binary="${SEIZE_STAGING_TRUSTED_PNPM_BINARY:-}"'
    );
    const trustedToolingCaptureIndex = stagingScript.indexOf(
      'cp -- "$SCRIPT_DIR/run-secure-pnpm.cjs"'
    );
    const pullIndex = stagingScript.indexOf("git pull --ff-only");
    const scopedInstallIndex = stagingScript.indexOf(
      'NODE_AUTH_TOKEN="$package_auth_token" \\'
    );
    const localTokenUnsetIndex = stagingScript.indexOf(
      "unset package_auth_token"
    );
    const trustedToolingCleanupIndex = stagingScript.lastIndexOf(
      "cleanup_trusted_package_tooling"
    );
    const buildIndex = stagingScript.indexOf("./bin/6529 run build");
    const pm2Index = stagingScript.indexOf("pm2 start bash");

    expect(authGuardIndex).toBeGreaterThanOrEqual(0);
    expect(authUnsetIndex).toBeGreaterThan(authGuardIndex);
    expect(trustedPnpmCaptureIndex).toBeGreaterThan(authUnsetIndex);
    expect(trustedPnpmCaptureIndex).toBeLessThan(pullIndex);
    expect(trustedToolingCaptureIndex).toBeGreaterThan(authUnsetIndex);
    expect(trustedToolingCaptureIndex).toBeLessThan(pullIndex);
    expect(authUnsetIndex).toBeLessThan(pullIndex);
    expect(scopedInstallIndex).toBeGreaterThan(pullIndex);
    expect(stagingScript).toContain(
      '"$trusted_node_binary" "$trusted_secure_pnpm"'
    );
    expect(stagingScript).toContain(
      '--seize-secure-repository-root "$REPO_ROOT" \\'
    );
    expect(stagingScript).toContain(
      '--seize-secure-pnpm-binary "$trusted_pnpm_binary"'
    );
    expect(stagingScript).toContain('SFW_BIN="$trusted_sfw_binary"');
    expect(stagingScript).not.toContain(
      'NODE_AUTH_TOKEN="$package_auth_token" ./bin/6529'
    );
    expect(localTokenUnsetIndex).toBeGreaterThan(scopedInstallIndex);
    expect(trustedToolingCleanupIndex).toBeGreaterThan(localTokenUnsetIndex);
    expect(trustedToolingCleanupIndex).toBeLessThan(buildIndex);
    expect(localTokenUnsetIndex).toBeLessThan(buildIndex);
    expect(localTokenUnsetIndex).toBeLessThan(pm2Index);
    expect(stagingScript).not.toContain("export package_auth_token");
  });

  it("requires runtime auth before worktree setup can mutate repository state", () => {
    const worktreeScript = fs.readFileSync(
      path.join(REPOSITORY_ROOT, "scripts", "worktree", "wt-add.sh"),
      "utf8"
    );
    const authGuardIndex = worktreeScript.indexOf(
      '[[ -z "${NODE_AUTH_TOKEN:-}" ]]'
    );
    const authUnsetIndex = worktreeScript.indexOf("unset NODE_AUTH_TOKEN");
    const scopedInstallIndex = worktreeScript.indexOf(
      'NODE_AUTH_TOKEN="$PACKAGE_AUTH_TOKEN" \\'
    );
    const localTokenUnsetIndex = worktreeScript.indexOf(
      "unset PACKAGE_AUTH_TOKEN"
    );
    const targetBootstrapIndex = worktreeScript.lastIndexOf(
      "./bin/6529 bootstrap"
    );

    expect(authGuardIndex).toBeGreaterThanOrEqual(0);
    expect(authUnsetIndex).toBeGreaterThan(authGuardIndex);
    for (const mutation of [
      'mkdir -p "$worktree_parent"',
      'git -C "$MAIN_REPO" fetch origin',
      'git -C "$MAIN_REPO" worktree add',
      '"$SCRIPT_DIR/wt-sync.sh" "$WORKTREE_NAME"',
      "./bin/6529 bootstrap",
      '"$MAIN_REPO/scripts/run-secure-pnpm.cjs"',
    ]) {
      const mutationIndex = worktreeScript.indexOf(mutation);
      expect(authGuardIndex).toBeLessThan(mutationIndex);
      expect(authUnsetIndex).toBeLessThan(mutationIndex);
    }
    expect(authUnsetIndex).toBeLessThan(
      worktreeScript.indexOf("./bin/6529 bootstrap")
    );
    expect(scopedInstallIndex).toBeGreaterThan(authUnsetIndex);
    expect(worktreeScript).toContain(
      '"$NODE_BINARY" "$MAIN_REPO/scripts/run-secure-pnpm.cjs"'
    );
    expect(worktreeScript).toContain(
      '--seize-secure-repository-root "$WORKTREE_PATH" \\'
    );
    expect(worktreeScript).toContain(
      '--seize-secure-pnpm-binary "$TRUSTED_PNPM_BINARY" -- install'
    );
    expect(worktreeScript).not.toContain(
      'NODE_AUTH_TOKEN="$PACKAGE_AUTH_TOKEN" 6529'
    );
    expect(localTokenUnsetIndex).toBeGreaterThan(scopedInstallIndex);
    expect(targetBootstrapIndex).toBeGreaterThan(localTokenUnsetIndex);
    expect(worktreeScript).not.toContain("export PACKAGE_AUTH_TOKEN");
    expect(worktreeScript).not.toContain("gh auth token");
  });

  it.each(["README.md", "CONTRIBUTING.md"])(
    "documents runtime auth before the first install in %s",
    (fileName) => {
      const documentation = fs.readFileSync(
        path.join(REPOSITORY_ROOT, fileName),
        "utf8"
      );
      const authIndex = documentation.indexOf("NODE_AUTH_TOKEN");
      const installIndex = documentation.indexOf("6529 install");

      expect(authIndex).toBeGreaterThanOrEqual(0);
      expect(authIndex).toBeLessThan(installIndex);
      expect(documentation).toContain("read-only GitHub Packages access");
      expect(documentation).toContain(
        "ops/docs/developer/pnpm-and-socket-firewall.md"
      );
    }
  );
});

describe("GitHub Actions package access", () => {
  it("keeps the exact private package out of unauthenticated Dependabot updates", () => {
    const dependabot = parseYaml(
      fs.readFileSync(
        path.join(REPOSITORY_ROOT, ".github/dependabot.yml"),
        "utf8"
      )
    ) as {
      updates?: Array<{
        "package-ecosystem"?: string;
        ignore?: Array<{ "dependency-name"?: string }>;
      }>;
    };
    const npmUpdates = dependabot.updates?.find(
      (entry) => entry["package-ecosystem"] === "npm"
    );

    expect(npmUpdates?.ignore).toContainEqual({
      "dependency-name": policy.ALLOWED_PACKAGE_NAME,
    });
  });

  it("keeps the required debt verdict fail-closed for fork pull requests", () => {
    const workflow = parseYaml(
      fs.readFileSync(
        path.join(REPOSITORY_ROOT, ".github/workflows/debt-ratchet.yml"),
        "utf8"
      )
    ) as {
      jobs?: Record<
        string,
        {
          if?: string;
          name?: string;
          needs?: string;
          permissions?: Record<string, string>;
          steps?: Array<{
            env?: Record<string, string>;
            run?: string;
          }>;
        }
      >;
    };
    const privateJob = workflow.jobs?.["debt-ratchet-private"];
    const requiredJob = workflow.jobs?.["debt-ratchet"];

    expect(privateJob?.if).toContain(
      "github.event.pull_request.head.repo.full_name == github.repository"
    );
    expect(privateJob?.permissions?.["packages"]).toBe("read");
    expect(requiredJob).toMatchObject({
      name: "Debt ratchet",
      if: "always()",
      needs: "debt-ratchet-private",
      permissions: { contents: "read" },
    });
    expect(requiredJob?.permissions?.["packages"]).toBeUndefined();
    expect(requiredJob?.steps?.[0]?.env?.["DEBT_RATCHET_RESULT"]).toBe(
      "${{ needs.debt-ratchet-private.result }}"
    );
    expect(requiredJob?.steps?.[0]?.run).toContain("exit 1");
  });

  it("includes wrapper dependencies in sparse workflow checkouts", () => {
    const workflowDirectory = path.join(REPOSITORY_ROOT, ".github/workflows");
    const workflowFiles = fs
      .readdirSync(workflowDirectory)
      .filter((file) => /\.ya?ml$/.test(file));
    const missingDependencies: string[] = [];

    for (const workflowFile of workflowFiles) {
      const workflow = parseYaml(
        fs.readFileSync(path.join(workflowDirectory, workflowFile), "utf8")
      ) as {
        jobs?: Record<
          string,
          {
            steps?: Array<{
              name?: string;
              run?: string;
              uses?: string;
              with?: {
                path?: string;
                "sparse-checkout"?: string;
              };
            }>;
          }
        >;
      };

      for (const [jobName, job] of Object.entries(workflow.jobs ?? {})) {
        let sparseCheckoutPaths: string[] | undefined;

        for (const [stepIndex, step] of (job.steps ?? []).entries()) {
          if (
            step.uses?.startsWith("actions/checkout@") &&
            (step.with?.path === undefined ||
              step.with.path === "" ||
              step.with.path === ".")
          ) {
            sparseCheckoutPaths = step.with?.["sparse-checkout"]
              ?.split(/\r?\n/)
              .map((checkoutPath) => checkoutPath.trim())
              .filter(Boolean);
          }

          if (
            sparseCheckoutPaths !== undefined &&
            step.run?.includes("./bin/6529")
          ) {
            for (const requiredPath of [
              "bin/6529",
              AUTH_HELPER_RELATIVE_PATH,
            ]) {
              if (!sparseCheckoutPaths.includes(requiredPath)) {
                missingDependencies.push(
                  `${workflowFile} job ${jobName} step ${
                    step.name ?? stepIndex + 1
                  } is missing ${requiredPath}`
                );
              }
            }
          }
        }
      }
    }

    expect(missingDependencies).toEqual([]);
  });

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
            uses?: string;
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
          step.run?.includes("./bin/6529 install:frozen")
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

        const reusableWorkflow = job.uses?.match(/^\.\/\.github\/workflows\/([A-Za-z0-9_-]+\.yml)$/);
        let delegatesFrozenInstall = false;
        if (reusableWorkflow) {
          const child = parseYaml(fs.readFileSync(path.join(workflowDirectory, reusableWorkflow[1]!), "utf8"));
          delegatesFrozenInstall = Object.values(child.jobs ?? {}).some((childJob) =>
            ((childJob as { steps?: Array<{ run?: string }> }).steps ?? []).some((step) => step.run?.includes("./bin/6529 install:frozen"))
          );
        }
        if (
          effectivePermissions.packages === "read" &&
          frozenInstallSteps.length === 0 &&
          !delegatesFrozenInstall
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

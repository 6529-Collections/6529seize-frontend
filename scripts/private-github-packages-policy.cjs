const fs = require("node:fs");
const path = require("node:path");

const ALLOWED_SCOPE = "@6529-collections";
const ALLOWED_PACKAGE_NAME = `${ALLOWED_SCOPE}/release-request`;
const ALLOWED_PACKAGE_VERSION = "0.0.1";
const ALLOWED_PACKAGE_SPEC = `${ALLOWED_PACKAGE_NAME}@${ALLOWED_PACKAGE_VERSION}`;
const ALLOWED_REGISTRY_HOST = "npm.pkg.github.com";
const ALLOWED_REGISTRY_ORIGIN = `https://${ALLOWED_REGISTRY_HOST}`;
const PUBLIC_REGISTRY_ORIGIN = "https://registry.npmjs.org/";
const ALLOWED_TARBALL_URL =
  `${ALLOWED_REGISTRY_ORIGIN}/download/${ALLOWED_PACKAGE_NAME}/` +
  `${ALLOWED_PACKAGE_VERSION}/c7f1298a569f895127c03b95e6457240deeb7b72`;
const ALLOWED_INTEGRITY =
  "sha512-E3KMnNB1sMnl5YmWbJvLqBxCpxXuNQr8eMYkiqPl/gPv1bFIERej6ObqCYCmRVwkLaeMR4bdE95V4HdvEpX11g==";
const AUTH_ENVIRONMENT_VARIABLE = "NODE_AUTH_TOKEN";
const AUTH_PLACEHOLDER = `\${${AUTH_ENVIRONMENT_VARIABLE}}`;
const SCOPE_REGISTRY_KEY = `${ALLOWED_SCOPE}:registry`;
const AUTH_KEY = `//${ALLOWED_REGISTRY_HOST}/:_authToken`;

const FORBIDDEN_PNPM_OPTION_NAMES = new Set([
  "registry",
  "configregistry",
  "proxy",
  "httpsproxy",
  "noproxy",
  "strictssl",
  "cafile",
  "ca",
  "configproxy",
  "confighttpsproxy",
  "confignoproxy",
  "configstrictssl",
  "configcafile",
  "configca",
  "userconfig",
  "globalconfig",
  "configuserconfig",
  "configglobalconfig",
  "auth",
  "authtoken",
  "token",
  "username",
  "password",
]);

function policyError(message) {
  return new Error(`Private GitHub Packages policy: ${message}`);
}

function parseNpmrc(npmrcText) {
  const entries = new Map();

  for (const rawLine of npmrcText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#") || line.startsWith(";")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (entries.has(key)) {
      throw policyError(`duplicate .npmrc key: ${key}`);
    }
    entries.set(key, value);
  }

  return entries;
}

function validateNpmrc(npmrcText) {
  const entries = parseNpmrc(npmrcText);

  if (entries.get(SCOPE_REGISTRY_KEY) !== ALLOWED_REGISTRY_ORIGIN) {
    throw policyError(
      `${SCOPE_REGISTRY_KEY} must equal ${ALLOWED_REGISTRY_ORIGIN}`
    );
  }

  if (entries.get(AUTH_KEY) !== AUTH_PLACEHOLDER) {
    throw policyError(
      `${AUTH_KEY} must use the ${AUTH_PLACEHOLDER} placeholder`
    );
  }

  for (const [key, value] of entries) {
    const referencesAllowedHost =
      key.includes(ALLOWED_REGISTRY_HOST) ||
      value.includes(ALLOWED_REGISTRY_HOST);
    const isAllowedHostEntry =
      (key === SCOPE_REGISTRY_KEY && value === ALLOWED_REGISTRY_ORIGIN) ||
      (key === AUTH_KEY && value === AUTH_PLACEHOLDER);

    if (referencesAllowedHost && !isAllowedHostEntry) {
      throw policyError(
        `only ${SCOPE_REGISTRY_KEY} and ${AUTH_KEY} may reference ${ALLOWED_REGISTRY_HOST}`
      );
    }

    if (value.includes(AUTH_PLACEHOLDER) && key !== AUTH_KEY) {
      throw policyError(
        `${AUTH_ENVIRONMENT_VARIABLE} may only authenticate ${ALLOWED_REGISTRY_HOST}`
      );
    }
  }
}

function parsePackageJson(packageJsonText) {
  try {
    return JSON.parse(packageJsonText);
  } catch (error) {
    throw policyError(`package.json is invalid JSON: ${error.message}`);
  }
}

function validatePackageJson(packageJsonText) {
  const packageJson = parsePackageJson(packageJsonText);
  const scopedPackageNames =
    packageJsonText.match(/@6529-collections\/[A-Za-z0-9._-]+/g) ?? [];
  for (const packageName of scopedPackageNames) {
    if (packageName !== ALLOWED_PACKAGE_NAME) {
      throw policyError(
        `${packageName} cannot extend the ${ALLOWED_SCOPE} private-registry bypass`
      );
    }
  }

  if (packageJsonText.includes(ALLOWED_REGISTRY_HOST)) {
    throw policyError("package.json cannot contain GitHub Packages URLs");
  }

  const dependencyGroups = [
    ["dependencies", packageJson.dependencies ?? {}],
    ["devDependencies", packageJson.devDependencies ?? {}],
    ["optionalDependencies", packageJson.optionalDependencies ?? {}],
    ["peerDependencies", packageJson.peerDependencies ?? {}],
  ];

  if (
    packageJson.devDependencies?.[ALLOWED_PACKAGE_NAME] !==
    ALLOWED_PACKAGE_VERSION
  ) {
    throw policyError(
      `${ALLOWED_PACKAGE_NAME} must be an exact ${ALLOWED_PACKAGE_VERSION} devDependency`
    );
  }

  for (const [groupName, dependencies] of dependencyGroups) {
    for (const name of Object.keys(dependencies)) {
      if (
        name.startsWith(`${ALLOWED_SCOPE}/`) &&
        name !== ALLOWED_PACKAGE_NAME
      ) {
        throw policyError(
          `${name} cannot extend the ${ALLOWED_SCOPE} private-registry bypass`
        );
      }

      if (name === ALLOWED_PACKAGE_NAME && groupName !== "devDependencies") {
        throw policyError(`${ALLOWED_PACKAGE_NAME} must remain dev-only`);
      }
    }
  }
}

function validateLockfile(lockfileText) {
  const scopedPackageNames =
    lockfileText.match(/@6529-collections\/[A-Za-z0-9._-]+/g) ?? [];
  for (const packageName of scopedPackageNames) {
    if (packageName !== ALLOWED_PACKAGE_NAME) {
      throw policyError(
        `${packageName} cannot extend the ${ALLOWED_SCOPE} lockfile scope`
      );
    }
  }

  const hostReferenceCount = (
    lockfileText.match(/npm\.pkg\.github\.com/g) ?? []
  ).length;
  if (hostReferenceCount !== 1) {
    throw policyError(
      `pnpm-lock.yaml must contain exactly one ${ALLOWED_REGISTRY_HOST} tarball`
    );
  }

  const expectedResolution =
    `resolution: {integrity: ${ALLOWED_INTEGRITY}, ` +
    `tarball: ${ALLOWED_TARBALL_URL}}`;
  if (!lockfileText.includes(expectedResolution)) {
    throw policyError(
      `${ALLOWED_PACKAGE_SPEC} must keep its exact tarball and integrity`
    );
  }

  const registryUrls = lockfileText.match(/https?:\/\/[^\s,'"}\]]+/g) ?? [];
  for (const registryUrl of registryUrls) {
    let parsedUrl;
    try {
      parsedUrl = new URL(registryUrl);
    } catch {
      throw policyError(
        `pnpm-lock.yaml contains an invalid URL: ${registryUrl}`
      );
    }

    if (
      parsedUrl.hostname === ALLOWED_REGISTRY_HOST &&
      parsedUrl.href !== ALLOWED_TARBALL_URL
    ) {
      throw policyError(
        `unexpected ${ALLOWED_REGISTRY_HOST} lockfile URL: ${registryUrl}`
      );
    }
  }
}

function validateWorkspace(workspaceText) {
  const scopedExceptions =
    workspaceText.match(
      /@6529-collections\/[A-Za-z0-9._-]+@[A-Za-z0-9._-]+/g
    ) ?? [];

  if (!scopedExceptions.includes(ALLOWED_PACKAGE_SPEC)) {
    throw policyError(
      `pnpm-workspace.yaml must keep the ${ALLOWED_PACKAGE_SPEC} release-age exception`
    );
  }

  for (const packageSpec of scopedExceptions) {
    if (packageSpec !== ALLOWED_PACKAGE_SPEC) {
      throw policyError(
        `${packageSpec} cannot extend the ${ALLOWED_SCOPE} release-age exception`
      );
    }
  }
}

function validateAuthEnvironment(environment) {
  const token = environment[AUTH_ENVIRONMENT_VARIABLE];
  if (typeof token !== "string" || token.length === 0) {
    throw policyError(
      `${AUTH_ENVIRONMENT_VARIABLE} is required and must be a read-only package token`
    );
  }

  if (token.trim() !== token || /[\r\n]/.test(token)) {
    throw policyError(`${AUTH_ENVIRONMENT_VARIABLE} has an invalid value`);
  }
}

function optionName(argument) {
  return argument.split("=", 1)[0].toLowerCase();
}

function normalizedOptionName(argument) {
  return optionName(argument).replace(/[^a-z0-9]/g, "");
}

function validatePnpmArguments(args) {
  for (const argument of args) {
    if (argument.includes(ALLOWED_REGISTRY_HOST)) {
      throw policyError(
        `${ALLOWED_REGISTRY_HOST} URLs cannot be supplied on the command line`
      );
    }

    if (FORBIDDEN_PNPM_OPTION_NAMES.has(normalizedOptionName(argument))) {
      throw policyError(
        `registry, credential, proxy, and TLS overrides are not allowed: ${optionName(argument)}`
      );
    }

    const scopedSpecs =
      argument.match(
        /@6529-collections\/[A-Za-z0-9._-]+(?:@[A-Za-z0-9._-]+)?/g
      ) ?? [];
    for (const packageSpec of scopedSpecs) {
      if (packageSpec !== ALLOWED_PACKAGE_SPEC) {
        throw policyError(
          `${packageSpec} cannot extend or update the private package bypass`
        );
      }
    }
  }
}

function validatePnpmConfigEnvironment(environment) {
  if (
    environment.NODE_TLS_REJECT_UNAUTHORIZED !== undefined &&
    environment.NODE_TLS_REJECT_UNAUTHORIZED !== "1"
  ) {
    throw policyError(
      "NODE_TLS_REJECT_UNAUTHORIZED cannot disable TLS verification"
    );
  }

  for (const key of Object.keys(environment)) {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey === "npm_config_npm_globalconfig" ||
      normalizedKey === "npm_config_globalconfig"
    ) {
      continue;
    }

    if (normalizedKey === "npm_config__6529_collections_registry") {
      if (environment[key] !== ALLOWED_REGISTRY_ORIGIN) {
        throw policyError(
          `${key} must equal the committed ${ALLOWED_REGISTRY_ORIGIN}`
        );
      }
      continue;
    }

    if (normalizedKey === "npm_config_registry") {
      if (environment[key] !== PUBLIC_REGISTRY_ORIGIN) {
        throw policyError(
          `${key} must equal the default ${PUBLIC_REGISTRY_ORIGIN}`
        );
      }
      continue;
    }

    if (
      normalizedKey.startsWith("npm_config_") &&
      normalizedKey.includes("registry")
    ) {
      if (String(environment[key]).includes(ALLOWED_REGISTRY_HOST)) {
        throw policyError(
          `${key} cannot extend ${ALLOWED_REGISTRY_HOST} to another scope`
        );
      }
      continue;
    }

    const normalizedConfigName = normalizedKey
      .replace(/^npm_config_/, "")
      .replace(/[^a-z0-9]/g, "");
    if (
      normalizedKey.startsWith("npm_config_") &&
      [
        "auth",
        "token",
        "username",
        "password",
        "userconfig",
        "globalconfig",
      ].some((name) => normalizedConfigName.includes(name))
    ) {
      throw policyError(
        `only ${AUTH_ENVIRONMENT_VARIABLE} may supply package credentials: ${key}`
      );
    }

    if (
      normalizedKey.startsWith("npm_config_") &&
      /(proxy|noproxy|strict_ssl|cafile|^npm_config_ca$)/.test(normalizedKey)
    ) {
      throw policyError(
        `pnpm network override environment is not allowed: ${key}`
      );
    }
  }
}

function validateRepositoryPolicy({
  repositoryRoot,
  args,
  environment,
  validateEnvironmentOverrides = false,
}) {
  validateAuthEnvironment(environment);
  validatePnpmArguments(args);
  if (validateEnvironmentOverrides) {
    validatePnpmConfigEnvironment(environment);
  }

  validateNpmrc(fs.readFileSync(path.join(repositoryRoot, ".npmrc"), "utf8"));
  validatePackageJson(
    fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
  );
  validateLockfile(
    fs.readFileSync(path.join(repositoryRoot, "pnpm-lock.yaml"), "utf8")
  );
  validateWorkspace(
    fs.readFileSync(path.join(repositoryRoot, "pnpm-workspace.yaml"), "utf8")
  );
}

module.exports = {
  ALLOWED_INTEGRITY,
  ALLOWED_PACKAGE_NAME,
  ALLOWED_PACKAGE_SPEC,
  ALLOWED_PACKAGE_VERSION,
  ALLOWED_REGISTRY_HOST,
  ALLOWED_REGISTRY_ORIGIN,
  ALLOWED_SCOPE,
  ALLOWED_TARBALL_URL,
  AUTH_ENVIRONMENT_VARIABLE,
  AUTH_KEY,
  AUTH_PLACEHOLDER,
  SCOPE_REGISTRY_KEY,
  PUBLIC_REGISTRY_ORIGIN,
  validateAuthEnvironment,
  validateLockfile,
  validateNpmrc,
  validatePackageJson,
  validatePnpmArguments,
  validatePnpmConfigEnvironment,
  validateRepositoryPolicy,
  validateWorkspace,
};

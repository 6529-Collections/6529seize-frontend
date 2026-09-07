const fs = require("node:fs");
const path = require("node:path");

const NO_FOLLOW = fs.constants.O_NOFOLLOW ?? 0;

const RELEASE_PACKAGE = "@6529-collections/release-request";
const RELEASE_VERSION = "0.0.4";
const RELEASE_INTEGRITY =
  "sha512-rbGE0a3zlYUQlkg43/1TWAysNLksw0eaewywxDi6IoiucWgsZyEOrmbctBRWeDxLNAU3VypzrjyIGkjZ8ediiQ==";
const SECURE_REPOSITORY_ROOT_ARGUMENT = "--seize-secure-repository-root";
const SECURE_PNPM_BINARY_ARGUMENT = "--seize-secure-pnpm-binary";
const ALLOWED_COMMANDS = new Set([
  "add",
  "audit",
  "install",
  "rebuild",
  "remove",
  "update",
]);
const PACKAGE_MUTATION_COMMANDS = new Set([
  "add",
  "install",
  "remove",
  "update",
]);
const FORBIDDEN_OPTION_NAMES = new Set([
  "auth",
  "authtoken",
  "ca",
  "cafile",
  "cert",
  "c",
  "config",
  "configdependencies",
  "configdir",
  "dir",
  "filter",
  "g",
  "global",
  "globalconfig",
  "ignorepnpmfile",
  "ignorescripts",
  "key",
  "lockfiledir",
  "lockfiledirectory",
  "modulesdir",
  "npmglobalconfig",
  "offline",
  "password",
  "pnpmfile",
  "prefix",
  "proxy",
  "preferoffline",
  "httpsproxy",
  "registry",
  "strictssl",
  "token",
  "userconfig",
  "username",
  "virtualstoredir",
  "w",
  "workspace",
  "workspacedir",
]);

function policyError(message) {
  return new Error(`Public package policy: ${message}`);
}

function readRepositoryFile(repositoryRoot, relativePath) {
  const filePath = path.join(repositoryRoot, relativePath);
  let descriptor;
  try {
    descriptor = fs.openSync(filePath, fs.constants.O_RDONLY | NO_FOLLOW);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ELOOP") {
      throw policyError(`${relativePath} must be a regular file`);
    }
    throw error;
  }

  try {
    const pathStat = fs.lstatSync(filePath);
    const openedStat = fs.fstatSync(descriptor);
    if (
      pathStat.isSymbolicLink() ||
      !pathStat.isFile() ||
      !openedStat.isFile() ||
      openedStat.dev !== pathStat.dev ||
      openedStat.ino !== pathStat.ino
    ) {
      throw policyError(`${relativePath} changed while it was checked`);
    }
    return fs.readFileSync(descriptor, "utf8");
  } finally {
    fs.closeSync(descriptor);
  }
}

function parseNpmrc(text) {
  const entries = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#") || line.startsWith(";")) {
      continue;
    }
    const separator = line.indexOf("=");
    if (separator < 1) {
      throw policyError(`invalid .npmrc line: ${line}`);
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (entries.has(key)) {
      throw policyError(`duplicate .npmrc key: ${key}`);
    }
    entries.set(key, value);
  }
  return entries;
}

function validateNpmrc(text) {
  const entries = parseNpmrc(text);
  const expected = new Map([
    ["save-exact", "true"],
    ["allow-git", "none"],
  ]);
  if (entries.size !== expected.size) {
    throw policyError(".npmrc may contain only save-exact and allow-git");
  }
  for (const [key, value] of expected) {
    if (entries.get(key) !== value) {
      throw policyError(`.npmrc must set ${key}=${value}`);
    }
  }
}

function validatePackageJson(text) {
  const manifest = JSON.parse(text);
  if (manifest.packageManager !== "pnpm@10.33.0") {
    throw policyError("packageManager must remain pnpm@10.33.0");
  }
  if (manifest.devDependencies?.[RELEASE_PACKAGE] !== RELEASE_VERSION) {
    throw policyError(
      `${RELEASE_PACKAGE} must be an exact ${RELEASE_VERSION} dev dependency`
    );
  }
  for (const section of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    if (manifest[section]?.[RELEASE_PACKAGE] !== undefined) {
      throw policyError(`${RELEASE_PACKAGE} may exist only in devDependencies`);
    }
  }
}

function validateWorkspace(text) {
  if (!/^minimumReleaseAge:\s*10080\s*$/m.test(text)) {
    throw policyError("pnpm-workspace.yaml must keep the seven-day package age rule");
  }
  const exceptionBlock = text.match(
    /^minimumReleaseAgeExclude:\s*(?:\r?\n|$)((?:(?:[ \t]+[^\r\n]*|[ \t]*)\r?\n?)*)/m
  );
  const exceptions = (exceptionBlock?.[1] ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
  if (
    exceptions.length !== 1 ||
    !new RegExp(
      `^-\\s*["']?${RELEASE_PACKAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']?$`
    ).test(exceptions[0])
  ) {
    throw policyError(
      `minimumReleaseAgeExclude must contain only ${RELEASE_PACKAGE}`
    );
  }
}

function validateLockfile(text) {
  const packageKey = `'${RELEASE_PACKAGE}@${RELEASE_VERSION}'`;
  const requiredFragments = [
    `'${RELEASE_PACKAGE}':\n        specifier: ${RELEASE_VERSION}\n        version: ${RELEASE_VERSION}`,
    `${packageKey}:\n    resolution: {integrity: ${RELEASE_INTEGRITY}}`,
    `${packageKey}:\n    dependencies:`,
  ];
  for (const fragment of requiredFragments) {
    if (!text.includes(fragment)) {
      throw policyError("pnpm-lock.yaml does not pin the reviewed public package");
    }
  }
  if (
    /(?:^|[^a-z0-9.-])npm\.pkg\.github\.com(?=[:/]|[^a-z0-9.-]|$)/i.test(text)
  ) {
    throw policyError("pnpm-lock.yaml cannot resolve packages from GitHub Packages");
  }
  if (text.includes(`${RELEASE_PACKAGE}@0.0.3`)) {
    throw policyError("pnpm-lock.yaml still references private version 0.0.3");
  }
}

function normalizedOptionName(argument) {
  const option = argument.replace(/^-+/, "").split("=", 1)[0];
  return option.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isDirectDependencySource(argument) {
  if (/(?:^|@)(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(argument)) {
    return true;
  }
  if (/^[^@/\\\s]+@[^:/\\\s]+:[^\s]+$/.test(argument)) {
    return true;
  }
  if (/^(?:\.{1,2}[\/\\]|~[\/\\]|[a-z]:[\/\\]|\\\\)/i.test(argument)) {
    return true;
  }
  if (/\.(?:tgz|tar|tar\.gz)$/i.test(argument)) {
    return true;
  }
  if (argument.includes("/") || argument.includes("\\")) {
    return !/^@[^/@\\\s]+\/[^/@\\\s]+(?:@[^/\\\s]+)?$/.test(argument);
  }
  return false;
}

function validateArguments(args) {
  if (!ALLOWED_COMMANDS.has(args[0])) {
    throw policyError(`unsupported pnpm command: ${args[0] ?? "missing"}`);
  }
  for (const argument of args.slice(1)) {
    if (
      PACKAGE_MUTATION_COMMANDS.has(args[0]) &&
      (argument === RELEASE_PACKAGE || argument.startsWith(`${RELEASE_PACKAGE}@`))
    ) {
      throw policyError(
        `${RELEASE_PACKAGE} cannot be changed by a package command`
      );
    }
    if (isDirectDependencySource(argument)) {
      throw policyError(`direct dependency source is not allowed: ${argument}`);
    }
    if (!argument.startsWith("-")) {
      continue;
    }
    const name = normalizedOptionName(argument);
    const unprefixedName = name.startsWith("config")
      ? name.slice("config".length)
      : name;
    if (
      FORBIDDEN_OPTION_NAMES.has(name) ||
      FORBIDDEN_OPTION_NAMES.has(unprefixedName)
    ) {
      throw policyError(`pnpm option is not allowed: ${argument}`);
    }
  }
}

function validateEnvironment(environment) {
  if (
    environment.NODE_TLS_REJECT_UNAUTHORIZED !== undefined &&
    environment.NODE_TLS_REJECT_UNAUTHORIZED !== "1"
  ) {
    throw policyError("NODE_TLS_REJECT_UNAUTHORIZED cannot disable TLS checks");
  }

  for (const key of Object.keys(environment)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!normalizedKey.startsWith("npmconfig")) {
      continue;
    }
    const name = normalizedKey.slice("npmconfig".length);
    const containsCredentialOrNetworkOverride =
      name === "auth" ||
      name.endsWith("auth") ||
      name.includes("authtoken") ||
      name.includes("token") ||
      name.includes("username") ||
      name.includes("password") ||
      name.includes("userconfig") ||
      name.includes("globalconfig") ||
      name.includes("registry") ||
      name.includes("proxy") ||
      name.includes("strictssl") ||
      name.includes("cafile");
    if (
      FORBIDDEN_OPTION_NAMES.has(name) ||
      containsCredentialOrNetworkOverride
    ) {
      throw policyError(`package environment override is not allowed: ${key}`);
    }
  }
}

function validateRepositoryFiles(repositoryRoot) {
  validateNpmrc(readRepositoryFile(repositoryRoot, ".npmrc"));
  validatePackageJson(readRepositoryFile(repositoryRoot, "package.json"));
  validateWorkspace(readRepositoryFile(repositoryRoot, "pnpm-workspace.yaml"));
  validateLockfile(readRepositoryFile(repositoryRoot, "pnpm-lock.yaml"));
}

function validateRepositoryPolicy({
  repositoryRoot,
  args,
  environment,
  validateEnvironmentOverrides = false,
}) {
  if (!path.isAbsolute(repositoryRoot)) {
    throw policyError("repository root must be absolute");
  }
  validateArguments(args);
  validateRepositoryFiles(repositoryRoot);
  if (validateEnvironmentOverrides) {
    validateEnvironment(environment);
  }
}

module.exports = {
  RELEASE_INTEGRITY,
  RELEASE_PACKAGE,
  RELEASE_VERSION,
  SECURE_PNPM_BINARY_ARGUMENT,
  SECURE_REPOSITORY_ROOT_ARGUMENT,
  validateArguments,
  validateEnvironment,
  isDirectDependencySource,
  validateLockfile,
  validateNpmrc,
  validatePackageJson,
  validateRepositoryFiles,
  validateRepositoryPolicy,
  validateWorkspace,
};

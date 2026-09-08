const fs = require("node:fs");
const path = require("node:path");

const NO_FOLLOW = fs.constants.O_NOFOLLOW ?? 0;

const RELEASE_PACKAGE = "@6529-collections/release-request";
const RELEASE_VERSION = "0.0.4";
const RELEASE_REFERENCE = `${RELEASE_PACKAGE}@${RELEASE_VERSION}`;
const RELEASE_INTEGRITY =
  "sha512-rbGE0a3zlYUQlkg43/1TWAysNLksw0eaewywxDi6IoiucWgsZyEOrmbctBRWeDxLNAU3VypzrjyIGkjZ8ediiQ==";
const RELEASE_DEPENDENCIES = new Map([
  ["ajv", "8.20.0"],
  ["ajv-formats", "3.0.1(ajv@8.20.0)"],
]);
const ALLOWED_BUILD_DEPENDENCIES = new Set([
  "@nestjs/core",
  "@openapitools/openapi-generator-cli",
  "@parcel/watcher",
  "@reown/appkit",
  "@sentry/cli",
  "bufferutil",
  "esbuild",
  "keccak",
  "sharp",
  "unrs-resolver",
  "utf-8-validate",
]);
const ALLOWED_WORKSPACE_KEYS = new Set([
  "allowBuilds",
  "minimumReleaseAge",
  "minimumReleaseAgeExclude",
  "overrides",
]);
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
const ALLOWED_OPTIONS_BY_COMMAND = new Map([
  ["add", new Set(["-D", "--save-dev"])],
  ["audit", new Set(["--fix"])],
  ["install", new Set(["--frozen-lockfile", "--prod"])],
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
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    const dependencies = manifest[section];
    if (
      section !== "devDependencies" &&
      dependencies?.[RELEASE_PACKAGE] !== undefined
    ) {
      throw policyError(`${RELEASE_PACKAGE} may exist only in devDependencies`);
    }
    for (const [dependencyName, dependencySpec] of Object.entries(
      dependencies ?? {}
    )) {
      if (
        dependencyName !== RELEASE_PACKAGE &&
        typeof dependencySpec === "string" &&
        dependencySpec.includes(RELEASE_PACKAGE)
      ) {
        throw policyError(
          `${RELEASE_PACKAGE} cannot be referenced through another dependency`
        );
      }
      if (
        typeof dependencySpec === "string" &&
        isDirectDependencySource(dependencySpec)
      ) {
        throw policyError(
          `package.json direct dependency source is not allowed: ${dependencyName}`
        );
      }
    }
  }
  if (manifest.pnpm !== undefined) {
    throw policyError("package.json pnpm settings are not allowed");
  }
  if (manifest.dependenciesMeta !== undefined) {
    throw policyError("package.json dependency build settings are not allowed");
  }
}

function validateWorkspace(text) {
  const topLevelKeys = new Set();
  for (const rawLine of text.split(/\r?\n/)) {
    const trimmedLine = rawLine.trim();
    if (trimmedLine === "" || trimmedLine.startsWith("#") || /^\s/.test(rawLine)) {
      continue;
    }
    const keyMatch = rawLine.match(
      /^(?:"([^"\r\n]+)"|'([^'\r\n]+)'|([A-Za-z0-9_.@/+\-]+))\s*:/
    );
    if (!keyMatch) {
      throw policyError("pnpm-workspace.yaml has an unsupported top-level line");
    }
    const quotedKey = keyMatch[1] ?? keyMatch[2];
    if (quotedKey?.includes("\\")) {
      throw policyError(
        "pnpm-workspace.yaml quoted top-level keys cannot contain escapes"
      );
    }
    const key = keyMatch[1] ?? keyMatch[2] ?? keyMatch[3];
    if (topLevelKeys.has(key)) {
      throw policyError(`duplicate pnpm-workspace.yaml setting: ${key}`);
    }
    if (!ALLOWED_WORKSPACE_KEYS.has(key)) {
      throw policyError(`pnpm-workspace.yaml setting is not allowed: ${key}`);
    }
    topLevelKeys.add(key);
  }
  for (const requiredKey of ALLOWED_WORKSPACE_KEYS) {
    if (!topLevelKeys.has(requiredKey)) {
      throw policyError(`pnpm-workspace.yaml must contain ${requiredKey}`);
    }
  }
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
      `^-\\s*["']?${RELEASE_REFERENCE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']?$`
    ).test(exceptions[0])
  ) {
    throw policyError(
      `minimumReleaseAgeExclude must contain only ${RELEASE_REFERENCE}`
    );
  }

  const allowBuildsBlock = text.match(
    /^allowBuilds:\s*(?:\r?\n|$)((?:(?:[ \t]+[^\r\n]*|[ \t]*)\r?\n?)*)/m
  );
  const allowedBuilds = new Set();
  for (const line of (allowBuildsBlock?.[1] ?? "").split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }
    const entry = trimmedLine.match(
      /^(?:"([^"\r\n]+)"|'([^'\r\n]+)'|([A-Za-z0-9_.@/+\-]+))\s*:\s*true\s*$/
    );
    if (!entry) {
      throw policyError("allowBuilds must contain only approved packages");
    }
    const packageName = entry[1] ?? entry[2] ?? entry[3];
    if (allowedBuilds.has(packageName)) {
      throw policyError(`duplicate allowBuilds package: ${packageName}`);
    }
    allowedBuilds.add(packageName);
  }
  if (
    allowedBuilds.size !== ALLOWED_BUILD_DEPENDENCIES.size ||
    [...ALLOWED_BUILD_DEPENDENCIES].some(
      (packageName) => !allowedBuilds.has(packageName)
    )
  ) {
    throw policyError("allowBuilds must contain only approved packages");
  }

  const overridesBlock = text.match(
    /^overrides:\s*(?:\r?\n|$)((?:(?:[ \t]+[^\r\n]*|[ \t]*)\r?\n?)*)/m
  );
  const overrides = new Map();
  for (const line of (overridesBlock?.[1] ?? "").split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }
    const entry = trimmedLine.match(
      /^(?:"([^"\\\r\n]+)"|'([^'\\\r\n]+)'|([^:'"\\\r\n][^:\r\n]*?))\s*:\s*(?:"([^"\\\r\n]+)"|'([^'\\\r\n]+)'|([^#\r\n]+?))\s*$/
    );
    if (!entry) {
      throw policyError("overrides must use simple package selectors and versions");
    }
    const selector = (entry[1] ?? entry[2] ?? entry[3]).trim();
    const version = (entry[4] ?? entry[5] ?? entry[6]).trim();
    if (
      selector === "<<" ||
      /^[&*!]/.test(version) ||
      !/^[A-Za-z0-9_.@/+<>=~^|*\- ]+$/.test(selector) ||
      !/^(?:\$[A-Za-z0-9_.@/+\-]+|[0-9A-Za-z.*<>=~^|+\- ]+)$/.test(
        version
      )
    ) {
      throw policyError("overrides must use registry package versions only");
    }
    if (
      selector.includes(RELEASE_PACKAGE) ||
      version.includes(RELEASE_PACKAGE)
    ) {
      throw policyError(`${RELEASE_PACKAGE} cannot be changed by overrides`);
    }
    if (overrides.has(selector)) {
      throw policyError(`duplicate package override: ${selector}`);
    }
    overrides.set(selector, version);
  }
  if (overrides.size === 0) {
    throw policyError("pnpm-workspace.yaml must contain reviewed overrides");
  }
}

function parseSimpleYamlEntry(rawLine, indentation) {
  if (!rawLine.startsWith(" ".repeat(indentation))) {
    return undefined;
  }
  const remainder = rawLine.slice(indentation);
  if (remainder.startsWith(" ") || remainder.startsWith("\t")) {
    return undefined;
  }
  const entry = remainder.match(
    /^(?:"([^"\\\r\n]+)"|'([^'\\\r\n]+)'|([^:#][^:\r\n]*?))\s*:\s*(.*)$/
  );
  if (!entry) {
    return undefined;
  }
  return {
    key: (entry[1] ?? entry[2] ?? entry[3]).trim(),
    value: entry[4].trim(),
  };
}

function readYamlMapping(lines, start, end, indentation) {
  const values = new Map();
  for (let index = start; index < end; index += 1) {
    const rawLine = lines[index];
    const trimmedLine = rawLine.trim();
    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }
    const leadingWhitespace = rawLine.match(/^[ \t]*/)?.[0] ?? "";
    if (leadingWhitespace.includes("\t")) {
      throw policyError("pnpm-lock.yaml tab indentation is not supported");
    }
    if (leadingWhitespace.length !== indentation) {
      continue;
    }
    const entry = parseSimpleYamlEntry(rawLine, indentation);
    if (!entry) {
      throw policyError("pnpm-lock.yaml has an unsupported mapping entry");
    }
    if (values.has(entry.key)) {
      throw policyError(`pnpm-lock.yaml has duplicate key: ${entry.key}`);
    }
    values.set(entry.key, entry.value);
  }
  return values;
}

function findUniqueYamlBlock(lines, start, end, indentation, key) {
  const values = readYamlMapping(lines, start, end, indentation);
  if (!values.has(key) || values.get(key) !== "") {
    throw policyError("pnpm-lock.yaml does not pin the reviewed public package");
  }

  let blockStart = -1;
  for (let index = start; index < end; index += 1) {
    const entry = parseSimpleYamlEntry(lines[index], indentation);
    if (entry?.key === key) {
      blockStart = index + 1;
      break;
    }
  }
  if (blockStart < 0) {
    throw policyError("pnpm-lock.yaml does not pin the reviewed public package");
  }

  let blockEnd = end;
  for (let index = blockStart; index < end; index += 1) {
    const rawLine = lines[index];
    const trimmedLine = rawLine.trim();
    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }
    const leadingWhitespace = rawLine.match(/^[ \t]*/)?.[0] ?? "";
    if (leadingWhitespace.includes("\t")) {
      throw policyError("pnpm-lock.yaml tab indentation is not supported");
    }
    if (leadingWhitespace.length <= indentation) {
      blockEnd = index;
      break;
    }
  }
  return { start: blockStart, end: blockEnd };
}

function validateLockfile(text) {
  const lines = text.split(/\r?\n/);
  if (
    /(?:^|[^a-z0-9.-])npm\.pkg\.github\.com(?=[:/]|[^a-z0-9.-]|$)/i.test(text)
  ) {
    throw policyError("pnpm-lock.yaml cannot resolve packages from GitHub Packages");
  }
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    if (line.includes("\\")) {
      throw policyError("pnpm-lock.yaml escape sequences are not supported");
    }
    if (
      /^<<\s*:/.test(line) ||
      /:\s*[&*][A-Za-z0-9_-]+(?:\s|$)/.test(line) ||
      /^-\s*[&*][A-Za-z0-9_-]+(?:\s|$)/.test(line)
    ) {
      throw policyError("pnpm-lock.yaml aliases and merge keys are not supported");
    }
    if (!/^(?:resolution|"resolution"|'resolution')\s*:/.test(line)) {
      continue;
    }
    const resolution = line.match(/^resolution:\s*\{([^}]*)\}\s*$/);
    if (!resolution) {
      throw policyError("pnpm-lock.yaml has an unsupported package resolution");
    }
    const fields = new Map();
    for (const rawField of resolution[1].split(",")) {
      const separator = rawField.indexOf(":");
      if (separator < 1) {
        throw policyError("pnpm-lock.yaml has an unsupported package resolution");
      }
      const key = rawField.slice(0, separator).trim();
      const value = rawField.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (fields.has(key) || (key !== "integrity" && key !== "tarball")) {
        throw policyError("pnpm-lock.yaml has an unsupported package resolution");
      }
      fields.set(key, value);
    }
    if (!/^sha(?:1|256|384|512)-\S+$/.test(fields.get("integrity") ?? "")) {
      throw policyError("pnpm-lock.yaml package resolutions require integrity");
    }
    const tarball = fields.get("tarball");
    if (
      tarball !== undefined &&
      !tarball.startsWith("https://registry.npmjs.org/")
    ) {
      throw policyError("pnpm-lock.yaml cannot resolve a non-public tarball");
    }
  }
  if (text.includes(`${RELEASE_PACKAGE}@0.0.3`)) {
    throw policyError("pnpm-lock.yaml still references private version 0.0.3");
  }
  for (const suffix of text.split(`${RELEASE_PACKAGE}@`).slice(1)) {
    const referencedVersion = suffix.match(/^[0-9A-Za-z.+-]+/)?.[0];
    if (referencedVersion !== RELEASE_VERSION) {
      throw policyError("pnpm-lock.yaml references an unreviewed package version");
    }
  }

  const importers = findUniqueYamlBlock(lines, 0, lines.length, 0, "importers");
  const rootImporter = findUniqueYamlBlock(
    lines,
    importers.start,
    importers.end,
    2,
    "."
  );
  const devDependencies = findUniqueYamlBlock(
    lines,
    rootImporter.start,
    rootImporter.end,
    4,
    "devDependencies"
  );
  const releaseImporter = findUniqueYamlBlock(
    lines,
    devDependencies.start,
    devDependencies.end,
    6,
    RELEASE_PACKAGE
  );
  const importerValues = readYamlMapping(
    lines,
    releaseImporter.start,
    releaseImporter.end,
    8
  );

  const packages = findUniqueYamlBlock(lines, 0, lines.length, 0, "packages");
  const releaseKey = `${RELEASE_PACKAGE}@${RELEASE_VERSION}`;
  const releasePackage = findUniqueYamlBlock(
    lines,
    packages.start,
    packages.end,
    2,
    releaseKey
  );
  const packageValues = readYamlMapping(
    lines,
    releasePackage.start,
    releasePackage.end,
    4
  );
  const expectedResolution = `{integrity: ${RELEASE_INTEGRITY}}`;
  const expectedTarballResolution = `{integrity: ${RELEASE_INTEGRITY}, tarball: https://registry.npmjs.org/${RELEASE_PACKAGE}/-/${RELEASE_PACKAGE.split("/")[1]}-${RELEASE_VERSION}.tgz}`;

  const snapshots = findUniqueYamlBlock(lines, 0, lines.length, 0, "snapshots");
  const releaseSnapshot = findUniqueYamlBlock(
    lines,
    snapshots.start,
    snapshots.end,
    2,
    releaseKey
  );
  const snapshotDependencies = findUniqueYamlBlock(
    lines,
    releaseSnapshot.start,
    releaseSnapshot.end,
    4,
    "dependencies"
  );
  const snapshotValues = readYamlMapping(
    lines,
    snapshotDependencies.start,
    snapshotDependencies.end,
    6
  );

  if (
    importerValues.size !== 2 ||
    importerValues.get("specifier") !== RELEASE_VERSION ||
    importerValues.get("version") !== RELEASE_VERSION ||
    (packageValues.get("resolution") !== expectedResolution &&
      packageValues.get("resolution") !== expectedTarballResolution) ||
    snapshotValues.size !== RELEASE_DEPENDENCIES.size ||
    [...RELEASE_DEPENDENCIES].some(
      ([dependencyName, dependencyVersion]) =>
        snapshotValues.get(dependencyName) !== dependencyVersion
    )
  ) {
    throw policyError("pnpm-lock.yaml does not pin the reviewed public package");
  }
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
  const allowedOptions = ALLOWED_OPTIONS_BY_COMMAND.get(args[0]) ?? new Set();
  for (const argument of args.slice(1)) {
    if (
      PACKAGE_MUTATION_COMMANDS.has(args[0]) &&
      (argument === RELEASE_PACKAGE || argument.startsWith(`${RELEASE_PACKAGE}@`))
    ) {
      throw policyError(
        `${RELEASE_PACKAGE} cannot be changed by a package command`
      );
    }
    if (argument.startsWith("-")) {
      if (!allowedOptions.has(argument)) {
        throw policyError(`pnpm option is not allowed: ${argument}`);
      }
      continue;
    }
    if (isDirectDependencySource(argument)) {
      throw policyError(`direct dependency source is not allowed: ${argument}`);
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
    if (name === "storedir") {
      if (typeof environment[key] !== "string" || !path.isAbsolute(environment[key])) {
        throw policyError(`package store directory must be absolute: ${key}`);
      }
      continue;
    }
    throw policyError(`package environment override is not allowed: ${key}`);
  }
}

function validateRepositoryFiles(repositoryRoot) {
  for (const relativePath of [
    ".pnpmfile.cjs",
    ".pnpmfile.js",
    "package-lock.json",
  ]) {
    try {
      fs.lstatSync(path.join(repositoryRoot, relativePath));
    } catch (error) {
      if (error && typeof error === "object" && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }
    throw policyError(`${relativePath} is not allowed`);
  }
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

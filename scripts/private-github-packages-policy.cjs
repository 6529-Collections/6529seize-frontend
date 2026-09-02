const fs = require("node:fs");
const path = require("node:path");

const ALLOWED_SCOPE = "@6529-collections";
const ALLOWED_PACKAGE_NAME = `${ALLOWED_SCOPE}/release-request`;
const ALLOWED_PACKAGE_VERSION = "0.0.3";
const ALLOWED_PACKAGE_SPEC = `${ALLOWED_PACKAGE_NAME}@${ALLOWED_PACKAGE_VERSION}`;
const ALLOWED_REGISTRY_HOST = "npm.pkg.github.com";
const ALLOWED_REGISTRY_ORIGIN = `https://${ALLOWED_REGISTRY_HOST}`;
const PUBLIC_REGISTRY_ORIGIN = "https://registry.npmjs.org/";
const ALLOWED_TARBALL_URL =
  `${ALLOWED_REGISTRY_ORIGIN}/download/${ALLOWED_PACKAGE_NAME}/` +
  `${ALLOWED_PACKAGE_VERSION}/7cafe723b35db8ccf76eba6b856f3840412796b4`;
const ALLOWED_INTEGRITY =
  "sha512-hOBpv7kbJihS51uzysMQxTgq4lZshKFr3HaPT0haoppiPYquSL7HrLKLIPrx9jf1VEIgqRxmMYw2+515dw/TlQ==";
const AUTH_ENVIRONMENT_VARIABLE = "NODE_AUTH_TOKEN";
const AUTH_PLACEHOLDER = `\${${AUTH_ENVIRONMENT_VARIABLE}}`;
const SCOPE_REGISTRY_KEY = `${ALLOWED_SCOPE}:registry`;
const AUTH_KEY = `//${ALLOWED_REGISTRY_HOST}/:_authToken`;
const SECURE_REPOSITORY_ROOT_ARGUMENT = "--seize-secure-repository-root";
const SECURE_PNPM_BINARY_ARGUMENT = "--seize-secure-pnpm-binary";
const REQUIRED_LOCKFILE_PRIVATE_SCOPE_REFERENCE_COUNT = 4;
const ALLOWED_PNPM_COMMANDS = new Set(["add", "audit", "install", "update"]);
const FORBIDDEN_NPMRC_CONFIG_NAMES = new Set([
  "alwaysauth",
  "ca",
  "cafile",
  "cert",
  "globalconfig",
  "httpsproxy",
  "key",
  "nodeoptions",
  "noproxy",
  "npmglobalconfig",
  "proxy",
  "registry",
  "strictssl",
  "userconfig",
]);
const FORBIDDEN_WORKSPACE_CONFIG_NAMES = new Set([
  ...FORBIDDEN_NPMRC_CONFIG_NAMES,
  "auth",
  "authtoken",
  "password",
  "token",
  "username",
]);
const FORBIDDEN_PROJECT_LOCATION_OPTION_NAMES = new Set([
  "c",
  "configdir",
  "cwd",
  "dir",
  "f",
  "filter",
  "filterprod",
  "g",
  "global",
  "globalbindir",
  "globaldir",
  "ignoreworkspace",
  "location",
  "lockfiledir",
  "lockfiledirectory",
  "modulesdir",
  "prefix",
  "r",
  "recursive",
  "virtualstoredir",
  "w",
  "workspace",
  "workspacedir",
  "workspaceroot",
]);

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
  "ignorescripts",
  "configignorescripts",
  "ignorepnpmfile",
  "configignorepnpmfile",
  "pnpmfile",
  "globalpnpmfile",
  "configpnpmfile",
  "configglobalpnpmfile",
  "configdependencies",
  "configconfigdependencies",
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

function urlHostname(value) {
  if (typeof value !== "string" || value === "") {
    return null;
  }

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function npmrcKeyHostname(key) {
  if (!key.startsWith("//")) {
    return null;
  }

  const pathIndex = key.indexOf("/", 2);
  const authority = pathIndex === -1 ? key : key.slice(0, pathIndex + 1);
  return urlHostname(`https:${authority}`);
}

function isExactRegistryOrigin(value, expectedOrigin) {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const parsed = new URL(value);
    const expected = new URL(expectedOrigin);
    return (
      parsed.protocol === expected.protocol &&
      parsed.hostname === expected.hostname &&
      parsed.port === expected.port &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.pathname === "/" &&
      parsed.search === "" &&
      parsed.hash === ""
    );
  } catch {
    return false;
  }
}

function argumentUrlHostname(argument) {
  const separatorIndex = argument.indexOf("=");
  const candidate =
    separatorIndex === -1 ? argument : argument.slice(separatorIndex + 1);
  return urlHostname(candidate);
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
    const normalizedConfigName = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    const unprefixedConfigName = normalizedConfigName.startsWith("config")
      ? normalizedConfigName.slice("config".length)
      : normalizedConfigName;
    if (
      normalizedConfigName.includes("pnpmfile") ||
      normalizedConfigName.includes("configdependencies")
    ) {
      throw policyError(
        "pnpm hooks and config dependencies are not allowed during authenticated package commands"
      );
    }
    if (FORBIDDEN_PROJECT_LOCATION_OPTION_NAMES.has(unprefixedConfigName)) {
      throw policyError(
        `project, workspace, global, and lockfile-root settings are not allowed in .npmrc: ${key}`
      );
    }

    const referencesAllowedHost =
      npmrcKeyHostname(key) === ALLOWED_REGISTRY_HOST ||
      urlHostname(value) === ALLOWED_REGISTRY_HOST;
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

    const isApprovedSecurityEntry =
      (key === SCOPE_REGISTRY_KEY && value === ALLOWED_REGISTRY_ORIGIN) ||
      (key === AUTH_KEY && value === AUTH_PLACEHOLDER);
    if (
      !isApprovedSecurityEntry &&
      (key.startsWith("//") ||
        key.toLowerCase().endsWith(":registry") ||
        /(auth|token|username|password)/.test(normalizedConfigName) ||
        FORBIDDEN_NPMRC_CONFIG_NAMES.has(unprefixedConfigName))
    ) {
      throw policyError(
        `unapproved registry, credential, proxy, or TLS setting in .npmrc: ${key}`
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

function findPrivateScopeReference(value) {
  if (typeof value === "string") {
    return value.match(
      /@6529-collections\/[A-Za-z0-9._-]+(?:@[^\s"',}\]]+)?/
    )?.[0];
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const reference = findPrivateScopeReference(entry);
      if (reference !== undefined) {
        return reference;
      }
    }
    return undefined;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      const reference =
        findPrivateScopeReference(key) ?? findPrivateScopeReference(entry);
      if (reference !== undefined) {
        return reference;
      }
    }
  }
  return undefined;
}

function validatePackageJson(packageJsonText) {
  const packageJson = parsePackageJson(packageJsonText);
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
    for (const [name, packageSpec] of Object.entries(dependencies)) {
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

      if (urlHostname(packageSpec) === ALLOWED_REGISTRY_HOST) {
        throw policyError(
          "package.json dependency specs cannot contain GitHub Packages URLs"
        );
      }

      const indirectPrivatePackage = findPrivateScopeReference(packageSpec);
      if (indirectPrivatePackage !== undefined) {
        throw policyError(
          `${name} cannot alias or indirectly resolve ${indirectPrivatePackage}`
        );
      }
    }
  }

  for (const [settingName, resolverSettings] of [
    ["overrides", packageJson.overrides],
    ["resolutions", packageJson.resolutions],
    ["catalog", packageJson.catalog],
    ["catalogs", packageJson.catalogs],
    ["pnpm", packageJson.pnpm],
  ]) {
    const indirectPrivatePackage = findPrivateScopeReference(resolverSettings);
    if (indirectPrivatePackage !== undefined) {
      throw policyError(
        `package.json ${settingName} cannot indirectly resolve ${indirectPrivatePackage}`
      );
    }
  }
}

function stripYamlQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return trimmed;
  }
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  return (first === "'" && last === "'") || (first === '"' && last === '"')
    ? trimmed.slice(1, -1)
    : trimmed;
}

function semanticYamlLine(
  rawLine,
  filename = "pnpm-workspace.yaml",
  rejectYamlReferences = false
) {
  let semanticLine = "";

  for (let index = 0; index < rawLine.length; index += 1) {
    const character = rawLine[index];
    if (character === "#") {
      break;
    }
    const previousCharacter = rawLine[index - 1];
    const startsYamlToken = index === 0 || /[\s,[{:-]/.test(previousCharacter);
    if (rejectYamlReferences && startsYamlToken && character === "?") {
      throw policyError(`${filename} cannot use YAML explicit mapping keys`);
    }
    if (
      rejectYamlReferences &&
      startsYamlToken &&
      ["!", "%"].includes(character)
    ) {
      throw policyError(`${filename} cannot use YAML tags or directives`);
    }
    if (
      rejectYamlReferences &&
      startsYamlToken &&
      ((["&", "*"].includes(character) &&
        /[^\s,[\]{}]/.test(rawLine[index + 1] ?? "")) ||
        rawLine.startsWith("<<", index))
    ) {
      throw policyError(
        `${filename} cannot use YAML anchors, aliases, or merge keys`
      );
    }
    if (character === "'") {
      let closed = false;
      for (index += 1; index < rawLine.length; index += 1) {
        if (rawLine[index] !== "'") {
          semanticLine += rawLine[index];
          continue;
        }
        if (rawLine[index + 1] === "'") {
          semanticLine += "'";
          index += 1;
          continue;
        }
        closed = true;
        break;
      }
      if (!closed) {
        throw policyError(
          `${filename} contains an unterminated single-quoted scalar`
        );
      }
      continue;
    }
    if (character === '"') {
      let closed = false;
      for (index += 1; index < rawLine.length; index += 1) {
        const quotedCharacter = rawLine[index];
        if (quotedCharacter === '"') {
          closed = true;
          break;
        }
        if (quotedCharacter !== "\\") {
          semanticLine += quotedCharacter;
          continue;
        }

        const escapeType = rawLine[index + 1];
        const unicodeWidths = { x: 2, u: 4, U: 8 };
        const unicodeWidth = unicodeWidths[escapeType];
        if (unicodeWidth !== undefined) {
          const hexadecimal = rawLine.slice(
            index + 2,
            index + 2 + unicodeWidth
          );
          if (!new RegExp(`^[0-9A-Fa-f]{${unicodeWidth}}$`).test(hexadecimal)) {
            throw policyError(`${filename} contains an invalid Unicode escape`);
          }
          const codePoint = Number.parseInt(hexadecimal, 16);
          if (codePoint > 0x10ffff) {
            throw policyError(
              `${filename} contains an invalid Unicode code point`
            );
          }
          semanticLine += String.fromCodePoint(codePoint);
          index += unicodeWidth + 1;
          continue;
        }

        const escapedCharacters = {
          0: "\0",
          a: "\x07",
          b: "\b",
          t: "\t",
          n: "\n",
          v: "\v",
          f: "\f",
          r: "\r",
          e: "\x1b",
          " ": " ",
          '"': '"',
          "/": "/",
          "\\": "\\",
          N: "\u0085",
          _: "\u00a0",
          L: "\u2028",
          P: "\u2029",
        };
        if (!Object.hasOwn(escapedCharacters, escapeType)) {
          throw policyError(
            `${filename} contains an unsupported quoted escape`
          );
        }
        semanticLine += escapedCharacters[escapeType];
        index += 1;
      }
      if (!closed) {
        throw policyError(
          `${filename} contains an unterminated double-quoted scalar`
        );
      }
      continue;
    }
    semanticLine += character;
  }

  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(semanticLine)) {
    throw policyError(`${filename} contains a non-canonical control character`);
  }

  return semanticLine;
}

function workspaceUrlHostnames(semanticLines) {
  const hostnames = [];
  for (const line of semanticLines) {
    const urls = line.match(/(?:https?:)?\/\/[^\s,}\]]+/gi) ?? [];
    for (const url of urls) {
      const hostname = urlHostname(url.startsWith("//") ? `https:${url}` : url);
      if (hostname !== null) {
        hostnames.push(hostname);
      }
    }
  }
  return hostnames;
}

function effectiveLockfileLines(lockfileText) {
  const lines = [];
  for (const line of lockfileText.split(/\r?\n/)) {
    if (line.includes("\t")) {
      throw policyError("pnpm-lock.yaml must not use tab indentation");
    }
    if (line.trim() === "" || line.trimStart().startsWith("#")) {
      continue;
    }
    lines.push(semanticYamlLine(line, "pnpm-lock.yaml", true));
  }
  return lines;
}

function collectSectionEntries(lines, sectionName) {
  const entries = new Set();
  let foundSection = false;
  let inSection = false;

  for (const line of lines) {
    if (line === `${sectionName}:`) {
      if (foundSection) {
        throw policyError(`pnpm-lock.yaml contains duplicate ${sectionName}`);
      }
      foundSection = true;
      inSection = true;
      continue;
    }
    if (inSection && /^\S/.test(line)) {
      inSection = false;
    }
    if (!inSection) {
      continue;
    }

    const entryMatch = /^ {2}([^ ].*):(?:\s+\{\})?\s*$/.exec(line);
    if (!entryMatch) {
      continue;
    }
    const entryKey = stripYamlQuotes(entryMatch[1]);
    if (entries.has(entryKey)) {
      throw policyError(
        `pnpm-lock.yaml contains duplicate ${sectionName} entry ${entryKey}`
      );
    }
    entries.add(entryKey);
  }

  if (!foundSection) {
    throw policyError(`pnpm-lock.yaml must contain ${sectionName}`);
  }
  return entries;
}

function collectRootDevDependencies(lines) {
  const dependencies = new Map();
  let foundImporters = false;
  let inImporters = false;
  let importer = null;
  let dependencyGroup = null;
  let dependencyName = null;

  for (const line of lines) {
    if (line === "importers:") {
      if (foundImporters) {
        throw policyError("pnpm-lock.yaml contains duplicate importers");
      }
      foundImporters = true;
      inImporters = true;
      continue;
    }
    if (inImporters && /^\S/.test(line)) {
      inImporters = false;
    }
    if (!inImporters) {
      continue;
    }
    const importerMatch = /^ {2}([^ ].*):\s*$/.exec(line);
    if (importerMatch) {
      importer = stripYamlQuotes(importerMatch[1]);
      dependencyGroup = null;
      dependencyName = null;
      continue;
    }
    const dependencyGroupMatch = /^ {4}([^ ].*):\s*$/.exec(line);
    if (dependencyGroupMatch) {
      dependencyGroup = dependencyGroupMatch[1];
      dependencyName = null;
      continue;
    }
    const dependencyMatch = /^ {6}([^ ].*):\s*$/.exec(line);
    if (dependencyMatch) {
      dependencyName = stripYamlQuotes(dependencyMatch[1]);
      if (importer === "." && dependencyGroup === "devDependencies") {
        if (dependencies.has(dependencyName)) {
          throw policyError(
            `pnpm-lock.yaml contains duplicate root dependency ${dependencyName}`
          );
        }
        dependencies.set(dependencyName, {});
      }
      continue;
    }
    const dependencyFieldMatch = /^ {8}(specifier|version):\s*(.+)\s*$/.exec(
      line
    );
    if (
      dependencyFieldMatch &&
      importer === "." &&
      dependencyGroup === "devDependencies" &&
      dependencies.has(dependencyName)
    ) {
      dependencies.get(dependencyName)[dependencyFieldMatch[1]] =
        stripYamlQuotes(dependencyFieldMatch[2]);
    }
  }

  if (!foundImporters) {
    throw policyError("pnpm-lock.yaml must contain importers");
  }
  return dependencies;
}

function collectPrivatePackageResolution(lines) {
  let inPackages = false;
  let packageKey = null;
  let resolution = null;

  for (const line of lines) {
    if (line === "packages:") {
      inPackages = true;
      continue;
    }
    if (inPackages && /^\S/.test(line)) {
      break;
    }
    if (!inPackages) {
      continue;
    }
    const entryMatch = /^ {2}([^ ].*):(?:\s+\{\})?\s*$/.exec(line);
    if (entryMatch) {
      packageKey = stripYamlQuotes(entryMatch[1]);
      continue;
    }
    if (packageKey !== ALLOWED_PACKAGE_SPEC || !/^ {4}resolution:/.test(line)) {
      continue;
    }
    const match =
      /^ {4}resolution: \{integrity: ([^,{}\s]+), tarball: ([^,{}\s]+)\}\s*$/.exec(
        line
      );
    if (!match || resolution !== null) {
      throw policyError(
        `pnpm-lock.yaml contains a non-canonical resolution for ${packageKey}`
      );
    }
    resolution = { integrity: match[1], tarball: match[2] };
  }

  return resolution;
}

function parseCanonicalLockfile(lockfileText) {
  const lines = effectiveLockfileLines(lockfileText);
  const packageEntries = collectSectionEntries(lines, "packages");

  return {
    effectiveText: lines.join("\n"),
    packageEntries,
    resolution: collectPrivatePackageResolution(lines),
    rootDevDependencies: collectRootDevDependencies(lines),
    snapshotEntries: collectSectionEntries(lines, "snapshots"),
  };
}

function validateLockfile(lockfileText) {
  const {
    effectiveText,
    packageEntries,
    resolution,
    rootDevDependencies,
    snapshotEntries,
  } = parseCanonicalLockfile(lockfileText);

  for (const entryKey of [...packageEntries.keys(), ...snapshotEntries]) {
    const scopedPackageName = entryKey.match(
      /^(@6529-collections\/[A-Za-z0-9._-]+)(?:@|$)/
    )?.[1];
    if (scopedPackageName && scopedPackageName !== ALLOWED_PACKAGE_NAME) {
      throw policyError(
        `${scopedPackageName} cannot extend the ${ALLOWED_SCOPE} lockfile scope`
      );
    }
    if (
      scopedPackageName === ALLOWED_PACKAGE_NAME &&
      entryKey !== ALLOWED_PACKAGE_SPEC
    ) {
      throw policyError(
        `${entryKey} cannot extend or update the private package bypass`
      );
    }
  }

  if (
    resolution === null ||
    resolution === undefined ||
    resolution.integrity !== ALLOWED_INTEGRITY ||
    resolution.tarball !== ALLOWED_TARBALL_URL
  ) {
    throw policyError(
      `${ALLOWED_PACKAGE_SPEC} must keep its exact tarball and integrity`
    );
  }

  if (!snapshotEntries.has(ALLOWED_PACKAGE_SPEC)) {
    throw policyError(
      `pnpm-lock.yaml must contain the exact ${ALLOWED_PACKAGE_SPEC} snapshot`
    );
  }

  const importerEntry = rootDevDependencies.get(ALLOWED_PACKAGE_NAME);
  if (
    importerEntry?.specifier !== ALLOWED_PACKAGE_VERSION ||
    importerEntry?.version !== ALLOWED_PACKAGE_VERSION
  ) {
    throw policyError(
      `pnpm-lock.yaml must pin ${ALLOWED_PACKAGE_SPEC} in the root importer`
    );
  }

  const registryUrls = effectiveText.match(/https?:\/\/[^\s,'"}\]]+/gi) ?? [];

  const allowedRegistryUrls = [];
  for (const registryUrl of registryUrls) {
    let parsedUrl;
    try {
      parsedUrl = new URL(registryUrl);
    } catch {
      throw policyError(
        `pnpm-lock.yaml contains an invalid URL: ${registryUrl}`
      );
    }

    if (parsedUrl.hostname !== ALLOWED_REGISTRY_HOST) {
      continue;
    }

    allowedRegistryUrls.push(parsedUrl.href);
    if (parsedUrl.href !== ALLOWED_TARBALL_URL) {
      throw policyError(
        `unexpected ${ALLOWED_REGISTRY_HOST} lockfile URL: ${registryUrl}`
      );
    }
  }

  if (allowedRegistryUrls.length !== 1) {
    throw policyError(
      `pnpm-lock.yaml must contain exactly one ${ALLOWED_REGISTRY_HOST} tarball`
    );
  }

  const privateScopeReferenceCount =
    effectiveText.split(`${ALLOWED_SCOPE}/`).length - 1;
  if (
    privateScopeReferenceCount !==
    REQUIRED_LOCKFILE_PRIVATE_SCOPE_REFERENCE_COUNT
  ) {
    throw policyError(
      `pnpm-lock.yaml cannot contain hidden or additional ${ALLOWED_SCOPE} references`
    );
  }
}

function validateWorkspace(workspaceText) {
  const lines = workspaceText.split(/\r?\n/);
  const effectiveLines = [];
  const releaseAgeExceptions = [];
  let foundReleaseAgeExceptions = false;
  let inReleaseAgeExceptions = false;

  for (const line of lines) {
    if (line.includes("\t")) {
      throw policyError("pnpm-workspace.yaml must not use tab indentation");
    }

    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    const semanticLine = semanticYamlLine(line, "pnpm-workspace.yaml", true);
    effectiveLines.push(semanticLine);

    const topLevelKey = /^([^\s#].*?):(?:\s|$)/.exec(semanticLine)?.[1];
    const normalizedTopLevelKey = topLevelKey
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (
      normalizedTopLevelKey?.includes("pnpmfile") ||
      normalizedTopLevelKey === "configdependencies"
    ) {
      throw policyError(
        "pnpm-workspace.yaml cannot configure pnpm hooks or config dependencies"
      );
    }
    if (
      normalizedTopLevelKey !== undefined &&
      [...FORBIDDEN_WORKSPACE_CONFIG_NAMES].some(
        (configName) =>
          normalizedTopLevelKey === configName ||
          normalizedTopLevelKey.endsWith(configName)
      )
    ) {
      throw policyError(
        "pnpm-workspace.yaml cannot configure registry, credential, proxy, CA, or TLS overrides"
      );
    }
    if (normalizedTopLevelKey === "packages") {
      throw policyError(
        "pnpm-workspace.yaml cannot add workspace projects during authenticated package commands"
      );
    }

    if (line === "minimumReleaseAgeExclude:") {
      if (foundReleaseAgeExceptions) {
        throw policyError(
          "pnpm-workspace.yaml contains duplicate minimumReleaseAgeExclude"
        );
      }
      foundReleaseAgeExceptions = true;
      inReleaseAgeExceptions = true;
      continue;
    }

    if (inReleaseAgeExceptions && /^\S/.test(line)) {
      inReleaseAgeExceptions = false;
    }
    if (!inReleaseAgeExceptions) {
      continue;
    }

    const listEntry = /^ {2}- (.+)$/.exec(line);
    if (!listEntry) {
      throw policyError(
        "pnpm-workspace.yaml minimumReleaseAgeExclude must be a canonical string list"
      );
    }
    releaseAgeExceptions.push(stripYamlQuotes(listEntry[1]));
  }

  if (
    !foundReleaseAgeExceptions ||
    releaseAgeExceptions.length !== 1 ||
    releaseAgeExceptions[0] !== ALLOWED_PACKAGE_SPEC
  ) {
    throw policyError(
      `pnpm-workspace.yaml must keep the ${ALLOWED_PACKAGE_SPEC} release-age exception`
    );
  }

  const privateScopeReferenceCount = effectiveLines.reduce(
    (count, line) => count + line.split(`${ALLOWED_SCOPE}/`).length - 1,
    0
  );
  if (privateScopeReferenceCount !== 1) {
    throw policyError(
      `pnpm-workspace.yaml cannot indirectly resolve another ${ALLOWED_SCOPE} package`
    );
  }
  if (
    workspaceUrlHostnames(effectiveLines).some(
      (hostname) => hostname === ALLOWED_REGISTRY_HOST
    )
  ) {
    throw policyError(
      `pnpm-workspace.yaml cannot contain ${ALLOWED_REGISTRY_HOST} resolver URLs`
    );
  }
}

function validateAuthEnvironment(environment) {
  const tokenKeys = Object.keys(environment).filter(
    (key) => key.toLowerCase() === AUTH_ENVIRONMENT_VARIABLE.toLowerCase()
  );
  if (tokenKeys.length > 1) {
    throw policyError(
      `${AUTH_ENVIRONMENT_VARIABLE} must use exactly one environment-variable spelling`
    );
  }

  const token = environment[tokenKeys[0]];
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

function forbiddenOptionName(argument) {
  if (!argument.startsWith("-")) {
    return null;
  }

  const rawName = optionName(argument);
  if (/^-{1,2}config[.:]/.test(rawName)) {
    return rawName;
  }

  const normalizedName = normalizedOptionName(argument);
  if (FORBIDDEN_PNPM_OPTION_NAMES.has(normalizedName)) {
    return normalizedName;
  }

  const nonNegatedName = normalizedName.startsWith("no")
    ? normalizedName.slice(2)
    : normalizedName;
  return FORBIDDEN_PNPM_OPTION_NAMES.has(nonNegatedName)
    ? nonNegatedName
    : null;
}

function forbiddenProjectLocationOptionName(argument) {
  if (!argument.startsWith("-")) {
    return null;
  }

  const rawOptionName = argument.split("=", 1)[0];
  if (rawOptionName.startsWith("-C") || rawOptionName.startsWith("-F")) {
    return rawOptionName;
  }

  const normalizedName = normalizedOptionName(argument);
  if (FORBIDDEN_PROJECT_LOCATION_OPTION_NAMES.has(normalizedName)) {
    return normalizedName;
  }

  const nonNegatedName = normalizedName.startsWith("no")
    ? normalizedName.slice(2)
    : normalizedName;
  return FORBIDDEN_PROJECT_LOCATION_OPTION_NAMES.has(nonNegatedName)
    ? nonNegatedName
    : null;
}

function validatePnpmArguments(args) {
  if (!ALLOWED_PNPM_COMMANDS.has(args[0])) {
    throw policyError(
      "only install, add, update, and audit may use authenticated package routing"
    );
  }

  for (const argument of args) {
    const reservedPackageToolingArgument = [
      SECURE_REPOSITORY_ROOT_ARGUMENT,
      SECURE_PNPM_BINARY_ARGUMENT,
    ].find(
      (reservedArgument) =>
        argument === reservedArgument ||
        argument.startsWith(`${reservedArgument}=`)
    );
    if (reservedPackageToolingArgument !== undefined) {
      throw policyError(
        `${reservedPackageToolingArgument} is reserved for trusted package tooling`
      );
    }

    if (argumentUrlHostname(argument) === ALLOWED_REGISTRY_HOST) {
      throw policyError(
        `${ALLOWED_REGISTRY_HOST} URLs cannot be supplied on the command line`
      );
    }

    if (forbiddenProjectLocationOptionName(argument) !== null) {
      throw policyError(
        `project, workspace, global, and lockfile-root overrides are not allowed: ${optionName(argument)}`
      );
    }

    if (forbiddenOptionName(argument) !== null) {
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
      if (!isExactRegistryOrigin(environment[key], ALLOWED_REGISTRY_ORIGIN)) {
        throw policyError(
          `${key} must equal the committed ${ALLOWED_REGISTRY_ORIGIN}`
        );
      }
      continue;
    }

    if (normalizedKey === "npm_config_registry") {
      if (!isExactRegistryOrigin(environment[key], PUBLIC_REGISTRY_ORIGIN)) {
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
      const registryValue = environment[key];
      if (urlHostname(registryValue) === ALLOWED_REGISTRY_HOST) {
        throw policyError(
          `${key} cannot extend ${ALLOWED_REGISTRY_HOST} to another scope`
        );
      }
      if (urlHostname(registryValue) === null) {
        throw policyError(`${key} must contain a valid registry URL`);
      }
      continue;
    }

    const normalizedConfigName = normalizedKey
      .replace(/^npm_config_/, "")
      .replace(/[^a-z0-9]/g, "");
    if (
      normalizedKey.startsWith("npm_config_") &&
      FORBIDDEN_PROJECT_LOCATION_OPTION_NAMES.has(normalizedConfigName)
    ) {
      throw policyError(
        `pnpm project, workspace, global, or lockfile-root environment is not allowed: ${key}`
      );
    }
    if (
      normalizedKey.startsWith("npm_config_") &&
      ["ignorescripts", "ignorepnpmfile"].includes(normalizedConfigName)
    ) {
      throw policyError(
        `pnpm lifecycle or hook override environment is not allowed: ${key}`
      );
    }
    if (
      normalizedKey.startsWith("npm_config_") &&
      (normalizedConfigName.includes("pnpmfile") ||
        normalizedConfigName.includes("configdependencies"))
    ) {
      throw policyError(
        `pnpm hook or config-dependency environment is not allowed: ${key}`
      );
    }
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
      (normalizedConfigName.includes("proxy") ||
        normalizedConfigName.includes("strictssl") ||
        normalizedConfigName.includes("cafile") ||
        normalizedConfigName === "ca")
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

  validateRepositoryFiles(repositoryRoot);
}

function validateRepositoryFiles(repositoryRoot) {
  if (fs.existsSync(path.join(repositoryRoot, "package-lock.json"))) {
    throw policyError(
      "package-lock.json is not allowed; use the committed pnpm-lock.yaml"
    );
  }

  for (const pnpmHookFilename of [".pnpmfile.cjs", ".pnpmfile.js"]) {
    if (fs.existsSync(path.join(repositoryRoot, pnpmHookFilename))) {
      throw policyError(
        `${pnpmHookFilename} is not allowed during authenticated package commands`
      );
    }
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
  SECURE_PNPM_BINARY_ARGUMENT,
  SECURE_REPOSITORY_ROOT_ARGUMENT,
  validateAuthEnvironment,
  validateLockfile,
  validateNpmrc,
  validatePackageJson,
  validatePnpmArguments,
  validatePnpmConfigEnvironment,
  validateRepositoryPolicy,
  validateRepositoryFiles,
  validateWorkspace,
};

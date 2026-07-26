"use strict";

const { createHash } = require("node:crypto");
const path = require("node:path");
const { TextDecoder } = require("node:util");

const BUNDLE_SCHEMA_VERSION = "public-review.solidity-reference.v3";
const DEFINITION_SHARD_SCHEMA_VERSION =
  "public-review.solidity-definition-shard.v1";
const INDEX_SCHEMA_VERSION = "public-review.solidity-reference-index.v1";
const GENERATOR_NAME = "6529-public-review-solidity-reference";
const GENERATOR_VERSION = "2";
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
const EXACT_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const EXACT_TREE_PATTERN = /^[0-9a-f]{40}$/;
const SAFE_REVIEW_VALUE_PATTERN = /^[a-z0-9][a-z0-9.-]*$/;
const KECCAK_MASK_64 = (1n << 64n) - 1n;
const KECCAK_RATE_BYTES = 136;
const KECCAK_ROTATION_OFFSETS = [
  0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18,
  2, 61, 56, 14,
];
const KECCAK_ROUND_CONSTANTS = [
  0x0000000000000001n,
  0x0000000000008082n,
  0x800000000000808an,
  0x8000000080008000n,
  0x000000000000808bn,
  0x0000000080000001n,
  0x8000000080008081n,
  0x8000000000008009n,
  0x000000000000008an,
  0x0000000000000088n,
  0x0000000080008009n,
  0x000000008000000an,
  0x000000008000808bn,
  0x800000000000008bn,
  0x8000000000008089n,
  0x8000000000008003n,
  0x8000000000008002n,
  0x8000000000000080n,
  0x000000000000800an,
  0x800000008000000an,
  0x8000000080008081n,
  0x8000000000008080n,
  0x0000000080000001n,
  0x8000000080008008n,
];

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizePath(value) {
  return String(value).replaceAll("\\", "/");
}

function compareStrings(left, right) {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

function compareReviewVersions(left, right) {
  const tokens = (value) =>
    String(value)
      .match(/\d+|\D+/g)
      ?.map((token) =>
        /^\d+$/.test(token)
          ? { kind: "number", value: BigInt(token), raw: token }
          : { kind: "text", value: token }
      ) ?? [];
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  const length = Math.max(leftTokens.length, rightTokens.length);
  for (let index = 0; index < length; index += 1) {
    const leftToken = leftTokens[index];
    const rightToken = rightTokens[index];
    if (!leftToken || !rightToken) {
      return leftToken ? 1 : rightToken ? -1 : 0;
    }
    if (leftToken.kind === "number" && rightToken.kind === "number") {
      if (leftToken.value !== rightToken.value) {
        return leftToken.value < rightToken.value ? -1 : 1;
      }
      const rawComparison = compareStrings(leftToken.raw, rightToken.raw);
      if (rawComparison !== 0) {
        return rawComparison;
      }
      continue;
    }
    const comparison = compareStrings(
      String(leftToken.value),
      String(rightToken.value)
    );
    if (comparison !== 0) {
      return comparison;
    }
  }
  return 0;
}

function assertEverySourceRootMatched(roots, sourcePaths) {
  for (const root of roots) {
    invariant(
      sourcePaths.some(
        (sourcePath) => sourcePath === root || sourcePath.startsWith(`${root}/`)
      ),
      `Source root matched no Solidity files: ${root}`
    );
  }
}

function assertCompilerSourceSet(sourceBuffers, compilerOutput) {
  const pinnedPaths = [...sourceBuffers.keys()].sort(compareStrings);
  const compiledPaths = Object.keys(compilerOutput.sources ?? {}).sort(
    compareStrings
  );
  invariant(
    stableJson(pinnedPaths) === stableJson(compiledPaths),
    `Compiler source set disagrees with pinned Git sources (missing: ${
      pinnedPaths
        .filter((value) => !compiledPaths.includes(value))
        .slice(0, 3)
        .join(", ") || "none"
    }; unexpected: ${
      compiledPaths
        .filter((value) => !pinnedPaths.includes(value))
        .slice(0, 3)
        .join(", ") || "none"
    }).`
  );
}

function isSafeRepositoryPath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.startsWith("/") ||
    value.includes("\\") ||
    path.posix.isAbsolute(value)
  ) {
    return false;
  }
  const segments = value.split("/");
  return segments.every(
    (segment) => segment.length > 0 && segment !== "." && segment !== ".."
  );
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256Urn(value) {
  return `sha256:${sha256Hex(value)}`;
}

function rotateLane(value, offset) {
  if (offset === 0) {
    return value & KECCAK_MASK_64;
  }
  const shift = BigInt(offset);
  return ((value << shift) | (value >> (64n - shift))) & KECCAK_MASK_64;
}

function keccakPermutation(state) {
  for (const roundConstant of KECCAK_ROUND_CONSTANTS) {
    const columnParity = Array.from({ length: 5 }, (_, x) =>
      [0, 1, 2, 3, 4].reduce((value, y) => value ^ state[x + 5 * y], 0n)
    );
    const theta = columnParity.map(
      (_, x) =>
        columnParity[(x + 4) % 5] ^ rotateLane(columnParity[(x + 1) % 5], 1)
    );
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        const index = x + 5 * y;
        state[index] = (state[index] ^ theta[x]) & KECCAK_MASK_64;
      }
    }
    const rotated = Array(25).fill(0n);
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        const index = x + 5 * y;
        const destinationX = y;
        const destinationY = (2 * x + 3 * y) % 5;
        rotated[destinationX + 5 * destinationY] = rotateLane(
          state[index],
          KECCAK_ROTATION_OFFSETS[index]
        );
      }
    }
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        const index = x + 5 * y;
        state[index] =
          rotated[index] ^
          (~rotated[((x + 1) % 5) + 5 * y] &
            KECCAK_MASK_64 &
            rotated[((x + 2) % 5) + 5 * y]);
      }
    }
    state[0] ^= roundConstant;
  }
}

function absorbKeccakBlock(state, block) {
  for (let index = 0; index < KECCAK_RATE_BYTES; index += 1) {
    const lane = Math.floor(index / 8);
    const shift = BigInt((index % 8) * 8);
    state[lane] ^= BigInt(block[index]) << shift;
  }
  keccakPermutation(state);
}

function keccak256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(value);
  const state = Array(25).fill(0n);
  let offset = 0;
  while (offset + KECCAK_RATE_BYTES <= input.length) {
    absorbKeccakBlock(
      state,
      input.subarray(offset, offset + KECCAK_RATE_BYTES)
    );
    offset += KECCAK_RATE_BYTES;
  }
  const finalBlock = Buffer.alloc(KECCAK_RATE_BYTES);
  input.copy(finalBlock, 0, offset);
  finalBlock[input.length - offset] ^= 0x01;
  finalBlock[KECCAK_RATE_BYTES - 1] ^= 0x80;
  absorbKeccakBlock(state, finalBlock);
  const output = Buffer.alloc(32);
  for (let index = 0; index < output.length; index += 1) {
    const lane = state[Math.floor(index / 8)];
    output[index] = Number((lane >> BigInt((index % 8) * 8)) & 0xffn);
  }
  return `0x${output.toString("hex")}`;
}

function normalizeLf(value) {
  return String(value).replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])])
    );
  }
  return value;
}

function stableJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function decodeUtf8(buffer, label) {
  try {
    return UTF8_DECODER.decode(buffer);
  } catch {
    throw new Error(`${label} is not valid UTF-8.`);
  }
}

function definitionSemanticId(sourcePath, definitionName) {
  invariant(
    isSafeRepositoryPath(sourcePath),
    `Unsafe source path: ${sourcePath}`
  );
  invariant(
    typeof definitionName === "string" && definitionName.length > 0,
    `Missing definition name for ${sourcePath}.`
  );
  return `${sourcePath}:${definitionName}`;
}

function declarationSemanticId(definitionId, kind, selectorOrSignature) {
  invariant(
    typeof definitionId === "string" && definitionId.length > 0,
    "Declaration definition ID is required."
  );
  invariant(
    ["function", "event", "error"].includes(kind),
    `Unsupported declaration kind: ${kind}`
  );
  invariant(
    typeof selectorOrSignature === "string" && selectorOrSignature.length > 0,
    `Missing ${kind} selector or signature for ${definitionId}.`
  );
  return `${definitionId}#${kind}:${selectorOrSignature}`;
}

function encodeSemanticKey(semanticId) {
  return Buffer.from(semanticId, "utf8").toString("base64url");
}

function canonicalAbiType(input) {
  const type = input?.type;
  invariant(
    typeof type === "string" && type.length > 0,
    "ABI type is missing."
  );
  if (!type.startsWith("tuple")) {
    return type;
  }
  const suffix = type.slice("tuple".length);
  const components = Array.isArray(input.components) ? input.components : [];
  return `(${components.map(canonicalAbiType).join(",")})${suffix}`;
}

function abiSignature(item) {
  invariant(
    typeof item?.name === "string" && item.name.length > 0,
    "ABI declaration name is missing."
  );
  const inputs = Array.isArray(item.inputs) ? item.inputs : [];
  return `${item.name}(${inputs.map(canonicalAbiType).join(",")})`;
}

function selectorForSignature(signature) {
  return keccak256(Buffer.from(signature, "utf8")).slice(0, 10);
}

function topicForSignature(signature) {
  return keccak256(Buffer.from(signature, "utf8"));
}

function readDocumentation(documentation) {
  if (typeof documentation === "string") {
    return documentation.trim();
  }
  if (
    documentation &&
    typeof documentation === "object" &&
    typeof documentation.text === "string"
  ) {
    return documentation.text.trim();
  }
  return "";
}

function sourceLineStarts(buffer) {
  const starts = [0];
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] === 10 && index + 1 < buffer.length) {
      starts.push(index + 1);
    }
  }
  return starts;
}

function sourceLineCount(buffer) {
  if (buffer.length === 0) {
    return 0;
  }
  let count = 1;
  for (const byte of buffer) {
    if (byte === 10) {
      count += 1;
    }
  }
  return buffer.at(-1) === 10 ? count - 1 : count;
}

function lineForOffset(lineStarts, offset) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (lineStarts[middle] <= offset) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return high + 1;
}

function parseAstSourceRange(src) {
  const parts = typeof src === "string" ? src.split(":") : [];
  invariant(parts.length >= 2, `Invalid compiler source range: ${src}`);
  const start = Number(parts[0]);
  const length = Number(parts[1]);
  invariant(
    Number.isSafeInteger(start) && start >= 0,
    `Invalid source range start: ${src}`
  );
  invariant(
    Number.isSafeInteger(length) && length >= 0,
    `Invalid source range length: ${src}`
  );
  return { start, length };
}

function createSourceRecord(sourcePath, scope, buffer, publicBasePath, source) {
  const text = decodeUtf8(buffer, sourcePath);
  const lineCount = sourceLineCount(buffer);
  return {
    path: sourcePath,
    scope,
    byteLength: buffer.length,
    lineCount,
    sha256: sha256Urn(buffer),
    publicPath: `${publicBasePath}/${sourcePath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    githubUrl: githubSourceUrl(source.repository, source.commit, sourcePath),
    definitionIds: [],
    topLevelDeclarations: [],
    text,
    buffer,
    lineStarts: sourceLineStarts(buffer),
  };
}

function githubSourceUrl(repository, commit, sourcePath, range) {
  const encodedPath = sourcePath.split("/").map(encodeURIComponent).join("/");
  const base = `https://github.com/${repository}/blob/${commit}/${encodedPath}`;
  if (!range) {
    return base;
  }
  const end = range.lineEnd > range.lineStart ? `-L${range.lineEnd}` : "";
  return `${base}#L${range.lineStart}${end}`;
}

function astRange(node, sourceRecord, source) {
  const { start, length } = parseAstSourceRange(node.src);
  invariant(
    start + length <= sourceRecord.buffer.length,
    `${sourceRecord.path}: compiler range ${node.src} exceeds the Git blob.`
  );
  const inclusiveEnd = length === 0 ? start : start + length - 1;
  const lineStart = lineForOffset(sourceRecord.lineStarts, start);
  const lineEnd = lineForOffset(sourceRecord.lineStarts, inclusiveEnd);
  invariant(
    lineStart >= 1 && lineEnd >= lineStart && lineEnd <= sourceRecord.lineCount,
    `${sourceRecord.path}: compiler range ${node.src} maps outside the file.`
  );
  const snippet = sourceRecord.buffer.subarray(start, start + length);
  const range = {
    byteStart: start,
    byteLength: length,
    lineStart,
    lineEnd,
    sourceSha256: sourceRecord.sha256,
    snippetSha256: sha256Urn(snippet),
  };
  return {
    ...range,
    githubUrl: githubSourceUrl(
      source.repository,
      source.commit,
      sourceRecord.path,
      range
    ),
  };
}

function displayType(typeName) {
  if (!typeName || typeof typeName !== "object") {
    return "unknown";
  }
  switch (typeName.nodeType) {
    case "ElementaryTypeName":
      return `${typeName.name ?? "unknown"}${
        typeName.stateMutability === "payable" ? " payable" : ""
      }`;
    case "UserDefinedTypeName":
      return typeName.namePath ?? typeName.pathNode?.name ?? "unknown";
    case "ArrayTypeName": {
      const length =
        typeName.length?.value ??
        typeName.length?.hexValue ??
        typeName.length?.name ??
        "";
      return `${displayType(typeName.baseType)}[${length}]`;
    }
    case "Mapping":
      return `mapping(${displayType(typeName.keyType)} => ${displayType(
        typeName.valueType
      )})`;
    case "FunctionTypeName": {
      const inputs = parameterNodes(typeName.parameterTypes)
        .map((parameter) => displayType(parameter.typeName))
        .join(",");
      const outputs = parameterNodes(typeName.returnParameterTypes)
        .map((parameter) => displayType(parameter.typeName))
        .join(",");
      return `function(${inputs})${outputs ? ` returns (${outputs})` : ""}`;
    }
    default:
      return typeName.name ?? typeName.nodeType ?? "unknown";
  }
}

function parameterNodes(parameterList) {
  return Array.isArray(parameterList?.parameters)
    ? parameterList.parameters
    : [];
}

function parameterRecord(parameter, index) {
  const record = {
    index,
    name: parameter.name ?? "",
    type: displayType(parameter.typeName),
  };
  if (parameter.storageLocation && parameter.storageLocation !== "default") {
    record.storageLocation = parameter.storageLocation;
  }
  return record;
}

function astDisplaySignature(node) {
  const inputs = parameterNodes(node.parameters).map((parameter) =>
    displayType(parameter.typeName)
  );
  if (node.kind === "constructor") {
    return `constructor(${inputs.join(",")})`;
  }
  if (node.kind === "fallback") {
    return "fallback()";
  }
  if (node.kind === "receive") {
    return "receive()";
  }
  return `${node.name}(${inputs.join(",")})`;
}

function modifierNames(node) {
  return (node.modifiers ?? []).map(
    (modifier) =>
      modifier.modifierName?.name ??
      modifier.modifierName?.namePath ??
      "unknown"
  );
}

function functionDeclaration(node, definitionId, sourceRecord, source) {
  const displaySignature = astDisplaySignature(node);
  const selector =
    typeof node.functionSelector === "string"
      ? `0x${node.functionSelector}`
      : null;
  const key = selector ?? displaySignature;
  return {
    id: declarationSemanticId(definitionId, "function", key),
    key: encodeSemanticKey(
      declarationSemanticId(definitionId, "function", key)
    ),
    kind: "function",
    name: node.name || node.kind,
    functionKind: node.kind,
    displaySignature,
    canonicalSignature: null,
    selector,
    visibility: node.visibility,
    stateMutability: node.stateMutability,
    virtual: Boolean(node.virtual),
    inputs: parameterNodes(node.parameters).map(parameterRecord),
    outputs: parameterNodes(node.returnParameters).map(parameterRecord),
    modifiers: modifierNames(node),
    natspec: readDocumentation(node.documentation),
    range: astRange(node, sourceRecord, source),
    syntheticGetter: false,
  };
}

function eventOrErrorDeclaration(
  node,
  definitionId,
  kind,
  sourceRecord,
  source
) {
  const displaySignature = `${node.name}(${parameterNodes(node.parameters)
    .map((parameter) => displayType(parameter.typeName))
    .join(",")})`;
  const compilerHash =
    kind === "event" ? node.eventSelector : node.errorSelector;
  invariant(
    typeof compilerHash === "string",
    `${definitionId}:${node.name} has no compiler-provided ${kind} hash.`
  );
  const hash = kind === "event" && node.anonymous ? null : `0x${compilerHash}`;
  const semanticKey = kind === "event" ? displaySignature : hash;
  const semanticId = declarationSemanticId(definitionId, kind, semanticKey);
  return {
    astId: node.id,
    id: semanticId,
    key: encodeSemanticKey(semanticId),
    kind,
    name: node.name,
    displaySignature,
    canonicalSignature: null,
    ...(kind === "event" ? { topic0: hash } : { selector: hash }),
    inputs: parameterNodes(node.parameters).map((parameter, index) => ({
      ...parameterRecord(parameter, index),
      ...(kind === "event" ? { indexed: Boolean(parameter.indexed) } : {}),
    })),
    ...(kind === "event" ? { anonymous: Boolean(node.anonymous) } : {}),
    natspec: readDocumentation(node.documentation),
    range: astRange(node, sourceRecord, source),
  };
}

function stateVariableRecord(node, definitionId, sourceRecord, source) {
  const selector =
    typeof node.functionSelector === "string"
      ? `0x${node.functionSelector}`
      : null;
  return {
    name: node.name,
    type: displayType(node.typeName),
    typeString: node.typeDescriptions?.typeString ?? null,
    visibility: node.visibility,
    constant: Boolean(node.constant),
    immutable: node.mutability === "immutable",
    natspec: readDocumentation(node.documentation),
    range: astRange(node, sourceRecord, source),
    getterDeclarationId: selector
      ? declarationSemanticId(definitionId, "function", selector)
      : null,
    selector,
  };
}

function namedMemberRecord(node, sourceRecord, source) {
  const record = {
    name: node.name,
    natspec: readDocumentation(node.documentation),
    range: astRange(node, sourceRecord, source),
  };
  if (node.nodeType === "StructDefinition") {
    record.members = (node.members ?? []).map((member, index) => ({
      ...parameterRecord(member, index),
      typeString: member.typeDescriptions?.typeString ?? null,
      natspec: readDocumentation(member.documentation),
      range:
        typeof member.src === "string"
          ? astRange(member, sourceRecord, source)
          : null,
    }));
  }
  if (node.nodeType === "EnumDefinition") {
    record.members = (node.members ?? []).map((member) => member.name);
    record.memberDetails = (node.members ?? []).map((member, index) => ({
      index,
      name: member.name,
      range:
        typeof member.src === "string"
          ? astRange(member, sourceRecord, source)
          : null,
    }));
  }
  if (node.nodeType === "UserDefinedValueTypeDefinition") {
    record.underlyingType = displayType(node.underlyingType);
    record.underlyingTypeString =
      node.underlyingType?.typeDescriptions?.typeString ?? null;
  }
  if (node.nodeType === "ModifierDefinition") {
    record.inputs = parameterNodes(node.parameters).map(parameterRecord);
    record.virtual = Boolean(node.virtual);
    record.overrides = (node.overrides?.overrides ?? []).map(
      (override) => override.namePath ?? override.name ?? ""
    );
  }
  return record;
}

function localMembers(node, definitionId, sourceRecord, source) {
  const result = {
    functions: [],
    events: [],
    errors: [],
    modifiers: [],
    structs: [],
    enums: [],
    stateVariables: [],
    userDefinedValueTypes: [],
  };
  for (const member of node.nodes ?? []) {
    switch (member.nodeType) {
      case "FunctionDefinition":
        result.functions.push(
          functionDeclaration(member, definitionId, sourceRecord, source)
        );
        break;
      case "EventDefinition":
        result.events.push(
          eventOrErrorDeclaration(
            member,
            definitionId,
            "event",
            sourceRecord,
            source
          )
        );
        break;
      case "ErrorDefinition":
        result.errors.push(
          eventOrErrorDeclaration(
            member,
            definitionId,
            "error",
            sourceRecord,
            source
          )
        );
        break;
      case "ModifierDefinition":
        result.modifiers.push(namedMemberRecord(member, sourceRecord, source));
        break;
      case "StructDefinition":
        result.structs.push(namedMemberRecord(member, sourceRecord, source));
        break;
      case "EnumDefinition":
        result.enums.push(namedMemberRecord(member, sourceRecord, source));
        break;
      case "VariableDeclaration":
        if (member.stateVariable) {
          result.stateVariables.push(
            stateVariableRecord(member, definitionId, sourceRecord, source)
          );
        }
        break;
      case "UserDefinedValueTypeDefinition":
        result.userDefinedValueTypes.push(
          namedMemberRecord(member, sourceRecord, source)
        );
        break;
      case "UsingForDirective":
        break;
      default:
        throw new Error(
          `${definitionId}: unsupported contract member ${member.nodeType}.`
        );
    }
  }
  return result;
}

function classificationFor(raw, context) {
  const exactId = `${raw.sourcePath}:${raw.name}`;
  const excluded = context.excludedDefinitions.get(exactId);
  if (excluded) {
    return {
      classification: "excluded",
      reason: excluded.reason,
    };
  }
  if (context.productionContracts.has(exactId)) {
    return {
      classification: "production_release_contract",
      reason:
        "Listed in release-artifacts/contracts.json production_contracts.",
    };
  }
  if (context.publishedInterfaces.has(exactId)) {
    return {
      classification: "published_interface",
      reason: "Listed in release-artifacts/contracts.json interfaces.",
    };
  }
  if (raw.scope === "script") {
    return {
      classification: "deployment_or_operational_source",
      reason: "Declared under the pinned deployment-script source root.",
    };
  }
  if (raw.scope === "test") {
    return {
      classification: "test_or_harness_source",
      reason: "Declared under the pinned test/harness source root.",
    };
  }
  if (context.vendoredSourcePaths.has(raw.sourcePath)) {
    return {
      classification: "vendored_dependency",
      reason:
        "Source path is explicitly classified as vendored in the input manifest.",
    };
  }
  if (context.legacySourcePaths.has(raw.sourcePath)) {
    return {
      classification: "legacy_non_production_source",
      reason:
        "Source path is explicitly classified as legacy in the input manifest.",
    };
  }
  if (context.genesisNames.has(raw.name)) {
    return {
      classification: "genesis_target_component",
      reason:
        "Named by the pinned genesis deployment profile but absent from the release catalog.",
    };
  }
  if (raw.contractKind === "library") {
    return {
      classification: "production_support_library",
      reason:
        "First-party protocol library outside the production contract catalog.",
    };
  }
  return {
    classification: "first_party_candidate",
    reason:
      "First-party protocol definition outside the release and published-interface catalogs.",
  };
}

function sourceScope(sourcePath, roots) {
  const matchingRoot = roots.find(
    (root) => sourcePath === root.path || sourcePath.startsWith(`${root.path}/`)
  );
  invariant(matchingRoot, `Source is outside configured roots: ${sourcePath}`);
  return matchingRoot.scope;
}

function compilerAbi(output, sourcePath, name) {
  const contract = output.contracts?.[sourcePath]?.[name];
  invariant(contract, `${sourcePath}:${name} is absent from compiler output.`);
  invariant(Array.isArray(contract.abi), `${sourcePath}:${name} has no ABI.`);
  return contract.abi;
}

function abiItemRecord(item) {
  const signature = abiSignature(item);
  const common = {
    name: item.name,
    signature,
    inputs: (item.inputs ?? []).map((input, index) => ({
      index,
      name: input.name ?? "",
      type: canonicalAbiType(input),
      internalType: input.internalType ?? input.type,
      ...(item.type === "event" ? { indexed: Boolean(input.indexed) } : {}),
    })),
  };
  if (item.type === "function") {
    return {
      ...common,
      selector: selectorForSignature(signature),
      stateMutability: item.stateMutability,
      outputs: (item.outputs ?? []).map((output, index) => ({
        index,
        name: output.name ?? "",
        type: canonicalAbiType(output),
        internalType: output.internalType ?? output.type,
      })),
    };
  }
  if (item.type === "event") {
    const anonymous = Boolean(item.anonymous);
    return {
      ...common,
      topic0: anonymous ? null : topicForSignature(signature),
      anonymous,
    };
  }
  if (item.type === "error") {
    return {
      ...common,
      selector: selectorForSignature(signature),
    };
  }
  return common;
}

function eventOrErrorMembers(definition, kind) {
  return kind === "event"
    ? definition.members.events
    : definition.members.errors;
}

function usedDeclarationIds(definition, kind) {
  if (kind === "event") {
    return definition.node.usedEvents ?? [];
  }
  if (kind === "error") {
    return definition.node.usedErrors ?? [];
  }
  return [];
}

function declarationLookup(rawDefinitions, definition, kind, abiRecord) {
  const linearized = definition.node.linearizedBaseContracts ?? [
    definition.node.id,
  ];
  for (const astId of linearized) {
    const candidate = rawDefinitions.get(astId);
    if (!candidate) {
      continue;
    }
    if (kind === "function") {
      const direct = candidate.members.functions.find(
        (record) => record.selector === abiRecord.selector
      );
      if (direct) {
        return { definition: candidate, declaration: direct };
      }
      const unresolvedFunctions = candidate.members.functions.filter(
        (record) =>
          (record.selector === null || candidate.contractKind === "library") &&
          record.name === abiRecord.name &&
          record.inputs.length === abiRecord.inputs.length
      );
      invariant(
        unresolvedFunctions.length <= 1,
        `${candidate.semanticId}: ABI function ${abiRecord.signature} is ambiguous without a compiler selector.`
      );
      if (unresolvedFunctions.length === 1) {
        return {
          definition: candidate,
          declaration: unresolvedFunctions[0],
        };
      }
      const getter = candidate.members.stateVariables.find(
        (record) => record.selector === abiRecord.selector
      );
      if (getter) {
        return {
          definition: candidate,
          declaration: getterDeclaration(candidate, getter, abiRecord),
        };
      }
    } else {
      const records = eventOrErrorMembers(candidate, kind);
      const hashField = kind === "event" ? "topic0" : "selector";
      const direct = records.find(
        (record) => record[hashField] === abiRecord[hashField]
      );
      if (direct) {
        return { definition: candidate, declaration: direct };
      }
    }
  }
  const referencedDeclarationIds = usedDeclarationIds(definition, kind);
  if (Array.isArray(referencedDeclarationIds)) {
    const usedIdSet = new Set(referencedDeclarationIds);
    const hashField = kind === "event" ? "topic0" : "selector";
    const matches = [];
    for (const candidate of rawDefinitions.values()) {
      const records = eventOrErrorMembers(candidate, kind);
      for (const record of records) {
        if (
          usedIdSet.has(record.astId) &&
          record[hashField] === abiRecord[hashField]
        ) {
          matches.push({ definition: candidate, declaration: record });
        }
      }
    }
    invariant(
      matches.length <= 1,
      `${definition.semanticId}: ABI ${kind} ${abiRecord.signature} resolves to multiple used declarations.`
    );
    if (matches.length === 1) {
      return matches[0];
    }
  }
  return null;
}

function getterDeclaration(definition, variable, abiRecord) {
  const semanticId = declarationSemanticId(
    definition.semanticId,
    "function",
    abiRecord.selector
  );
  return {
    id: semanticId,
    key: encodeSemanticKey(semanticId),
    kind: "function",
    name: variable.name,
    functionKind: "getter",
    displaySignature: abiRecord.signature,
    canonicalSignature: abiRecord.signature,
    selector: abiRecord.selector,
    visibility: "public",
    stateMutability: abiRecord.stateMutability,
    virtual: false,
    inputs: abiRecord.inputs,
    outputs: abiRecord.outputs,
    modifiers: [],
    natspec: variable.natspec,
    range: variable.range,
    syntheticGetter: true,
  };
}

function materializeGetter(definition, variable, abiRecord) {
  const getter = getterDeclaration(definition, variable, abiRecord);
  const existing = definition.members.functions.find(
    (record) => record.id === getter.id
  );
  if (existing) {
    invariant(
      existing.syntheticGetter &&
        existing.canonicalSignature === getter.canonicalSignature,
      `${getter.id}: synthetic getter conflicts with an existing declaration.`
    );
    return existing;
  }
  definition.members.functions.push(getter);
  return getter;
}

function reconcileDeclarationWithAbi(definition, declaration, kind, abiRecord) {
  invariant(
    declaration.name === abiRecord.name,
    `${definition.semanticId}: ${kind} hash resolved to a different declaration name.`
  );
  if (declaration.canonicalSignature !== null) {
    invariant(
      declaration.canonicalSignature === abiRecord.signature,
      `${declaration.id}: compiler ABIs disagree on the canonical signature.`
    );
    return declaration;
  }
  declaration.canonicalSignature = abiRecord.signature;
  if (kind === "event") {
    declaration.id = declarationSemanticId(
      definition.semanticId,
      kind,
      abiRecord.signature
    );
    declaration.key = encodeSemanticKey(declaration.id);
  }
  return declaration;
}

function reconcileFunctionWithAbi(definition, declaration, abiRecord) {
  invariant(
    declaration.name === abiRecord.name,
    `${definition.semanticId}: function selector resolved to a different declaration name.`
  );
  if (declaration.selector === null) {
    declaration.selector = abiRecord.selector;
    declaration.id = declarationSemanticId(
      definition.semanticId,
      "function",
      abiRecord.selector
    );
    declaration.key = encodeSemanticKey(declaration.id);
  } else {
    if (
      definition.contractKind === "library" &&
      declaration.selector !== abiRecord.selector
    ) {
      abiRecord.canonicalAbiSelector = abiRecord.selector;
      abiRecord.selector = declaration.selector;
      abiRecord.selectorSource = "compiler_ast_library";
    } else {
      invariant(
        declaration.selector === abiRecord.selector,
        `${declaration.id}: compiler ABIs disagree on the function selector.`
      );
    }
  }
  if (declaration.canonicalSignature === null) {
    declaration.canonicalSignature = abiRecord.signature;
  } else {
    invariant(
      declaration.canonicalSignature === abiRecord.signature,
      `${declaration.id}: compiler ABIs disagree on the canonical signature.`
    );
  }
  return declaration;
}

function abiSurface(rawDefinitions, definition, output) {
  const abi = compilerAbi(output, definition.sourcePath, definition.name);
  const result = {
    functions: [],
    events: [],
    errors: [],
  };
  for (const item of abi) {
    if (!["function", "event", "error"].includes(item.type)) {
      continue;
    }
    const abiRecord = abiItemRecord(item);
    const resolved = declarationLookup(
      rawDefinitions,
      definition,
      item.type,
      abiRecord
    );
    invariant(
      resolved,
      `${definition.semanticId}: ABI ${item.type} ${abiRecord.signature} has no AST declaration in its inheritance chain.`
    );
    if (resolved.declaration.kind !== "function") {
      reconcileDeclarationWithAbi(
        resolved.definition,
        resolved.declaration,
        item.type,
        abiRecord
      );
    } else if (resolved.declaration.syntheticGetter) {
      const getterVariable = resolved.definition.members.stateVariables.find(
        (variable) => variable.selector === abiRecord.selector
      );
      invariant(
        getterVariable,
        `${resolved.definition.semanticId}: getter ${abiRecord.signature} has no state variable.`
      );
      resolved.declaration = materializeGetter(
        resolved.definition,
        getterVariable,
        abiRecord
      );
    } else {
      reconcileFunctionWithAbi(
        resolved.definition,
        resolved.declaration,
        abiRecord
      );
    }
    const surfaceRecord = {
      ...abiRecord,
      declarationId: resolved.declaration.id,
      declaringDefinitionId: resolved.definition.semanticId,
      inherited: resolved.definition.semanticId !== definition.semanticId,
    };
    result[`${item.type}s`].push(surfaceRecord);
  }
  for (const records of Object.values(result)) {
    records.sort((left, right) =>
      compareStrings(left.signature, right.signature)
    );
  }
  return result;
}

function topLevelSemanticId(sourcePath, kind, name) {
  const semanticId = `${sourcePath}#top-level:${kind}:${name}`;
  return {
    id: semanticId,
    key: encodeSemanticKey(semanticId),
  };
}

function topLevelVariableRecord(node, sourceRecord, source) {
  const identity = topLevelSemanticId(
    sourceRecord.path,
    "variable",
    node.name ?? ""
  );
  const range = astRange(node, sourceRecord, source);
  const valueRange = node.value
    ? astRange(node.value, sourceRecord, source)
    : null;
  return {
    ...identity,
    kind: "variable",
    nodeType: node.nodeType,
    name: node.name ?? "",
    type: displayType(node.typeName),
    typeString: node.typeDescriptions?.typeString ?? null,
    visibility: node.visibility ?? null,
    constant: Boolean(node.constant),
    immutable: node.mutability === "immutable",
    storageLocation:
      node.storageLocation && node.storageLocation !== "default"
        ? node.storageLocation
        : null,
    valueRange,
    valueSource: valueRange
      ? sourceRecord.buffer
          .subarray(
            valueRange.byteStart,
            valueRange.byteStart + valueRange.byteLength
          )
          .toString("utf8")
      : null,
    natspec: readDocumentation(node.documentation),
    range,
  };
}

function topLevelDeclarationRecord(node, sourceRecord, source) {
  const pseudoDefinitionId = `${sourceRecord.path}#top-level`;
  if (node.nodeType === "StructDefinition") {
    return {
      ...topLevelSemanticId(sourceRecord.path, "struct", node.name),
      kind: "struct",
      nodeType: node.nodeType,
      canonicalName: node.canonicalName ?? node.name,
      visibility: node.visibility ?? null,
      ...namedMemberRecord(node, sourceRecord, source),
    };
  }
  if (node.nodeType === "EnumDefinition") {
    return {
      ...topLevelSemanticId(sourceRecord.path, "enum", node.name),
      kind: "enum",
      nodeType: node.nodeType,
      canonicalName: node.canonicalName ?? node.name,
      ...namedMemberRecord(node, sourceRecord, source),
    };
  }
  if (node.nodeType === "UserDefinedValueTypeDefinition") {
    return {
      ...topLevelSemanticId(
        sourceRecord.path,
        "userDefinedValueType",
        node.name
      ),
      kind: "userDefinedValueType",
      nodeType: node.nodeType,
      canonicalName: node.canonicalName ?? node.name,
      ...namedMemberRecord(node, sourceRecord, source),
    };
  }
  if (node.nodeType === "FunctionDefinition") {
    const declaration = functionDeclaration(
      node,
      pseudoDefinitionId,
      sourceRecord,
      source
    );
    return {
      ...declaration,
      id: topLevelSemanticId(
        sourceRecord.path,
        "function",
        declaration.displaySignature
      ).id,
      key: topLevelSemanticId(
        sourceRecord.path,
        "function",
        declaration.displaySignature
      ).key,
      nodeType: node.nodeType,
    };
  }
  if (
    node.nodeType === "EventDefinition" ||
    node.nodeType === "ErrorDefinition"
  ) {
    const kind = node.nodeType === "EventDefinition" ? "event" : "error";
    const declaration = eventOrErrorDeclaration(
      node,
      pseudoDefinitionId,
      kind,
      sourceRecord,
      source
    );
    const identity = topLevelSemanticId(
      sourceRecord.path,
      kind,
      declaration.displaySignature
    );
    return {
      ...declaration,
      ...identity,
      nodeType: node.nodeType,
    };
  }
  if (node.nodeType === "VariableDeclaration") {
    return topLevelVariableRecord(node, sourceRecord, source);
  }
  throw new Error(
    `${sourceRecord.path}: unsupported top-level declaration ${node.nodeType}.`
  );
}

function collectGenesisNames(genesisProfile) {
  const names = new Set();
  for (const entry of genesisProfile.entries ?? []) {
    for (const name of entry.implementation?.names ?? []) {
      names.add(name);
    }
  }
  for (const entry of genesisProfile.factory_spawned_exclusions ?? []) {
    for (const name of entry.implementation?.names ?? []) {
      names.add(name);
    }
    if (typeof entry.requirement === "string") {
      names.add(entry.requirement);
    }
  }
  return names;
}

function createClassificationContext(config, artifacts) {
  const catalog = artifacts["release-artifacts/contracts.json"].json;
  const genesis =
    artifacts["release-artifacts/genesis-deployment-profile.json"].json;
  return {
    productionContracts: new Set(
      (catalog.production_contracts ?? []).map(
        (entry) => `${entry.source}:${entry.name}`
      )
    ),
    publishedInterfaces: new Set(
      (catalog.interfaces ?? []).map((entry) => `${entry.source}:${entry.name}`)
    ),
    genesisNames: collectGenesisNames(genesis),
    vendoredSourcePaths: new Set(
      config.classification.vendoredSourcePaths ?? []
    ),
    legacySourcePaths: new Set(config.classification.legacySourcePaths ?? []),
    excludedDefinitions: new Map(
      (config.classification.excludedDefinitions ?? []).map((entry) => [
        entry.id,
        entry,
      ])
    ),
  };
}

function prepareDefinitions(config, sources, compilerOutput, artifacts) {
  assertCompilerSourceSet(sources, compilerOutput);
  const rawDefinitions = new Map();
  const seenSemanticIds = new Set();
  const classificationContext = createClassificationContext(config, artifacts);
  for (const [sourcePath, compiledSource] of Object.entries(
    compilerOutput.sources ?? {}
  )) {
    const sourceRecord = sources.get(sourcePath);
    invariant(sourceRecord, `Compiler emitted unknown source: ${sourcePath}`);
    invariant(
      compiledSource.ast?.nodeType === "SourceUnit",
      `${sourcePath}: compiler AST is missing.`
    );
    for (const node of compiledSource.ast.nodes ?? []) {
      if (node.nodeType !== "ContractDefinition") {
        if (
          ["PragmaDirective", "ImportDirective", "UsingForDirective"].includes(
            node.nodeType
          )
        ) {
          continue;
        }
        sourceRecord.topLevelDeclarations.push(
          topLevelDeclarationRecord(node, sourceRecord, config.source)
        );
        continue;
      }
      const semanticId = definitionSemanticId(sourcePath, node.name);
      invariant(
        !seenSemanticIds.has(semanticId),
        `Duplicate definition semantic ID: ${semanticId}`
      );
      seenSemanticIds.add(semanticId);
      const raw = {
        node,
        astId: node.id,
        semanticId,
        key: encodeSemanticKey(semanticId),
        name: node.name,
        sourcePath,
        scope: sourceScope(sourcePath, config.source.roots),
        contractKind: node.contractKind,
        abstract: Boolean(node.abstract),
        sourceRecord,
      };
      raw.members = localMembers(node, semanticId, sourceRecord, config.source);
      raw.classification = classificationFor(raw, classificationContext);
      rawDefinitions.set(node.id, raw);
      sourceRecord.definitionIds.push(semanticId);
    }
  }
  return { rawDefinitions, classificationContext };
}

function releaseMetadata(definition, artifacts) {
  const surface =
    artifacts["release-artifacts/latest/protocol-surface-report.json"].json;
  const interfaceIds =
    artifacts["release-artifacts/latest/interface-ids.json"].json;
  const releaseContract = surface.contracts?.[definition.name];
  const interfaceRecord = interfaceIds.interfaces?.[definition.name];
  const metadata = {};
  if (releaseContract?.source === definition.sourcePath) {
    metadata.release = {
      tracked: true,
      abiSha256: releaseContract.abi_sha256,
      bytecodeSha256: releaseContract.bytecode_sha256,
      deployedBytecodeSha256: releaseContract.deployed_bytecode_sha256,
      deployedBytecodeSizeBytes: releaseContract.deployed_bytecode_size_bytes,
      summary: releaseContract.summary,
    };
  } else {
    metadata.release = { tracked: false };
  }
  if (interfaceRecord?.source === definition.sourcePath) {
    metadata.interface = {
      published: true,
      interfaceId: interfaceRecord.interface_id ?? null,
      interfaceIdSource: interfaceRecord.interface_id_source ?? null,
      abiSha256: interfaceRecord.abi_sha256 ?? null,
    };
  } else {
    metadata.interface = { published: false };
  }
  return metadata;
}

function releaseCatalogMembership(definitionId, classificationContext) {
  if (classificationContext.productionContracts.has(definitionId)) {
    return "production_contract";
  }
  if (classificationContext.publishedInterfaces.has(definitionId)) {
    return "published_interface";
  }
  return null;
}

function finalDefinitionRecord(
  rawDefinitions,
  definition,
  artifacts,
  classificationContext,
  source
) {
  const inheritance = (definition.node.baseContracts ?? []).map((base) => {
    const referenced = rawDefinitions.get(base.baseName?.referencedDeclaration);
    return {
      name:
        base.baseName?.namePath ??
        base.baseName?.name ??
        referenced?.name ??
        "unknown",
      definitionId: referenced?.semanticId ?? null,
    };
  });
  const members = definition.members;
  for (const collection of Object.values(members)) {
    collection.sort((left, right) => {
      const leftLine = left.range?.lineStart ?? 0;
      const rightLine = right.range?.lineStart ?? 0;
      return leftLine - rightLine || compareStrings(left.name, right.name);
    });
  }
  const membershipId = `${definition.sourcePath}:${definition.name}`;
  return {
    id: definition.semanticId,
    key: definition.key,
    name: definition.name,
    sourcePath: definition.sourcePath,
    scope: definition.scope,
    kind: definition.contractKind,
    abstract: definition.abstract,
    classification: definition.classification.classification,
    classificationReason: definition.classification.reason,
    membership: {
      releaseCatalog: releaseCatalogMembership(
        membershipId,
        classificationContext
      ),
      genesisTarget: classificationContext.genesisNames.has(definition.name),
      deployment: {
        status: "not_deployed",
        address: null,
      },
    },
    inheritance,
    linearizedDefinitionIds: (
      definition.node.linearizedBaseContracts ?? [definition.node.id]
    )
      .map((astId) => rawDefinitions.get(astId)?.semanticId)
      .filter(Boolean),
    natspec: readDocumentation(definition.node.documentation),
    range: astRange(definition.node, definition.sourceRecord, source),
    declarations: members,
    abiSurface: definition.abiSurface,
    ...releaseMetadata(definition, artifacts),
  };
}

function validateConfig(config) {
  invariant(
    config?.schemaVersion === "public-review.solidity-source.v1",
    "Unsupported Solidity source manifest schemaVersion."
  );
  invariant(
    SAFE_REVIEW_VALUE_PATTERN.test(config.reviewId),
    "reviewId must be a stable lowercase identifier."
  );
  invariant(
    SAFE_REVIEW_VALUE_PATTERN.test(config.reviewVersion),
    "reviewVersion must be a stable lowercase version."
  );
  invariant(
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.source?.repository),
    "source.repository must be an owner/name pair."
  );
  invariant(
    EXACT_COMMIT_PATTERN.test(config.source?.commit),
    "source.commit must be a full lowercase 40-character Git commit."
  );
  invariant(
    EXACT_TREE_PATTERN.test(config.source?.tree),
    "source.tree must be a full lowercase 40-character Git tree."
  );
  invariant(
    typeof config.source?.compilerVersion === "string" &&
      config.source.compilerVersion.length > 0,
    "source.compilerVersion is required."
  );
  invariant(
    typeof config.source?.evmVersion === "string" &&
      config.source.evmVersion.length > 0,
    "source.evmVersion is required."
  );
  invariant(
    typeof config.source?.viaIR === "boolean",
    "source.viaIR must be a boolean."
  );
  invariant(
    typeof config.source?.optimizer?.enabled === "boolean" &&
      Number.isSafeInteger(config.source.optimizer?.runs) &&
      config.source.optimizer.runs >= 0,
    "source.optimizer must contain boolean enabled and nonnegative integer runs."
  );
  invariant(
    Array.isArray(config.source?.roots) && config.source.roots.length > 0,
    "At least one source root is required."
  );
  const scopes = new Set();
  for (const root of config.source.roots) {
    invariant(
      isSafeRepositoryPath(root.path),
      `Unsafe source root: ${root.path}`
    );
    invariant(
      ["protocol", "test", "script"].includes(root.scope),
      `Unsupported source scope: ${root.scope}`
    );
    invariant(!scopes.has(root.scope), `Duplicate source scope: ${root.scope}`);
    scopes.add(root.scope);
  }
  invariant(
    Array.isArray(config.releaseArtifacts) &&
      config.releaseArtifacts.length > 0,
    "At least one release artifact is required."
  );
  for (const artifact of config.releaseArtifacts) {
    invariant(
      isSafeRepositoryPath(artifact.path),
      `Unsafe release artifact path: ${artifact.path}`
    );
    invariant(
      typeof artifact.schemaVersion === "string" &&
        artifact.schemaVersion.length > 0,
      `${artifact.path}: schemaVersion is required.`
    );
  }
  invariant(
    isSafeRepositoryPath(config.output.directory),
    "output.directory must be repository-relative."
  );
  invariant(
    isSafeRepositoryPath(config.output.indexFile),
    "output.indexFile must be repository-relative."
  );
  invariant(
    isSafeRepositoryPath(config.output.bundleFile),
    "output.bundleFile must be repository-relative."
  );
  invariant(
    isSafeRepositoryPath(config.output.definitionsDirectory),
    "output.definitionsDirectory must be repository-relative."
  );
  invariant(
    isSafeRepositoryPath(config.output.sourcesDirectory),
    "output.sourcesDirectory must be repository-relative."
  );
  const canonicalOutputBase = `public/review-data/${config.reviewId}`;
  invariant(
    normalizePath(config.output.directory) ===
      `${canonicalOutputBase}/versions/${config.reviewVersion}`,
    "output.directory must use the canonical public review version path."
  );
  invariant(
    normalizePath(config.output.indexFile) ===
      `${canonicalOutputBase}/index.json`,
    "output.indexFile must use the canonical public review index path."
  );
  invariant(
    config.output.bundleFile === "reference-manifest.json" &&
      config.output.definitionsDirectory === "definitions" &&
      config.output.sourcesDirectory === "sources",
    "output bundle, definition, and source names must use canonical public review paths."
  );
  invariant(
    path.posix.basename(config.output.directory) === config.reviewVersion,
    "output.directory must end with reviewVersion."
  );
  invariant(
    Array.isArray(config.output.retainedVersions) &&
      config.output.retainedVersions.length > 0,
    "output.retainedVersions must list every immutable review version."
  );
  const retainedVersions = [...config.output.retainedVersions];
  invariant(
    retainedVersions.every((version) =>
      SAFE_REVIEW_VALUE_PATTERN.test(version)
    ),
    "output.retainedVersions contains an unsafe review version."
  );
  invariant(
    new Set(retainedVersions).size === retainedVersions.length,
    "output.retainedVersions contains a duplicate review version."
  );
  invariant(
    retainedVersions.includes(config.reviewVersion),
    "output.retainedVersions must include reviewVersion."
  );
}

function validateReleaseArtifactManifest(artifacts) {
  const releaseManifest =
    artifacts["release-artifacts/latest/release-artifact-manifest.json"].json;
  const manifestArtifacts = releaseManifest.artifacts ?? {};
  const expectedManifestPaths =
    Object.keys(manifestArtifacts).sort(compareStrings);
  invariant(
    stableJson(expectedManifestPaths) ===
      stableJson([
        "abi-checksums.json",
        "event-topic-catalog.json",
        "interface-ids.json",
      ]),
    "Release artifact manifest file set drifted."
  );
  for (const artifactName of expectedManifestPaths) {
    const record = manifestArtifacts[artifactName];
    const artifactPath = `release-artifacts/latest/${artifactName}`;
    invariant(
      record?.path === artifactName &&
        artifacts[artifactPath]?.sha256 === record.sha256,
      `${artifactPath}: release artifact manifest digest drifted.`
    );
  }
}

function validateArtifacts(config, artifacts) {
  for (const expected of config.releaseArtifacts) {
    const artifact = artifacts[expected.path];
    invariant(artifact, `Missing release artifact: ${expected.path}`);
    invariant(
      artifact.json?.schema_version === expected.schemaVersion,
      `${expected.path}: expected schema ${expected.schemaVersion}, got ${artifact.json?.schema_version}.`
    );
  }
  const catalog = artifacts["release-artifacts/contracts.json"].json;
  const surface =
    artifacts["release-artifacts/latest/protocol-surface-report.json"].json;
  const releaseNames = (catalog.production_contracts ?? [])
    .map((entry) => entry.name)
    .sort();
  const surfaceNames = Object.keys(surface.contracts ?? {}).sort();
  invariant(
    JSON.stringify(releaseNames) === JSON.stringify(surfaceNames),
    "Production contract catalog and protocol surface contract sets disagree."
  );
  const sourceVerification =
    artifacts["release-artifacts/latest/source-verification-inputs.json"].json;
  const toolchain = sourceVerification.toolchain ?? {};
  const exactToolchain = {
    compilerVersions: toolchain.compiler_versions,
    evmVersions: toolchain.evm_versions,
    optimizerEnabled: toolchain.optimizer_enabled,
    optimizerRuns: toolchain.optimizer_runs,
    viaIR: toolchain.via_ir,
  };
  const expectedToolchain = {
    compilerVersions: [config.source.compilerVersion],
    evmVersions: [config.source.evmVersion],
    optimizerEnabled: [config.source.optimizer.enabled],
    optimizerRuns: [config.source.optimizer.runs],
    viaIR: [config.source.viaIR],
  };
  invariant(
    stableJson(exactToolchain) === stableJson(expectedToolchain),
    "Source verification toolchain disagrees with the exact compiler input manifest."
  );

  validateReleaseArtifactManifest(artifacts);
}

function validateSourceVerification(sources, artifacts, config) {
  const verification =
    artifacts["release-artifacts/latest/source-verification-inputs.json"].json;
  const verifiedSourcePaths = new Set();
  for (const [sourcePath, entry] of Object.entries(
    verification.source_files ?? {}
  )) {
    const source = sources.get(sourcePath);
    invariant(
      source,
      `Source verification references missing file: ${sourcePath}`
    );
    invariant(
      source.sha256 === entry.sha256,
      `${sourcePath}: Git blob checksum disagrees with source verification input.`
    );
    verifiedSourcePaths.add(sourcePath);
  }
  for (const [name, contract] of Object.entries(verification.contracts ?? {})) {
    const source = sources.get(contract.source);
    invariant(
      contract.compiler_version === config.source.compilerVersion &&
        contract.settings?.evm_version === config.source.evmVersion &&
        stableJson(contract.settings?.optimizer) ===
          stableJson(config.source.optimizer) &&
        contract.settings?.via_ir === config.source.viaIR,
      `${name}: source verification compiler settings drifted.`
    );
    invariant(
      verifiedSourcePaths.has(contract.source) &&
        source?.sha256 === contract.source_sha256,
      `${name}: source verification contract source identity or checksum drifted.`
    );
  }
}

function canonicalAbiJsonSha256(abi) {
  const foundryOrder = {
    constructor: 0,
    fallback: 1,
    receive: 2,
    function: 3,
    event: 4,
    error: 5,
  };
  const ordered = [...abi].sort(
    (left, right) =>
      (foundryOrder[left.type] ?? Number.MAX_SAFE_INTEGER) -
      (foundryOrder[right.type] ?? Number.MAX_SAFE_INTEGER)
  );
  return sha256Urn(JSON.stringify(canonicalize(ordered)));
}

function normalizeSurfaceParameter(parameter, includeIndexed = false) {
  return {
    index: parameter.index,
    name: parameter.name ?? "",
    type: parameter.type,
    internalType:
      parameter.internalType ?? parameter.internal_type ?? parameter.type,
    ...(includeIndexed ? { indexed: Boolean(parameter.indexed) } : {}),
  };
}

function canonicalSurfaceRecord(record, kind) {
  const common = {
    name: record.name,
    signature: record.signature,
    inputs: (record.inputs ?? []).map((input) =>
      normalizeSurfaceParameter(input, kind === "event")
    ),
  };
  if (kind === "function") {
    const stateMutability =
      record.stateMutability ?? record.state_mutability ?? "nonpayable";
    return {
      ...common,
      selector: record.selector,
      stateMutability,
      outputs: (record.outputs ?? []).map((output) =>
        normalizeSurfaceParameter(output)
      ),
      payable: Boolean(record.payable ?? stateMutability === "payable"),
      posture:
        record.posture ??
        (["pure", "view"].includes(stateMutability) ? "read" : "write"),
    };
  }
  if (kind === "event") {
    return {
      ...common,
      topic0: record.topic0 ?? null,
      anonymous: Boolean(record.anonymous),
    };
  }
  return {
    ...common,
    selector: record.selector,
  };
}

function canonicalSurfaceRecords(records, kind, label) {
  const normalized = records
    .map((record) => canonicalSurfaceRecord(record, kind))
    .sort((left, right) => compareStrings(left.signature, right.signature));
  const identities = normalized.map((record) => record.signature);
  invariant(
    new Set(identities).size === identities.length,
    `${label} contains a duplicate signature.`
  );
  return normalized;
}

function assertCanonicalSurfaceEqual(expected, actual, kind, label) {
  invariant(
    stableJson(canonicalSurfaceRecords(expected, kind, `${label} expected`)) ===
      stableJson(canonicalSurfaceRecords(actual, kind, `${label} actual`)),
    `${label} semantic ABI surface disagrees.`
  );
}

function validateCustomErrorCatalog(surface, customErrors) {
  const expectedErrorCatalog = [];
  for (const [name, report] of Object.entries(surface.contracts ?? {})) {
    for (const error of report.custom_errors ?? []) {
      expectedErrorCatalog.push({
        contract: name,
        source: report.source,
        ...canonicalSurfaceRecord(error, "error"),
      });
    }
  }
  const actualErrorCatalog = (customErrors.entries ?? []).map((entry) => ({
    contract: entry.contract,
    source: entry.source,
    ...canonicalSurfaceRecord(entry, "error"),
  }));
  expectedErrorCatalog.sort((left, right) =>
    compareStrings(
      `${left.contract}:${left.signature}`,
      `${right.contract}:${right.signature}`
    )
  );
  actualErrorCatalog.sort((left, right) =>
    compareStrings(
      `${left.contract}:${left.signature}`,
      `${right.contract}:${right.signature}`
    )
  );
  invariant(
    new Set(
      actualErrorCatalog.map((entry) => `${entry.contract}:${entry.signature}`)
    ).size === actualErrorCatalog.length,
    "Custom error catalog contains duplicate contract/signature entries."
  );
  invariant(
    stableJson(actualErrorCatalog) === stableJson(expectedErrorCatalog),
    "Custom error catalog semantic entries disagree with the protocol surface."
  );
  const categoryCounts = {};
  const severityCounts = {};
  const selectorEntries = new Map();
  const contracts = new Set();
  for (const entry of customErrors.entries ?? []) {
    contracts.add(entry.contract);
    categoryCounts[entry.category] = (categoryCounts[entry.category] ?? 0) + 1;
    severityCounts[entry.severity] = (severityCounts[entry.severity] ?? 0) + 1;
    const ids = selectorEntries.get(entry.selector) ?? [];
    ids.push(`${entry.contract}:${entry.signature}`);
    selectorEntries.set(entry.selector, ids);
  }
  const duplicateSelectors = Object.fromEntries(
    [...selectorEntries.entries()]
      .filter(([, ids]) => ids.length > 1)
      .sort(([left], [right]) => compareStrings(left, right))
      .map(([selector, ids]) => [selector, ids.sort(compareStrings)])
  );
  const expectedSummary = {
    custom_error_count: actualErrorCatalog.length,
    contract_count: contracts.size,
    category_counts: categoryCounts,
    severity_counts: severityCounts,
    duplicate_selectors: duplicateSelectors,
  };
  invariant(
    stableJson(customErrors.summary) === stableJson(expectedSummary),
    "Custom error catalog summary disagrees with its entries."
  );
}

function assertEqualSets(left, right, label) {
  const missing = [...left].filter((value) => !right.has(value));
  const unexpected = [...right].filter((value) => !left.has(value));
  invariant(
    missing.length === 0 && unexpected.length === 0,
    `${label} disagrees (missing: ${missing.slice(0, 3).join(", ") || "none"}; unexpected: ${
      unexpected.slice(0, 3).join(", ") || "none"
    }).`
  );
}

function validateProtocolSurface(definitions, artifacts, compilerOutput) {
  const surface =
    artifacts["release-artifacts/latest/protocol-surface-report.json"].json;
  const abiChecksums =
    artifacts["release-artifacts/latest/abi-checksums.json"].json;
  const sourceVerification =
    artifacts["release-artifacts/latest/source-verification-inputs.json"].json;
  const customErrors =
    artifacts["release-artifacts/latest/custom-error-catalog.json"].json;
  const eventTopics =
    artifacts["release-artifacts/latest/event-topic-catalog.json"].json;
  const definitionsByName = new Map(
    definitions.map((definition) => [definition.name, definition])
  );
  const releaseNames = Object.keys(surface.contracts ?? {}).sort(
    compareStrings
  );
  invariant(
    stableJson(
      Object.keys(abiChecksums.contracts ?? {}).sort(compareStrings)
    ) === stableJson(releaseNames),
    "ABI checksum contract set disagrees with the protocol surface."
  );
  invariant(
    stableJson(
      Object.keys(abiChecksums.abi_hashes ?? {}).sort(compareStrings)
    ) === stableJson(releaseNames) &&
      stableJson(
        Object.keys(abiChecksums.bytecode_hashes ?? {}).sort(compareStrings)
      ) === stableJson(releaseNames),
    "ABI checksum aggregate maps disagree with the production contract set."
  );
  invariant(
    stableJson(
      Object.keys(sourceVerification.contracts ?? {}).sort(compareStrings)
    ) === stableJson(releaseNames),
    "Source verification contract set disagrees with the protocol surface."
  );
  let functionCount = 0;
  let eventCount = 0;
  let errorCount = 0;
  for (const [name, report] of Object.entries(surface.contracts ?? {})) {
    const definition = definitionsByName.get(name);
    invariant(
      definition?.sourcePath === report.source,
      `${name}: release surface has no exact generated definition.`
    );
    assertCanonicalSurfaceEqual(
      report.functions ?? [],
      definition.abiSurface.functions,
      "function",
      `${name} functions`
    );
    assertCanonicalSurfaceEqual(
      report.events ?? [],
      definition.abiSurface.events,
      "event",
      `${name} events`
    );
    assertCanonicalSurfaceEqual(
      report.custom_errors ?? [],
      definition.abiSurface.errors,
      "error",
      `${name} custom errors`
    );
    const abi = compilerAbi(
      compilerOutput,
      definition.sourcePath,
      definition.name
    );
    const abiSha256 = canonicalAbiJsonSha256(abi);
    const checksum = abiChecksums.contracts[name];
    const verification = sourceVerification.contracts[name];
    invariant(
      checksum?.source === definition.sourcePath &&
        report.abi_sha256 === abiSha256 &&
        checksum.abi_sha256 === abiSha256 &&
        abiChecksums.abi_hashes?.[name] === abiSha256 &&
        verification?.source === definition.sourcePath &&
        verification.abi_sha256 === abiSha256,
      `${name}: compiler ABI checksum disagrees with release evidence.`
    );
    invariant(
      checksum.abi_entries === abi.length &&
        checksum.function_count ===
          abi.filter((entry) => entry.type === "function").length &&
        checksum.event_count ===
          abi.filter((entry) => entry.type === "event").length &&
        checksum.constructor_count ===
          abi.filter((entry) => entry.type === "constructor").length,
      `${name}: ABI checksum counts disagree with compiler output.`
    );
    const expectedReportSummary = {
      function_count: report.functions?.length ?? 0,
      read_function_count: (report.functions ?? []).filter(
        (entry) => entry.posture === "read"
      ).length,
      write_function_count: (report.functions ?? []).filter(
        (entry) => entry.posture === "write"
      ).length,
      payable_function_count: (report.functions ?? []).filter(
        (entry) => entry.payable
      ).length,
      event_count: report.events?.length ?? 0,
      custom_error_count: report.custom_errors?.length ?? 0,
    };
    invariant(
      stableJson(report.summary) === stableJson(expectedReportSummary),
      `${name}: protocol surface summary disagrees with its ABI records.`
    );
    const constructor = abi.find((entry) => entry.type === "constructor");
    const expectedConstructor = constructor
      ? {
          present: true,
          state_mutability: constructor.stateMutability,
          inputs: (constructor.inputs ?? []).map((input, index) => ({
            index,
            name: input.name ?? "",
            type: canonicalAbiType(input),
            internal_type: input.internalType ?? input.type,
          })),
        }
      : { present: false, state_mutability: "not_applicable", inputs: [] };
    invariant(
      stableJson(verification.constructor) === stableJson(expectedConstructor),
      `${name}: source verification constructor ABI drifted.`
    );
    invariant(
      report.bytecode_sha256 === checksum.bytecode_sha256 &&
        report.deployed_bytecode_sha256 === checksum.deployed_bytecode_sha256 &&
        verification.bytecode_hashes?.creation?.sha256 ===
          checksum.bytecode_sha256 &&
        verification.bytecode_hashes?.runtime?.sha256 ===
          checksum.deployed_bytecode_sha256,
      `${name}: bytecode release evidence disagrees.`
    );
    invariant(
      abiChecksums.bytecode_hashes[name]?.creation?.sha256 ===
        checksum.bytecode_sha256 &&
        abiChecksums.bytecode_hashes[name]?.runtime?.sha256 ===
          checksum.deployed_bytecode_sha256,
      `${name}: ABI checksum bytecode aggregate drifted.`
    );
    functionCount += report.functions?.length ?? 0;
    eventCount += report.events?.length ?? 0;
    errorCount += report.custom_errors?.length ?? 0;
  }
  invariant(
    functionCount === surface.summary.function_count,
    "Protocol function total disagrees with the surface report."
  );
  invariant(
    eventCount === surface.summary.event_count,
    "Protocol event total disagrees with the surface report."
  );
  invariant(
    errorCount === surface.summary.custom_error_count,
    "Protocol custom error total disagrees with the surface report."
  );
  validateCustomErrorCatalog(surface, customErrors);

  const expectedEventContracts = {};
  const expectedTopics = new Map();
  for (const [name, report] of Object.entries(surface.contracts ?? {})) {
    const events = canonicalSurfaceRecords(
      report.events ?? [],
      "event",
      `${name} event report`
    );
    expectedEventContracts[name] = {
      source: report.source,
      events,
    };
    for (const event of events) {
      const topicKey = event.topic0 ?? `anonymous:${event.signature}`;
      const existing = expectedTopics.get(topicKey);
      const base = {
        topic0: event.topic0,
        signature: event.signature,
        name: event.name,
        anonymous: event.anonymous,
        inputs: event.inputs,
      };
      if (existing) {
        invariant(
          stableJson({
            topic0: existing.topic0,
            signature: existing.signature,
            name: existing.name,
            anonymous: existing.anonymous,
            inputs: existing.inputs,
          }) === stableJson(base),
          `${topicKey}: incompatible events share one topic catalog key.`
        );
        existing.emittedBy.push(name);
      } else {
        expectedTopics.set(topicKey, { ...base, emittedBy: [name] });
      }
    }
  }
  const actualEventContracts = Object.fromEntries(
    Object.entries(eventTopics.contracts ?? {}).map(([name, record]) => [
      name,
      {
        source: record.source,
        events: canonicalSurfaceRecords(
          record.events ?? [],
          "event",
          `${name} event catalog`
        ),
      },
    ])
  );
  invariant(
    stableJson(actualEventContracts) === stableJson(expectedEventContracts),
    "Event topic catalog contract surfaces disagree with the protocol surface."
  );
  const normalizedTopics = (eventTopics.topics ?? [])
    .map((entry) => ({
      topic0: entry.topic0 ?? null,
      signature: entry.signature,
      name: entry.name,
      anonymous: Boolean(entry.anonymous),
      inputs: (entry.inputs ?? []).map((input) =>
        normalizeSurfaceParameter(input, true)
      ),
      emittedBy: [...(entry.emitted_by ?? [])].sort(compareStrings),
    }))
    .sort((left, right) =>
      compareStrings(
        `${left.topic0 ?? ""}:${left.signature}`,
        `${right.topic0 ?? ""}:${right.signature}`
      )
    );
  const expectedTopicRecords = [...expectedTopics.values()]
    .map((entry) => ({
      ...entry,
      emittedBy: [...entry.emittedBy].sort(compareStrings),
    }))
    .sort((left, right) =>
      compareStrings(
        `${left.topic0 ?? ""}:${left.signature}`,
        `${right.topic0 ?? ""}:${right.signature}`
      )
    );
  invariant(
    new Set(
      normalizedTopics.map(
        (entry) => `${entry.topic0 ?? "anonymous"}:${entry.signature}`
      )
    ).size === normalizedTopics.length,
    "Event topic catalog contains duplicate topic/signature entries."
  );
  invariant(
    stableJson(normalizedTopics) === stableJson(expectedTopicRecords),
    "Event topic catalog aggregate entries disagree with the protocol surface."
  );
}

function selectorXor(records) {
  let result = 0;
  for (const record of records) {
    result ^= Number.parseInt(record.selector.slice(2), 16);
  }
  return `0x${(result >>> 0).toString(16).padStart(8, "0")}`;
}

function selectorSignatureSet(records) {
  return new Set(
    records.map((record) => `${record.selector}:${record.signature}`)
  );
}

function validatePublishedInterfaces(definitions, artifacts, compilerOutput) {
  const catalog = artifacts["release-artifacts/contracts.json"].json;
  const report = artifacts["release-artifacts/latest/interface-ids.json"].json;
  const definitionsById = new Map(
    definitions.map((definition) => [definition.id, definition])
  );
  const expectedIds = new Set(
    (catalog.interfaces ?? []).map((entry) => `${entry.source}:${entry.name}`)
  );
  const reportedIds = new Set();
  for (const [name, interfaceReport] of Object.entries(
    report.interfaces ?? {}
  )) {
    const definitionId = `${interfaceReport.source}:${name}`;
    reportedIds.add(definitionId);
    const definition = definitionsById.get(definitionId);
    invariant(
      definition?.kind === "interface",
      `${definitionId}: published interface has no exact generated definition.`
    );
    const expectedFunctions = selectorSignatureSet(
      interfaceReport.function_selectors ?? []
    );
    const actualFunctions = selectorSignatureSet(
      definition.abiSurface.functions
    );
    assertEqualSets(
      expectedFunctions,
      actualFunctions,
      `${name} interface functions`
    );
    invariant(
      selectorXor(definition.abiSurface.functions) ===
        interfaceReport.computed_selector_xor,
      `${name}: generated interface selector XOR drifted.`
    );
    invariant(
      report.interface_ids?.[name] === interfaceReport.interface_id,
      `${name}: interface ID summary drifted.`
    );
    invariant(
      canonicalAbiJsonSha256(
        compilerAbi(compilerOutput, definition.sourcePath, definition.name)
      ) === interfaceReport.abi_sha256,
      `${name}: published interface ABI checksum drifted.`
    );
  }
  assertEqualSets(expectedIds, reportedIds, "Published interface catalog");
}

function signatureArity(signature) {
  const start = signature.indexOf("(");
  const end = signature.lastIndexOf(")");
  invariant(start >= 0 && end >= start, `Invalid ABI signature: ${signature}`);
  const parameters = signature.slice(start + 1, end);
  if (parameters === "") {
    return 0;
  }
  let depth = 0;
  let count = 1;
  for (const character of parameters) {
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
    } else if (character === "," && depth === 0) {
      count += 1;
    }
  }
  return count;
}

function lineHasNatSpec(lines, declarationIndex) {
  let index = declarationIndex - 1;
  while (index >= 0 && lines[index].trim() === "") {
    index -= 1;
  }
  if (index < 0) {
    return false;
  }
  const preceding = lines[index].trim();
  if (preceding.startsWith("///")) {
    return true;
  }
  if (!preceding.endsWith("*/")) {
    return false;
  }
  while (index >= 0) {
    const candidate = lines[index].trim();
    if (candidate.startsWith("/**")) {
      return true;
    }
    if (candidate.startsWith("/*") && !candidate.startsWith("/**")) {
      return false;
    }
    index -= 1;
  }
  return false;
}

function declarationHeader(lines, startIndex) {
  const parts = [];
  for (
    let index = startIndex;
    index < Math.min(lines.length, startIndex + 40);
    index += 1
  ) {
    const line = lines[index].split("//", 1)[0].trim();
    if (line) {
      parts.push(line);
    }
    const joined = parts.join(" ");
    if (joined.includes("{") || joined.includes(";")) {
      return joined;
    }
  }
  return parts.join(" ");
}

function declarationParameterText(header) {
  const start = header.indexOf("(");
  if (start < 0) {
    return "";
  }
  let depth = 0;
  let value = "";
  for (const character of header.slice(start + 1)) {
    if (character === "(") {
      depth += 1;
      value += character;
    } else if (character === ")") {
      if (depth === 0) {
        break;
      }
      depth -= 1;
      value += character;
    } else {
      value += character;
    }
  }
  return value.trim();
}

function splitDeclarationParameters(parameters) {
  if (parameters === "") {
    return [];
  }
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < parameters.length; index += 1) {
    const character = parameters[index];
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
    } else if (character === "," && depth === 0) {
      parts.push(parameters.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(parameters.slice(start).trim());
  return parts;
}

function normalizedDeclarationParameterType(parameter) {
  const tokens = parameter
    .trim()
    .split(/\s+/)
    .filter(
      (token) =>
        !["calldata", "memory", "storage", "indexed", "payable"].includes(token)
    );
  if (tokens.length === 0) {
    return "";
  }
  if (!tokens[0].startsWith("(")) {
    return tokens[0];
  }
  let depth = 0;
  let value = "";
  for (const character of tokens.join(" ")) {
    value += character;
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth === 0) {
        break;
      }
    }
  }
  return value.replaceAll(" ", "");
}

function scanNatSpecDeclarations(sourceRecord) {
  const lines = normalizeLf(sourceRecord.text).split("\n");
  const declarations = [];
  const declarationPatterns = {
    function: /\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
    event: /\bevent\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
    custom_error: /\berror\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
  };
  const publicVariablePattern =
    /^\s*(?:mapping\s*\(.+\)|[A-Za-z_][A-Za-z0-9_[\].]*(?:\s+[A-Za-z_][A-Za-z0-9_[\].]*)*)\s+public\s+(?:constant\s+|immutable\s+)?([A-Za-z_][A-Za-z0-9_]*)\b/;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const [kind, pattern] of Object.entries(declarationPatterns)) {
      const match = pattern.exec(line);
      if (!match) {
        continue;
      }
      const header = declarationHeader(lines, index);
      const parameters = splitDeclarationParameters(
        declarationParameterText(header)
      );
      declarations.push({
        kind,
        name: match[1],
        signature: `${match[1]}(${parameters
          .map(normalizedDeclarationParameterType)
          .join(",")})`,
        arity: parameters.length,
        line: index + 1,
        natspec: lineHasNatSpec(lines, index),
      });
    }
    const variableMatch = publicVariablePattern.exec(line);
    if (variableMatch) {
      declarations.push({
        kind: "variable",
        name: variableMatch[1],
        signature: null,
        arity: null,
        line: index + 1,
        natspec: lineHasNatSpec(lines, index),
      });
    }
  }
  return declarations;
}

function natspecDeclarationForItem(declarationsBySource, item) {
  const candidates = (declarationsBySource.get(item.source) ?? []).filter(
    (declaration) => declaration.name === item.name
  );
  const exact = candidates.filter(
    (declaration) =>
      declaration.kind === item.kind && declaration.signature === item.signature
  );
  if (exact.length > 0) {
    return exact[0];
  }
  const arity = signatureArity(item.signature);
  const sameArity = candidates.filter(
    (declaration) =>
      declaration.kind === item.kind && declaration.arity === arity
  );
  if (sameArity.length === 1) {
    return sameArity[0];
  }
  const generatedGetter = candidates.find(
    (declaration) => declaration.kind === "variable"
  );
  if (generatedGetter) {
    return generatedGetter;
  }
  const sameKind = candidates.filter(
    (declaration) => declaration.kind === item.kind
  );
  return sameKind.length === 1 ? sameKind[0] : null;
}

function validateNatSpecBaseline(sources, artifacts) {
  const surface =
    artifacts["release-artifacts/latest/protocol-surface-report.json"].json;
  const baseline =
    artifacts["release-artifacts/baselines/v0.1.0/natspec-coverage.json"].json;
  const exclusions = baseline.exclusions ?? [];
  const exclusionsById = new Map();
  for (const exclusion of exclusions) {
    invariant(
      typeof exclusion.id === "string" &&
        exclusion.id.length > 0 &&
        !exclusionsById.has(exclusion.id),
      `NatSpec baseline contains a missing or duplicate exclusion ID: ${exclusion.id}.`
    );
    for (const field of [
      "contract",
      "source",
      "kind",
      "signature",
      "status",
      "reason",
      "follow_up",
    ]) {
      invariant(
        typeof exclusion[field] === "string" && exclusion[field].length > 0,
        `${exclusion.id}: NatSpec exclusion is missing ${field}.`
      );
    }
    exclusionsById.set(exclusion.id, exclusion);
  }
  const declarationsBySource = new Map(
    [...sources.entries()].map(([sourcePath, sourceRecord]) => [
      sourcePath,
      scanNatSpecDeclarations(sourceRecord),
    ])
  );
  const gaps = [];
  for (const [contract, report] of Object.entries(surface.contracts ?? {})) {
    for (const [kind, reportField] of [
      ["function", "functions"],
      ["event", "events"],
      ["custom_error", "custom_errors"],
    ]) {
      for (const record of report[reportField] ?? []) {
        const item = {
          contract,
          source: report.source,
          kind,
          name: record.name,
          signature: record.signature,
        };
        const declaration = natspecDeclarationForItem(
          declarationsBySource,
          item
        );
        let status = null;
        if (!declaration) {
          status = "declaration_not_in_source";
        } else if (!declaration.natspec) {
          status =
            declaration.kind === "variable"
              ? "public_variable_getter_missing_natspec"
              : "missing_natspec";
        }
        if (status) {
          gaps.push({
            id: `${contract}:${kind}:${record.signature}`,
            contract,
            source: report.source,
            kind,
            signature: record.signature,
            status,
            line: declaration?.line ?? null,
          });
        }
      }
    }
  }
  gaps.sort((left, right) => compareStrings(left.id, right.id));
  const gapIds = new Set(gaps.map((gap) => gap.id));
  const missingExclusions = gaps
    .filter((gap) => !exclusionsById.has(gap.id))
    .map((gap) => gap.id);
  const staleExclusions = [...exclusionsById.keys()].filter(
    (id) => !gapIds.has(id)
  );
  invariant(
    missingExclusions.length === 0 && staleExclusions.length === 0,
    `NatSpec baseline exclusion set disagrees with generated release-surface coverage (missing: ${
      missingExclusions.slice(0, 3).join(", ") || "none"
    }; stale: ${staleExclusions.slice(0, 3).join(", ") || "none"}).`
  );
  for (const gap of gaps) {
    const exclusion = exclusionsById.get(gap.id);
    for (const field of [
      "contract",
      "source",
      "kind",
      "signature",
      "status",
      "line",
    ]) {
      invariant(
        exclusion[field] === gap[field],
        `${gap.id}: NatSpec baseline ${field} drifted (expected ${gap[field]}, got ${exclusion[field]}).`
      );
    }
  }
}

function warningRecords(definitions) {
  const warnings = [];
  for (const definition of definitions) {
    if (!definition.natspec) {
      warnings.push({
        category: "documentation",
        code: "MISSING_DEFINITION_NATSPEC",
        severity: "advisory",
        definitionId: definition.id,
      });
    }
    for (const declaration of definition.declarations.functions) {
      if (
        ["public", "external"].includes(declaration.visibility) &&
        !declaration.natspec
      ) {
        warnings.push({
          category: "documentation",
          code: "MISSING_FUNCTION_NATSPEC",
          severity: "advisory",
          definitionId: definition.id,
          declarationId: declaration.id,
        });
      }
    }
  }
  const deduplicated = new Map();
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.definitionId}:${
      warning.declarationId ?? ""
    }`;
    deduplicated.set(key, warning);
  }
  return [...deduplicated.values()].sort((left, right) =>
    compareStrings(
      `${left.code}:${left.declarationId ?? left.definitionId}`,
      `${right.code}:${right.declarationId ?? right.definitionId}`
    )
  );
}

function summarizeWarnings(warnings) {
  const byCategory = {};
  const byCode = {};
  for (const warning of warnings) {
    byCategory[warning.category] = (byCategory[warning.category] ?? 0) + 1;
    byCode[warning.code] = (byCode[warning.code] ?? 0) + 1;
  }
  return {
    totalCount: warnings.length,
    byCategory,
    byCode,
  };
}

function definitionShardRelativePath(config, definition) {
  return `${config.output.definitionsDirectory}/${definition.key}.json`;
}

function definitionShardPublicPath(config, relativePath) {
  return `/${normalizePath(
    `${config.output.directory}/${relativePath}`
  ).replace(/^public\//, "")}`;
}

function canonicalReviewVersionPublicPath(reviewId, reviewVersion) {
  return `/review-data/${reviewId}/versions/${reviewVersion}`;
}

function canonicalSourcePublicPath(reviewBasePath, sourcePath) {
  return `${reviewBasePath}/sources/${sourcePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function definitionIndexMetadata(definition, warningSummary) {
  const declarations = definition.declarations;
  return {
    id: definition.id,
    key: definition.key,
    name: definition.name,
    sourcePath: definition.sourcePath,
    scope: definition.scope,
    kind: definition.kind,
    abstract: definition.abstract,
    classification: definition.classification,
    classificationReason: definition.classificationReason,
    membership: definition.membership,
    range: definition.range,
    release: definition.release,
    interface: definition.interface,
    declarationCounts: {
      functions: (declarations.functions ?? []).length,
      events: (declarations.events ?? []).length,
      errors: (declarations.errors ?? []).length,
      modifiers: (declarations.modifiers ?? []).length,
      structs: (declarations.structs ?? []).length,
      enums: (declarations.enums ?? []).length,
      stateVariables: (declarations.stateVariables ?? []).length,
      userDefinedValueTypes: (declarations.userDefinedValueTypes ?? []).length,
    },
    abiSurfaceCounts: {
      functions: definition.abiSurface.functions.length,
      events: definition.abiSurface.events.length,
      errors: definition.abiSurface.errors.length,
    },
    warningSummary,
  };
}

function createDefinitionShards(config, definitions, warnings) {
  const warningsByDefinition = new Map();
  for (const warning of warnings) {
    const records = warningsByDefinition.get(warning.definitionId) ?? [];
    records.push(warning);
    warningsByDefinition.set(warning.definitionId, records);
  }
  const shards = new Map();
  const definitionIndex = [];
  for (const definition of definitions) {
    const definitionWarnings = warningsByDefinition.get(definition.id) ?? [];
    const shard = {
      shardSchemaVersion: DEFINITION_SHARD_SCHEMA_VERSION,
      reviewId: config.reviewId,
      reviewVersion: config.reviewVersion,
      definition,
      warnings: definitionWarnings,
      warningSummary: summarizeWarnings(definitionWarnings),
    };
    const buffer = Buffer.from(stableJson(shard));
    const relativePath = definitionShardRelativePath(config, definition);
    definitionIndex.push({
      ...definitionIndexMetadata(definition, shard.warningSummary),
      shardPath: definitionShardPublicPath(config, relativePath),
      shardSha256: sha256Urn(buffer),
    });
    shards.set(relativePath, { buffer, shard });
  }
  return { definitionIndex, shards };
}

function publicSourceRecord(source) {
  return {
    path: source.path,
    scope: source.scope,
    byteLength: source.byteLength,
    lineCount: source.lineCount,
    sha256: source.sha256,
    publicPath: source.publicPath,
    githubUrl: source.githubUrl,
    definitionIds: [...source.definitionIds].sort(),
    topLevelDeclarations: source.topLevelDeclarations,
  };
}

function createDeclarationIndex(definitions, files, definitionIndex) {
  const routesByDefinitionId = new Map(
    definitionIndex.map((entry) => [entry.id, entry])
  );
  const filesByPath = new Map(files.map((file) => [file.path, file]));
  const records = [];

  function addRecord({ declaration, definition = null, file, topLevel }) {
    const definitionRoute = definition
      ? routesByDefinitionId.get(definition.id)
      : null;
    invariant(
      !definition || definitionRoute,
      `${definition?.id}: declaration index definition route is missing.`
    );
    records.push({
      id: declaration.id,
      key: declaration.key,
      kind: declaration.kind,
      name: declaration.name,
      displaySignature: declaration.displaySignature,
      canonicalSignature: declaration.canonicalSignature,
      selector: declaration.selector ?? null,
      topic0: declaration.topic0 ?? null,
      syntheticGetter: Boolean(declaration.syntheticGetter),
      definitionId: definition?.id ?? null,
      definitionKey: definition?.key ?? null,
      definitionShardPath: definitionRoute?.shardPath ?? null,
      sourcePath: file.path,
      sourcePublicPath: file.publicPath,
      scope: file.scope,
      range: declaration.range,
      topLevel,
    });
  }

  for (const definition of definitions) {
    const file = filesByPath.get(definition.sourcePath);
    invariant(
      file,
      `${definition.id}: declaration index source route is missing.`
    );
    for (const kind of ["functions", "events", "errors"]) {
      for (const declaration of definition.declarations[kind] ?? []) {
        addRecord({ declaration, definition, file, topLevel: false });
      }
    }
  }
  for (const file of files) {
    for (const declaration of file.topLevelDeclarations ?? []) {
      if (!["function", "event", "error"].includes(declaration.kind)) {
        continue;
      }
      addRecord({ declaration, file, topLevel: true });
    }
  }

  return records.sort((left, right) => compareStrings(left.id, right.id));
}

function buildBundle({
  config,
  configSha256,
  generatorSha256,
  compiler,
  compilerOutput,
  sourceBuffers,
  artifacts,
  commitTimestamp,
}) {
  validateConfig(config);
  validateArtifacts(config, artifacts);
  const publicBasePath = `/${normalizePath(config.output.directory).replace(
    /^public\//,
    ""
  )}/${config.output.sourcesDirectory}`;
  const sources = new Map();
  for (const [sourcePath, buffer] of [...sourceBuffers.entries()].sort(
    ([left], [right]) => compareStrings(left, right)
  )) {
    const scope = sourceScope(sourcePath, config.source.roots);
    sources.set(
      sourcePath,
      createSourceRecord(
        sourcePath,
        scope,
        buffer,
        publicBasePath,
        config.source
      )
    );
  }
  validateSourceVerification(sources, artifacts, config);
  const { rawDefinitions, classificationContext } = prepareDefinitions(
    config,
    sources,
    compilerOutput,
    artifacts
  );
  for (const definition of rawDefinitions.values()) {
    definition.abiSurface = abiSurface(
      rawDefinitions,
      definition,
      compilerOutput
    );
  }
  const definitions = [...rawDefinitions.values()]
    .map((definition) =>
      finalDefinitionRecord(
        rawDefinitions,
        definition,
        artifacts,
        classificationContext,
        config.source
      )
    )
    .sort((left, right) => compareStrings(left.id, right.id));
  validateProtocolSurface(definitions, artifacts, compilerOutput);
  validatePublishedInterfaces(definitions, artifacts, compilerOutput);
  const files = [...sources.values()]
    .map(publicSourceRecord)
    .sort((left, right) => compareStrings(left.path, right.path));
  validateNatSpecBaseline(sources, artifacts);
  const artifactChecksums = Object.fromEntries(
    Object.entries(artifacts)
      .sort(([left], [right]) => compareStrings(left, right))
      .map(([artifactPath, artifact]) => [artifactPath, artifact.sha256])
  );
  const sourceChecksums = Object.fromEntries(
    files.map((file) => [file.path, file.sha256])
  );
  const classifications = {};
  for (const definition of definitions) {
    classifications[definition.classification] =
      (classifications[definition.classification] ?? 0) + 1;
  }
  const warnings = warningRecords(definitions);
  const { definitionIndex, shards: definitionShards } = createDefinitionShards(
    config,
    definitions,
    warnings
  );
  const declarationIndex = createDeclarationIndex(
    definitions,
    files,
    definitionIndex
  );
  const bundle = {
    bundleSchemaVersion: BUNDLE_SCHEMA_VERSION,
    reviewId: config.reviewId,
    reviewVersion: config.reviewVersion,
    source: {
      repository: config.source.repository,
      commit: config.source.commit,
      tree: config.source.tree,
      commitTimestamp,
      compiler,
      roots: config.source.roots,
      sourceChecksums,
      artifactChecksums,
    },
    generator: {
      name: GENERATOR_NAME,
      version: GENERATOR_VERSION,
      configSha256,
      sourceSha256: generatorSha256,
      outputSha256: null,
    },
    summary: {
      fileCount: files.length,
      topLevelDeclarationCount: files.reduce(
        (count, file) => count + file.topLevelDeclarations.length,
        0
      ),
      declarationCount: declarationIndex.length,
      definitionCount: definitions.length,
      contractCount: definitions.filter(
        (definition) => definition.kind === "contract"
      ).length,
      interfaceCount: definitions.filter(
        (definition) => definition.kind === "interface"
      ).length,
      libraryCount: definitions.filter(
        (definition) => definition.kind === "library"
      ).length,
      classifications,
      releaseSurface:
        artifacts["release-artifacts/latest/protocol-surface-report.json"].json
          .summary,
      warningCount: warnings.length,
    },
    declarationIndex,
    definitionIndex,
    files,
    warningSummary: summarizeWarnings(warnings),
  };
  bundle.generator.outputSha256 = bundleOutputSha256(bundle);
  return { bundle, definitionShards, sources };
}

function bundleOutputSha256(bundle) {
  const clone = {
    ...bundle,
    generator: {
      ...bundle.generator,
      outputSha256: null,
    },
  };
  return sha256Urn(stableJson(clone));
}

function validateAbiSurfaceDeclaration(surface, declaration) {
  invariant(
    declaration.canonicalSignature === surface.signature,
    `${surface.declarationId}: ABI surface canonical signature drifted.`
  );
  if (declaration.kind === "event") {
    const expectedTopic = surface.anonymous
      ? null
      : topicForSignature(surface.signature);
    invariant(
      declaration.topic0 === surface.topic0 && surface.topic0 === expectedTopic,
      `${surface.declarationId}: ABI surface event topic drifted.`
    );
    return;
  }
  const selectorMatchesSignature =
    surface.selectorSource === "compiler_ast_library" ||
    surface.selector === selectorForSignature(surface.signature);
  invariant(
    declaration.selector === surface.selector && selectorMatchesSignature,
    `${surface.declarationId}: ABI surface selector drifted.`
  );
  if (surface.selectorSource === "compiler_ast_library") {
    invariant(
      surface.canonicalAbiSelector === selectorForSignature(surface.signature),
      `${surface.declarationId}: library ABI selector provenance drifted.`
    );
  }
}

function validateBundle(bundle) {
  invariant(
    bundle?.bundleSchemaVersion === BUNDLE_SCHEMA_VERSION,
    "Generated bundle schema is unsupported."
  );
  invariant(
    bundle.generator?.name === GENERATOR_NAME &&
      bundle.generator?.version === GENERATOR_VERSION,
    "Generated bundle generator identity is unsupported."
  );
  invariant(
    SAFE_REVIEW_VALUE_PATTERN.test(bundle.reviewId) &&
      SAFE_REVIEW_VALUE_PATTERN.test(bundle.reviewVersion) &&
      /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(bundle.source?.repository) &&
      EXACT_COMMIT_PATTERN.test(bundle.source?.commit),
    "Generated bundle review or source identity is invalid."
  );
  invariant(
    bundle.generator.outputSha256 === bundleOutputSha256(bundle),
    "Generated bundle output checksum is invalid."
  );
  invariant(
    bundle.summary.fileCount === bundle.files.length,
    "Generated bundle file summary is invalid."
  );
  invariant(
    bundle.summary.definitionCount === bundle.definitionIndex.length,
    "Generated bundle definition summary is invalid."
  );
  invariant(
    Array.isArray(bundle.declarationIndex) &&
      bundle.summary.declarationCount === bundle.declarationIndex.length,
    "Generated bundle declaration summary is invalid."
  );
  const sourceChecksums = Object.fromEntries(
    bundle.files.map((file) => [file.path, file.sha256])
  );
  invariant(
    stableJson(bundle.source.sourceChecksums) === stableJson(sourceChecksums),
    "Generated bundle source checksum map is invalid."
  );
  invariant(
    new Set(bundle.files.map((file) => file.path)).size === bundle.files.length,
    "Generated bundle contains duplicate source paths."
  );
  const reviewBasePath = canonicalReviewVersionPublicPath(
    bundle.reviewId,
    bundle.reviewVersion
  );
  const topLevelIds = new Set();
  let topLevelDeclarationCount = 0;
  for (const file of bundle.files) {
    invariant(
      isSafeRepositoryPath(file.path) &&
        file.publicPath ===
          canonicalSourcePublicPath(reviewBasePath, file.path) &&
        file.githubUrl ===
          githubSourceUrl(
            bundle.source.repository,
            bundle.source.commit,
            file.path
          ),
      `${file.path}: generated source public or GitHub route drifted.`
    );
    for (const declaration of file.topLevelDeclarations ?? []) {
      invariant(
        typeof declaration.id === "string" &&
          declaration.key === encodeSemanticKey(declaration.id) &&
          !topLevelIds.has(declaration.id),
        `${file.path}: top-level declaration identity is invalid or duplicated.`
      );
      topLevelIds.add(declaration.id);
      invariant(
        declaration.range?.byteStart >= 0 &&
          declaration.range.byteLength >= 0 &&
          declaration.range.byteStart + declaration.range.byteLength <=
            file.byteLength &&
          declaration.range.sourceSha256 === file.sha256 &&
          declaration.range.githubUrl ===
            githubSourceUrl(
              bundle.source.repository,
              bundle.source.commit,
              file.path,
              declaration.range
            ),
        `${declaration.id}: top-level declaration source range drifted.`
      );
      topLevelDeclarationCount += 1;
    }
  }
  invariant(
    bundle.summary.topLevelDeclarationCount === topLevelDeclarationCount,
    "Generated bundle top-level declaration summary is invalid."
  );
  invariant(
    stableJson(bundle.files.map((file) => file.path)) ===
      stableJson(bundle.files.map((file) => file.path).sort(compareStrings)),
    "Generated bundle source files are not deterministically ordered."
  );
  const filesByPath = new Map(bundle.files.map((file) => [file.path, file]));
  const definitionIds = new Set();
  const shardPaths = new Set();
  const definitionsById = new Map();
  for (const definition of bundle.definitionIndex) {
    invariant(
      !definitionIds.has(definition.id),
      `Duplicate generated definition ID: ${definition.id}`
    );
    definitionIds.add(definition.id);
    invariant(
      definition.key === encodeSemanticKey(definition.id),
      `${definition.id}: definition key is not lossless base64url.`
    );
    invariant(
      typeof definition.shardPath === "string" &&
        definition.shardPath ===
          `${reviewBasePath}/definitions/${definition.key}.json` &&
        !shardPaths.has(definition.shardPath),
      `${definition.id}: definition shard path is invalid or duplicated.`
    );
    shardPaths.add(definition.shardPath);
    definitionsById.set(definition.id, definition);
    const definitionFile = filesByPath.get(definition.sourcePath);
    invariant(
      definitionFile &&
        definition.scope === definitionFile.scope &&
        definition.range?.byteStart >= 0 &&
        definition.range.byteLength >= 0 &&
        definition.range.byteStart + definition.range.byteLength <=
          definitionFile.byteLength &&
        definition.range.sourceSha256 === definitionFile.sha256 &&
        definition.range.githubUrl ===
          githubSourceUrl(
            bundle.source.repository,
            bundle.source.commit,
            definition.sourcePath,
            definition.range
          ),
      `${definition.id}: definition source route or range drifted.`
    );
    invariant(
      /^sha256:[0-9a-f]{64}$/.test(definition.shardSha256),
      `${definition.id}: definition shard checksum is invalid.`
    );
  }
  invariant(
    stableJson(bundle.definitionIndex.map((entry) => entry.id)) ===
      stableJson(
        bundle.definitionIndex.map((entry) => entry.id).sort(compareStrings)
      ),
    "Generated definition index is not deterministically ordered."
  );
  const declarationIds = new Set();
  for (const declaration of bundle.declarationIndex) {
    invariant(
      typeof declaration.id === "string" &&
        declaration.key === encodeSemanticKey(declaration.id) &&
        !declarationIds.has(declaration.id),
      `${declaration.id ?? "unknown"}: declaration index identity is invalid or duplicated.`
    );
    declarationIds.add(declaration.id);
    invariant(
      ["function", "event", "error"].includes(declaration.kind),
      `${declaration.id}: declaration index kind is invalid.`
    );
    const file = filesByPath.get(declaration.sourcePath);
    invariant(
      file &&
        declaration.sourcePublicPath === file.publicPath &&
        declaration.scope === file.scope &&
        declaration.range?.byteStart >= 0 &&
        declaration.range.byteLength >= 0 &&
        declaration.range.byteStart + declaration.range.byteLength <=
          file.byteLength &&
        declaration.range.sourceSha256 === file.sha256 &&
        declaration.range.githubUrl ===
          githubSourceUrl(
            bundle.source.repository,
            bundle.source.commit,
            declaration.sourcePath,
            declaration.range
          ),
      `${declaration.id}: declaration index source route or range drifted.`
    );
    if (declaration.topLevel) {
      invariant(
        declaration.definitionId === null &&
          declaration.definitionKey === null &&
          declaration.definitionShardPath === null,
        `${declaration.id}: top-level declaration has a definition route.`
      );
    } else {
      const definition = definitionsById.get(declaration.definitionId);
      invariant(
        definition &&
          declaration.definitionKey === definition.key &&
          declaration.definitionShardPath === definition.shardPath &&
          declaration.sourcePath === definition.sourcePath &&
          declaration.scope === definition.scope,
        `${declaration.id}: declaration definition route drifted.`
      );
    }
  }
  invariant(
    stableJson(bundle.declarationIndex.map((entry) => entry.id)) ===
      stableJson(
        bundle.declarationIndex.map((entry) => entry.id).sort(compareStrings)
      ),
    "Generated declaration index is not deterministically ordered."
  );
  const expectedTopLevelDeclarationIndex = createDeclarationIndex(
    [],
    bundle.files,
    []
  );
  invariant(
    stableJson(
      bundle.declarationIndex.filter((declaration) => declaration.topLevel)
    ) === stableJson(expectedTopLevelDeclarationIndex),
    "Generated top-level declaration index projection drifted."
  );
  const expectedKinds = {
    contractCount: bundle.definitionIndex.filter(
      (definition) => definition.kind === "contract"
    ).length,
    interfaceCount: bundle.definitionIndex.filter(
      (definition) => definition.kind === "interface"
    ).length,
    libraryCount: bundle.definitionIndex.filter(
      (definition) => definition.kind === "library"
    ).length,
  };
  for (const [field, count] of Object.entries(expectedKinds)) {
    invariant(
      bundle.summary[field] === count,
      `Generated bundle ${field} summary is invalid.`
    );
  }
  const classifications = {};
  for (const definition of bundle.definitionIndex) {
    classifications[definition.classification] =
      (classifications[definition.classification] ?? 0) + 1;
  }
  invariant(
    stableJson(bundle.summary.classifications) === stableJson(classifications),
    "Generated bundle classification summary is invalid."
  );
  const indexedBySource = new Map();
  for (const definition of bundle.definitionIndex) {
    const ids = indexedBySource.get(definition.sourcePath) ?? [];
    ids.push(definition.id);
    indexedBySource.set(definition.sourcePath, ids);
  }
  for (const file of bundle.files) {
    invariant(
      stableJson(file.definitionIds) ===
        stableJson((indexedBySource.get(file.path) ?? []).sort(compareStrings)),
      `${file.path}: generated source definition membership is invalid.`
    );
  }
  invariant(
    bundle.summary.warningCount === bundle.warningSummary.totalCount,
    "Generated bundle warning summary is invalid."
  );
}

function validateDefinitionRecords(definitions) {
  const definitionIds = new Set();
  const declarationIds = new Set();
  for (const definition of definitions) {
    invariant(
      !definitionIds.has(definition.id),
      `Duplicate generated definition ID: ${definition.id}`
    );
    definitionIds.add(definition.id);
    invariant(
      definition.key === encodeSemanticKey(definition.id),
      `${definition.id}: definition key is not lossless base64url.`
    );
    for (const kind of ["functions", "events", "errors"]) {
      for (const declaration of definition.declarations[kind] ?? []) {
        invariant(
          !declarationIds.has(declaration.id),
          `Duplicate generated declaration ID: ${declaration.id}`
        );
        declarationIds.add(declaration.id);
        invariant(
          declaration.key === encodeSemanticKey(declaration.id),
          `${declaration.id}: declaration key is not lossless base64url.`
        );
      }
    }
  }
  const declarationById = new Map();
  for (const definition of definitions) {
    for (const kind of ["functions", "events", "errors"]) {
      for (const declaration of definition.declarations[kind] ?? []) {
        declarationById.set(declaration.id, declaration);
      }
    }
  }
  for (const definition of definitions) {
    for (const kind of ["functions", "events", "errors"]) {
      for (const surface of definition.abiSurface[kind] ?? []) {
        const declaration = declarationById.get(surface.declarationId);
        invariant(
          declaration,
          `${definition.id}: ABI surface ${surface.signature} points to a missing declaration.`
        );
        validateAbiSurfaceDeclaration(surface, declaration);
      }
    }
  }
}

function validateDefinitionShards(bundle, definitionShards) {
  const indexedDefinitions = new Map(
    bundle.definitionIndex.map((entry) => [entry.id, entry])
  );
  const definitions = [];
  let warningCount = 0;
  const allWarnings = [];
  const seenDefinitions = new Set();
  for (const value of definitionShards.values()) {
    const shard = value.shard ?? value;
    const buffer = value.buffer ?? Buffer.from(stableJson(shard));
    invariant(
      shard.shardSchemaVersion === DEFINITION_SHARD_SCHEMA_VERSION,
      "Generated definition shard schema is unsupported."
    );
    invariant(
      shard.reviewId === bundle.reviewId &&
        shard.reviewVersion === bundle.reviewVersion,
      `${shard.definition?.id ?? "unknown"}: definition shard review identity drifted.`
    );
    const indexEntry = indexedDefinitions.get(shard.definition?.id);
    invariant(
      indexEntry,
      `${shard.definition?.id ?? "unknown"}: definition shard is not indexed.`
    );
    invariant(
      !seenDefinitions.has(shard.definition.id),
      `${shard.definition.id}: duplicate definition shard.`
    );
    seenDefinitions.add(shard.definition.id);
    invariant(
      sha256Urn(buffer) === indexEntry.shardSha256,
      `${shard.definition.id}: definition shard checksum drifted.`
    );
    invariant(
      stableJson(summarizeWarnings(shard.warnings)) ===
        stableJson(shard.warningSummary),
      `${shard.definition.id}: definition warning summary drifted.`
    );
    invariant(
      stableJson(indexEntry.warningSummary) ===
        stableJson(shard.warningSummary),
      `${shard.definition.id}: indexed warning summary drifted.`
    );
    const expectedMetadata = definitionIndexMetadata(
      shard.definition,
      shard.warningSummary
    );
    const actualMetadata = { ...indexEntry };
    delete actualMetadata.shardPath;
    delete actualMetadata.shardSha256;
    invariant(
      stableJson(actualMetadata) === stableJson(expectedMetadata),
      `${shard.definition.id}: definition index projection drifted.`
    );
    warningCount += shard.warnings.length;
    allWarnings.push(...shard.warnings);
    definitions.push(shard.definition);
  }
  invariant(
    seenDefinitions.size === indexedDefinitions.size,
    "Generated definition shard set is incomplete."
  );
  invariant(
    warningCount === bundle.summary.warningCount,
    "Generated definition shard warning total drifted."
  );
  invariant(
    stableJson(summarizeWarnings(allWarnings)) ===
      stableJson(bundle.warningSummary),
    "Generated definition shard warning summary drifted."
  );
  validateDefinitionRecords(definitions);
  invariant(
    stableJson(bundle.declarationIndex) ===
      stableJson(
        createDeclarationIndex(
          definitions,
          bundle.files,
          bundle.definitionIndex
        )
      ),
    "Generated declaration index projection drifted."
  );
}

function createIndexEntry(bundle, bundlePublicPath) {
  return {
    version: bundle.reviewVersion,
    commit: bundle.source.commit,
    tree: bundle.source.tree,
    bundlePath: bundlePublicPath,
    bundleSha256: bundle.generator.outputSha256,
  };
}

module.exports = {
  BUNDLE_SCHEMA_VERSION,
  DEFINITION_SHARD_SCHEMA_VERSION,
  GENERATOR_NAME,
  GENERATOR_VERSION,
  INDEX_SCHEMA_VERSION,
  assertEverySourceRootMatched,
  assertCompilerSourceSet,
  abiSignature,
  abiSurface,
  buildBundle,
  bundleOutputSha256,
  canonicalAbiType,
  canonicalAbiJsonSha256,
  canonicalize,
  compareStrings,
  compareReviewVersions,
  createIndexEntry,
  declarationSemanticId,
  decodeUtf8,
  definitionSemanticId,
  encodeSemanticKey,
  invariant,
  isSafeRepositoryPath,
  keccak256,
  normalizeLf,
  normalizePath,
  parseAstSourceRange,
  reconcileDeclarationWithAbi,
  scanNatSpecDeclarations,
  selectorForSignature,
  sha256Hex,
  sha256Urn,
  sourceLineCount,
  stableJson,
  topicForSignature,
  topLevelDeclarationRecord,
  validateBundle,
  validateConfig,
  validateCustomErrorCatalog,
  validateDefinitionShards,
  validateArtifacts,
  validateNatSpecBaseline,
  validateProtocolSurface,
  validateReleaseArtifactManifest,
  assertCanonicalSurfaceEqual,
};

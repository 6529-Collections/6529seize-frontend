"use strict";

const { createHash } = require("node:crypto");
const path = require("node:path");
const { TextDecoder } = require("node:util");

const BUNDLE_SCHEMA_VERSION = "public-review.solidity-reference.v2";
const DEFINITION_SHARD_SCHEMA_VERSION =
  "public-review.solidity-definition-shard.v1";
const INDEX_SCHEMA_VERSION = "public-review.solidity-reference-index.v1";
const GENERATOR_NAME = "6529-public-review-solidity-reference";
const GENERATOR_VERSION = "1";
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
const EXACT_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const EXACT_TREE_PATTERN = /^[0-9a-f]{40}$/;
const SAFE_REVIEW_VALUE_PATTERN = /^[a-z0-9][a-z0-9.-]*$/;
const KECCAK_MASK_64 = (1n << 64n) - 1n;
const KECCAK_RATE_BYTES = 136;
const KECCAK_ROTATION_OFFSETS = [
  0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21,
  8, 18, 2, 61, 56, 14,
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
  return (
    ((value << shift) | (value >> (64n - shift))) & KECCAK_MASK_64
  );
}

function keccakPermutation(state) {
  for (const roundConstant of KECCAK_ROUND_CONSTANTS) {
    const columnParity = Array.from({ length: 5 }, (_, x) =>
      [0, 1, 2, 3, 4].reduce(
        (value, y) => value ^ state[x + 5 * y],
        0n
      )
    );
    const theta = columnParity.map(
      (_, x) =>
        columnParity[(x + 4) % 5] ^
        rotateLane(columnParity[(x + 1) % 5], 1)
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
          ((~rotated[((x + 1) % 5) + 5 * y] & KECCAK_MASK_64) &
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
  invariant(isSafeRepositoryPath(sourcePath), `Unsafe source path: ${sourcePath}`);
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
    typeof selectorOrSignature === "string" &&
      selectorOrSignature.length > 0,
    `Missing ${kind} selector or signature for ${definitionId}.`
  );
  return `${definitionId}#${kind}:${selectorOrSignature}`;
}

function encodeSemanticKey(semanticId) {
  return Buffer.from(semanticId, "utf8").toString("base64url");
}

function canonicalAbiType(input) {
  const type = input?.type;
  invariant(typeof type === "string" && type.length > 0, "ABI type is missing.");
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
  const encodedPath = sourcePath
    .split("/")
    .map(encodeURIComponent)
    .join("/");
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
    lineStart >= 1 &&
      lineEnd >= lineStart &&
      lineEnd <= sourceRecord.lineCount,
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
  const hash = `0x${compilerHash}`;
  const semanticKey = kind === "event" ? displaySignature : hash;
  const semanticId = declarationSemanticId(
    definitionId,
    kind,
    semanticKey
  );
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
    record.members = (node.members ?? []).map((member, index) =>
      parameterRecord(member, index)
    );
  }
  if (node.nodeType === "EnumDefinition") {
    record.members = (node.members ?? []).map((member) => member.name);
  }
  if (node.nodeType === "UserDefinedValueTypeDefinition") {
    record.underlyingType = displayType(node.underlyingType);
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
          functionDeclaration(
            member,
            definitionId,
            sourceRecord,
            source
          )
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
            stateVariableRecord(
              member,
              definitionId,
              sourceRecord,
              source
            )
          );
        }
        break;
      case "UserDefinedValueTypeDefinition":
        result.userDefinedValueTypes.push(
          namedMemberRecord(member, sourceRecord, source)
        );
        break;
      default:
        break;
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
      reason: "Listed in release-artifacts/contracts.json production_contracts.",
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
      reason: "Source path is explicitly classified as vendored in the input manifest.",
    };
  }
  if (context.legacySourcePaths.has(raw.sourcePath)) {
    return {
      classification: "legacy_non_production_source",
      reason: "Source path is explicitly classified as legacy in the input manifest.",
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
    (root) =>
      sourcePath === root.path || sourcePath.startsWith(`${root.path}/`)
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
    return {
      ...common,
      topic0: topicForSignature(signature),
      anonymous: Boolean(item.anonymous),
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
          (record.selector === null ||
            candidate.contractKind === "library") &&
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
      left.signature.localeCompare(right.signature)
    );
  }
  return result;
}

function topLevelDeclarationRecord(node, sourceRecord, source) {
  return {
    kind: node.nodeType,
    name: node.name ?? "",
    range: astRange(node, sourceRecord, source),
  };
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
      (catalog.interfaces ?? []).map(
        (entry) => `${entry.source}:${entry.name}`
      )
    ),
    genesisNames: collectGenesisNames(genesis),
    vendoredSourcePaths: new Set(
      config.classification.vendoredSourcePaths ?? []
    ),
    legacySourcePaths: new Set(
      config.classification.legacySourcePaths ?? []
    ),
    excludedDefinitions: new Map(
      (config.classification.excludedDefinitions ?? []).map((entry) => [
        entry.id,
        entry,
      ])
    ),
  };
}

function prepareDefinitions(config, sources, compilerOutput, artifacts) {
  const rawDefinitions = new Map();
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
          !["PragmaDirective", "ImportDirective", "UsingForDirective"].includes(
            node.nodeType
          )
        ) {
          sourceRecord.topLevelDeclarations.push(
            topLevelDeclarationRecord(node, sourceRecord, config.source)
          );
        }
        continue;
      }
      const semanticId = definitionSemanticId(sourcePath, node.name);
      invariant(
        ![...rawDefinitions.values()].some(
          (entry) => entry.semanticId === semanticId
        ),
        `Duplicate definition semantic ID: ${semanticId}`
      );
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
      raw.members = localMembers(
        node,
        semanticId,
        sourceRecord,
        config.source
      );
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
      deployedBytecodeSizeBytes:
        releaseContract.deployed_bytecode_size_bytes,
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
    const referenced = rawDefinitions.get(
      base.baseName?.referencedDeclaration
    );
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
      return leftLine - rightLine || left.name.localeCompare(right.name);
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
  invariant(
    sourceVerification.toolchain?.compiler_versions?.includes(
      config.source.compilerVersion
    ),
    "Source verification compiler build disagrees with the input manifest."
  );
}

function validateSourceVerification(sources, artifacts) {
  const verification =
    artifacts["release-artifacts/latest/source-verification-inputs.json"].json;
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
  }
}

function surfaceSet(records, field) {
  return new Set(records.map((record) => `${record[field]}:${record.signature}`));
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

function validateProtocolSurface(definitions, artifacts) {
  const surface =
    artifacts["release-artifacts/latest/protocol-surface-report.json"].json;
  const customErrors =
    artifacts["release-artifacts/latest/custom-error-catalog.json"].json;
  const eventTopics =
    artifacts["release-artifacts/latest/event-topic-catalog.json"].json;
  const definitionsByName = new Map(
    definitions.map((definition) => [definition.name, definition])
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
    const expectedFunctions = surfaceSet(report.functions ?? [], "selector");
    const actualFunctions = surfaceSet(
      definition.abiSurface.functions,
      "selector"
    );
    assertEqualSets(expectedFunctions, actualFunctions, `${name} functions`);
    const expectedEvents = surfaceSet(report.events ?? [], "topic0");
    const actualEvents = surfaceSet(definition.abiSurface.events, "topic0");
    assertEqualSets(expectedEvents, actualEvents, `${name} events`);
    const expectedErrors = surfaceSet(
      report.custom_errors ?? [],
      "selector"
    );
    const actualErrors = surfaceSet(
      definition.abiSurface.errors,
      "selector"
    );
    assertEqualSets(expectedErrors, actualErrors, `${name} custom errors`);
    functionCount += expectedFunctions.size;
    eventCount += expectedEvents.size;
    errorCount += expectedErrors.size;
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
  invariant(
    customErrors.entries?.length === errorCount,
    "Custom error catalog total disagrees with the protocol surface."
  );
  const topicByHash = new Map(
    (eventTopics.topics ?? []).map((entry) => [entry.topic0, entry])
  );
  for (const [name, report] of Object.entries(surface.contracts ?? {})) {
    for (const event of report.events ?? []) {
      const catalogEntry = topicByHash.get(event.topic0);
      invariant(
        catalogEntry?.signature === event.signature &&
          catalogEntry.emitted_by?.includes(name),
        `${name}:${event.signature} disagrees with the event topic catalog.`
      );
    }
  }
}

function selectorXor(records) {
  let result = 0;
  for (const record of records) {
    result ^= Number.parseInt(record.selector.slice(2), 16);
  }
  return `0x${(result >>> 0).toString(16).padStart(8, "0")}`;
}

function validatePublishedInterfaces(definitions, artifacts) {
  const catalog = artifacts["release-artifacts/contracts.json"].json;
  const report =
    artifacts["release-artifacts/latest/interface-ids.json"].json;
  const definitionsById = new Map(
    definitions.map((definition) => [definition.id, definition])
  );
  const expectedIds = new Set(
    (catalog.interfaces ?? []).map(
      (entry) => `${entry.source}:${entry.name}`
    )
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
    const expectedFunctions = surfaceSet(
      interfaceReport.function_selectors ?? [],
      "selector"
    );
    const actualFunctions = surfaceSet(
      definition.abiSurface.functions,
      "selector"
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
  }
  assertEqualSets(
    expectedIds,
    reportedIds,
    "Published interface catalog"
  );
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
    `${left.code}:${left.declarationId ?? left.definitionId}`.localeCompare(
      `${right.code}:${right.declarationId ?? right.definitionId}`
    )
  );
}

function summarizeWarnings(warnings) {
  const byCategory = {};
  const byCode = {};
  for (const warning of warnings) {
    byCategory[warning.category] =
      (byCategory[warning.category] ?? 0) + 1;
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
    const declarations = definition.declarations;
    definitionIndex.push({
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
        functions: declarations.functions.length,
        events: declarations.events.length,
        errors: declarations.errors.length,
        modifiers: declarations.modifiers.length,
        structs: declarations.structs.length,
        enums: declarations.enums.length,
        stateVariables: declarations.stateVariables.length,
        userDefinedValueTypes: declarations.userDefinedValueTypes.length,
      },
      abiSurfaceCounts: {
        functions: definition.abiSurface.functions.length,
        events: definition.abiSurface.events.length,
        errors: definition.abiSurface.errors.length,
      },
      warningSummary: shard.warningSummary,
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
  const publicBasePath = `/${normalizePath(
    config.output.directory
  ).replace(/^public\//, "")}/${config.output.sourcesDirectory}`;
  const sources = new Map();
  for (const [sourcePath, buffer] of [...sourceBuffers.entries()].sort(
    ([left], [right]) => left.localeCompare(right)
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
  validateSourceVerification(sources, artifacts);
  const {
    rawDefinitions,
    classificationContext,
  } = prepareDefinitions(config, sources, compilerOutput, artifacts);
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
    .sort((left, right) => left.id.localeCompare(right.id));
  validateProtocolSurface(definitions, artifacts);
  validatePublishedInterfaces(definitions, artifacts);
  const files = [...sources.values()]
    .map(publicSourceRecord)
    .sort((left, right) => left.path.localeCompare(right.path));
  const artifactChecksums = Object.fromEntries(
    Object.entries(artifacts)
      .sort(([left], [right]) => left.localeCompare(right))
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
  const { definitionIndex, shards: definitionShards } =
    createDefinitionShards(config, definitions, warnings);
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
    definitionIndex,
    files,
    warningSummary: summarizeWarnings(warnings),
  };
  bundle.generator.outputSha256 = bundleOutputSha256(bundle);
  return { bundle, definitionShards, sources };
}

function bundleOutputSha256(bundle) {
  const clone = structuredClone(bundle);
  clone.generator.outputSha256 = null;
  return sha256Urn(stableJson(clone));
}

function validateAbiSurfaceDeclaration(surface, declaration) {
  invariant(
    declaration.canonicalSignature === surface.signature,
    `${surface.declarationId}: ABI surface canonical signature drifted.`
  );
  if (declaration.kind === "event") {
    invariant(
      declaration.topic0 === surface.topic0 &&
        surface.topic0 === topicForSignature(surface.signature),
      `${surface.declarationId}: ABI surface event topic drifted.`
    );
    return;
  }
  const selectorMatchesSignature =
    surface.selectorSource === "compiler_ast_library" ||
    surface.selector === selectorForSignature(surface.signature);
  invariant(
    declaration.selector === surface.selector &&
      selectorMatchesSignature,
    `${surface.declarationId}: ABI surface selector drifted.`
  );
  if (surface.selectorSource === "compiler_ast_library") {
    invariant(
      surface.canonicalAbiSelector ===
        selectorForSignature(surface.signature),
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
  const definitionIds = new Set();
  const shardPaths = new Set();
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
        definition.shardPath.startsWith("/") &&
        !shardPaths.has(definition.shardPath),
      `${definition.id}: definition shard path is invalid or duplicated.`
    );
    shardPaths.add(definition.shardPath);
    invariant(
      /^sha256:[0-9a-f]{64}$/.test(definition.shardSha256),
      `${definition.id}: definition shard checksum is invalid.`
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
    for (const field of [
      "key",
      "name",
      "sourcePath",
      "scope",
      "kind",
      "classification",
    ]) {
      invariant(
        indexEntry[field] === shard.definition[field],
        `${shard.definition.id}: definition index ${field} drifted.`
      );
    }
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
    warningCount += shard.warnings.length;
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
  validateDefinitionRecords(definitions);
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
  abiSignature,
  abiSurface,
  buildBundle,
  bundleOutputSha256,
  canonicalAbiType,
  canonicalize,
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
  selectorForSignature,
  sha256Hex,
  sha256Urn,
  sourceLineCount,
  stableJson,
  topicForSignature,
  validateBundle,
  validateConfig,
  validateDefinitionShards,
};

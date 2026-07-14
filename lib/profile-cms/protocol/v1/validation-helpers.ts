import { getAddress } from "ethers";
import type { ZodIssue } from "zod";

import {
  CMS_RESERVED_APP_ROUTE_ROOTS,
  CMS_SAFE_URI_PROTOCOLS,
} from "./constants";
import {
  computeCmsPackageHash,
  computeCmsPayloadHash,
  isCmsSha256Hash,
} from "./hash";
import type {
  CmsAssetV1,
  CmsBlockV1,
  CmsNavigationItemV1,
  CmsPackageV1,
  CmsValidationIssueV1,
  CmsValidationResultV1,
} from "./schemas";

interface CmsValidationOptions {
  checkedAt?: Date | string;
  validator?: string;
  validatorVersion?: string;
  allowFixtureSignatures?: boolean;
  allowFixtureStorage?: boolean;
  enforceHashes?: boolean;
}

interface IssueInput {
  severity?: CmsValidationIssueV1["severity"] | undefined;
  code: string;
  message: string;
  path: string;
  pageId?: string | undefined;
  blockId?: string | undefined;
  suggestedFix?: string | undefined;
}

export type IdMap<T extends { id: string }> = Map<
  string,
  { value: T; index: number }
>;

interface PageValidationContext {
  pageId: string;
  pagePath: string;
}

interface BlockValidationContext extends PageValidationContext {
  blockId: string;
  blockPath: string;
}

const ALLOWED_BLOCK_URL_FIELDS = new Set(["url", "href", "src", "uri"]);
const URL_LIKE_FIELD = /(url|uri|href|src)$/i;
const HASH_FIELD_NAMES = new Set([
  "base_package_hash",
  "content_hash",
  "metadata_hash",
  "package_hash",
  "payload_hash",
]);

export function validateNavigation(
  cmsPackage: CmsPackageV1,
  pageMap: IdMap<CmsPackageV1["payload"]["pages"][number]>,
  issues: CmsValidationIssueV1[]
): void {
  cmsPackage.payload.navigation.forEach((navigation, navigationIndex) => {
    navigation.items.forEach((item, itemIndex) => {
      validateNavigationItem(
        item,
        pageMap,
        `/payload/navigation/${navigationIndex}/items/${itemIndex}`,
        issues
      );
    });
  });
}

function validateNavigationItem(
  item: CmsNavigationItemV1,
  pageMap: IdMap<CmsPackageV1["payload"]["pages"][number]>,
  path: string,
  issues: CmsValidationIssueV1[]
): void {
  validateOptionalReference(
    item.page_id,
    pageMap,
    `${path}/page_id`,
    issues,
    "navigation.page_missing"
  );

  if (item.url) {
    validateSafeUri(
      item.url,
      `${path}/url`,
      issues,
      "navigation.unsafe_url",
      true
    );
  }

  if (!item.page_id && !item.url && !item.children?.length) {
    addIssue(issues, {
      code: "navigation.target_missing",
      message: `Navigation item '${item.label}' needs a page_id, url, or children.`,
      path,
    });
  }

  item.children?.forEach((child, childIndex) => {
    validateNavigationItem(
      child,
      pageMap,
      `${path}/children/${childIndex}`,
      issues
    );
  });
}

export function validateTaxonomies(
  cmsPackage: CmsPackageV1,
  pageMap: IdMap<CmsPackageV1["payload"]["pages"][number]>,
  issues: CmsValidationIssueV1[]
): void {
  cmsPackage.payload.taxonomies?.forEach((taxonomy, taxonomyIndex) => {
    taxonomy.terms.forEach((term, termIndex) => {
      validateOptionalReference(
        term.page_id,
        pageMap,
        `/payload/taxonomies/${taxonomyIndex}/terms/${termIndex}/page_id`,
        issues,
        "taxonomy.page_missing"
      );
    });
  });
}

export function validateSignatures(
  cmsPackage: CmsPackageV1,
  options: CmsValidationOptions,
  issues: CmsValidationIssueV1[]
): void {
  cmsPackage.signatures.forEach((signature, index) => {
    if (
      signature.type === "fixture" &&
      options.allowFixtureSignatures === false
    ) {
      addIssue(issues, {
        code: "signature.fixture_not_allowed",
        message: "Fixture signatures are not valid for production publish.",
        path: `/signatures/${index}/type`,
      });
    }

    if (signature.type === "eip712") {
      validateEthereumAddress(
        signature.signer,
        `/signatures/${index}/signer`,
        issues,
        "signature.signer_invalid"
      );
    }
  });

  if (cmsPackage.profile.primary_wallet) {
    validateEthereumAddress(
      cmsPackage.profile.primary_wallet,
      "/profile/primary_wallet",
      issues,
      "profile.primary_wallet_invalid"
    );
  }
}

export function validateStorage(
  cmsPackage: CmsPackageV1,
  options: CmsValidationOptions,
  issues: CmsValidationIssueV1[]
): void {
  let hasDecentralizedReceipt = false;

  cmsPackage.storage.forEach((receipt, index) => {
    const path = `/storage/${index}`;
    validateSafeUri(
      receipt.uri,
      `${path}/uri`,
      issues,
      "storage.unsafe_uri",
      false
    );

    if (
      receipt.provider === "fixture" &&
      options.allowFixtureStorage === false
    ) {
      addIssue(issues, {
        code: "storage.fixture_not_allowed",
        message:
          "Fixture storage receipts are not valid for production publish.",
        path: `${path}/provider`,
      });
    }

    if (receipt.provider === "s3" && receipt.canonical) {
      addIssue(issues, {
        code: "storage.s3_cannot_be_canonical",
        message:
          "S3 may accelerate delivery, but it cannot be canonical storage.",
        path: `${path}/canonical`,
      });
    }

    if (receipt.provider === "ipfs" || receipt.provider === "arweave") {
      hasDecentralizedReceipt = true;
    }
  });

  if (options.allowFixtureStorage === false && !hasDecentralizedReceipt) {
    addIssue(issues, {
      code: "storage.decentralized_receipt_required",
      message: "Production publish requires IPFS or Arweave storage.",
      path: "/storage",
    });
  }
}

export function validateHashes(
  cmsPackage: CmsPackageV1,
  options: CmsValidationOptions,
  issues: CmsValidationIssueV1[]
): void {
  if (!options.enforceHashes) {
    return;
  }

  const actualPayloadHash = computeCmsPayloadHash(cmsPackage.payload);
  if (cmsPackage.integrity.payload_hash !== actualPayloadHash) {
    addIssue(issues, {
      code: "integrity.payload_hash_mismatch",
      message: "Payload hash does not match the canonical payload.",
      path: "/integrity/payload_hash",
      suggestedFix: `Expected ${actualPayloadHash}.`,
    });
  }

  const actualPackageHash = computeCmsPackageHash(cmsPackage);
  if (cmsPackage.integrity.package_hash !== actualPackageHash) {
    addIssue(issues, {
      code: "integrity.package_hash_mismatch",
      message: "Package hash does not match the canonical package hash input.",
      path: "/integrity/package_hash",
      suggestedFix: `Expected ${actualPackageHash}.`,
    });
  }
}

export function validateBuildManifest(
  cmsPackage: CmsPackageV1,
  issues: CmsValidationIssueV1[]
): void {
  const buildManifest = cmsPackage.payload.build_manifest;
  if (!buildManifest) {
    return;
  }

  if (
    buildManifest.route_count !== undefined &&
    buildManifest.route_count !== cmsPackage.payload.routes.length
  ) {
    addIssue(issues, {
      severity: "warning",
      code: "build_manifest.route_count_mismatch",
      message: "Build manifest route_count does not match the route manifest.",
      path: "/payload/build_manifest/route_count",
    });
  }

  if (
    buildManifest.asset_count !== undefined &&
    buildManifest.asset_count !== cmsPackage.payload.assets.length
  ) {
    addIssue(issues, {
      severity: "warning",
      code: "build_manifest.asset_count_mismatch",
      message: "Build manifest asset_count does not match the asset manifest.",
      path: "/payload/build_manifest/asset_count",
    });
  }
}

export function validateInteractivePolicyReferences(
  block: CmsBlockV1,
  assetMap: IdMap<CmsAssetV1>,
  blockPath: string,
  pageId: string,
  issues: CmsValidationIssueV1[]
): void {
  if (!block.interactive_policy?.fallback_asset_id) {
    return;
  }

  validateOptionalAssetReference(
    block.interactive_policy.fallback_asset_id,
    assetMap,
    `${blockPath}/interactive_policy/fallback_asset_id`,
    issues,
    "asset.reference_missing",
    pageId,
    block.id
  );
}

export function validateBlockUrls(
  block: Record<string, unknown>,
  blockPath: string,
  pageId: string,
  blockId: string,
  issues: CmsValidationIssueV1[]
): void {
  Object.entries(block).forEach(([key, value]) => {
    if (!URL_LIKE_FIELD.test(key)) {
      return;
    }

    const path = `${blockPath}/${escapePointerSegment(key)}`;
    if (!ALLOWED_BLOCK_URL_FIELDS.has(key)) {
      addIssue(issues, {
        code: "block.unknown_url_field",
        message: `URL-like block field '${key}' is not part of V1's safe URL contract.`,
        path,
        pageId,
        blockId,
      });
      return;
    }

    if (typeof value === "string") {
      validateSafeUri(
        value,
        path,
        issues,
        "block.unsafe_url",
        true,
        pageId,
        blockId
      );
    }
  });
}

export function validateHeavyMediaBlock(
  block: CmsBlockV1,
  assetMap: IdMap<CmsAssetV1>,
  blockPath: string,
  pageId: string,
  issues: CmsValidationIssueV1[]
): void {
  const record = block as Record<string, unknown>;
  const assetId = getString(record["asset_id"]);
  const asset = assetId ? assetMap.get(assetId)?.value : undefined;
  const isHeavyBlock =
    ["video", "html_embed", "object_viewer"].includes(block.block_type) ||
    asset?.kind === "video" ||
    asset?.kind === "html" ||
    asset?.kind === "model";

  if (!isHeavyBlock) {
    return;
  }

  const hasPoster = typeof record["poster_asset_id"] === "string";
  const hasFallback = !!block.interactive_policy?.fallback_asset_id;

  if (!hasPoster && !hasFallback) {
    addIssue(issues, {
      code: "media.fallback_required",
      message:
        "Heavy media blocks need a poster_asset_id or fallback_asset_id.",
      path: blockPath,
      pageId,
      blockId: block.id,
    });
  }
}

export function validateBlockReferenceFields<T extends { id: string }>(
  block: Record<string, unknown>,
  fields: readonly string[],
  referenceMap: IdMap<T>,
  blockContext: BlockValidationContext,
  issues: CmsValidationIssueV1[],
  code: string
): void {
  fields.forEach((field) => {
    validateOptionalReference(
      getString(block[field]),
      referenceMap,
      `${blockContext.blockPath}/${field}`,
      issues,
      code,
      blockContext.pageId,
      blockContext.blockId
    );
  });
}

export function validateBlockReferenceArrayFields<T extends { id: string }>(
  block: Record<string, unknown>,
  fields: readonly string[],
  referenceMap: IdMap<T>,
  blockContext: BlockValidationContext,
  issues: CmsValidationIssueV1[],
  code: string
): void {
  fields.forEach((field) => {
    const value = block[field];
    if (!Array.isArray(value)) {
      return;
    }

    value.forEach((item, index) => {
      validateOptionalReference(
        getString(item),
        referenceMap,
        `${blockContext.blockPath}/${field}/${index}`,
        issues,
        code,
        blockContext.pageId,
        blockContext.blockId
      );
    });
  });
}

export function validateOptionalAssetReference(
  assetId: string | undefined,
  assetMap: IdMap<CmsAssetV1>,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string,
  pageId?: string,
  blockId?: string
): void {
  validateOptionalReference(
    assetId,
    assetMap,
    path,
    issues,
    code,
    pageId,
    blockId
  );
}

export function validatePageReference(
  pageId: string,
  pageMap: IdMap<CmsPackageV1["payload"]["pages"][number]>,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string
): void {
  validateOptionalReference(pageId, pageMap, path, issues, code);
}

export function validateOptionalReference<T extends { id: string }>(
  id: string | undefined,
  referenceMap: IdMap<T>,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string,
  pageId?: string,
  blockId?: string
): void {
  if (!id || referenceMap.has(id)) {
    return;
  }

  addIssue(issues, {
    code,
    message: `Reference '${id}' does not exist.`,
    path,
    pageId,
    blockId,
  });
}

export function validateProfileNamespace(
  pathValue: string,
  profileHandle: string,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string
): void {
  const expectedPrefix = `/${profileHandle.toLowerCase()}/`;
  if (!pathValue.toLowerCase().startsWith(expectedPrefix)) {
    addIssue(issues, {
      code,
      message: `CMS path '${pathValue}' must stay under /${profileHandle}/.`,
      path,
    });
  }
}

export function validateReservedRouteRoot(
  pathValue: string,
  path: string,
  issues: CmsValidationIssueV1[]
): void {
  const routeRoot = pathValue.split("/")[1]?.toLowerCase();
  if (!routeRoot) {
    return;
  }

  if ((CMS_RESERVED_APP_ROUTE_ROOTS as readonly string[]).includes(routeRoot)) {
    addIssue(issues, {
      code: "route.reserved_root",
      message: `Route root '/${routeRoot}' is reserved by the application.`,
      path,
    });
  }
}

export function validateSafeUri(
  value: string,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string,
  allowRelative: boolean,
  pageId?: string,
  blockId?: string
): void {
  if (isSafeUri(value, allowRelative)) {
    return;
  }

  addIssue(issues, {
    code,
    message: `Unsafe or unsupported URI '${value}'.`,
    path,
    pageId,
    blockId,
  });
}

function isSafeUri(value: string, allowRelative: boolean): boolean {
  if (allowRelative && value.startsWith("/")) {
    return isSafeRelativeUri(value);
  }

  try {
    const protocol = new URL(value).protocol.toLowerCase();
    return (CMS_SAFE_URI_PROTOCOLS as readonly string[]).includes(protocol);
  } catch {
    return false;
  }
}

function isSafeRelativeUri(value: string): boolean {
  if (value.startsWith("//")) {
    return false;
  }

  if (/[\\\u0000-\u001f\u007f]/.test(value)) {
    return false;
  }

  const lowercaseValue = value.toLowerCase();
  return (
    !lowercaseValue.startsWith("/%2f") && !lowercaseValue.startsWith("/%5c")
  );
}

export function validateEthereumAddress(
  value: string,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string
): void {
  try {
    getAddress(value);
  } catch {
    addIssue(issues, {
      code,
      message: `Invalid Ethereum address '${value}'.`,
      path,
    });
  }
}

export function toIdMap<T extends { id: string }>(
  items: T[],
  path: string,
  label: string,
  issues: CmsValidationIssueV1[]
): IdMap<T> {
  const map: IdMap<T> = new Map();

  items.forEach((item, index) => {
    if (map.has(item.id)) {
      addIssue(issues, {
        code: `${label}.duplicate_id`,
        message: `${label} id '${item.id}' appears more than once.`,
        path: `${path}/${index}/id`,
      });
    } else {
      map.set(item.id, { value: item, index });
    }
  });

  return map;
}

export function mapZodIssue(issue: ZodIssue): CmsValidationIssueV1 {
  const path = toJsonPointer(issue.path);

  if (issue.path[0] === "signatures") {
    return issueFromInput({
      code: "signature.required",
      message: "At least one signature is required.",
      path: "/signatures",
    });
  }

  if (
    issue.code === "invalid_enum_value" &&
    issue.path[issue.path.length - 1] === "block_type"
  ) {
    return issueFromInput({
      code: "block.unknown_type",
      message: "Unknown block type. V1 CMS packages fail closed.",
      path,
    });
  }

  const lastPathSegment = issue.path[issue.path.length - 1];
  if (
    issue.code === "invalid_string" &&
    issue.validation === "regex" &&
    typeof lastPathSegment === "string" &&
    HASH_FIELD_NAMES.has(lastPathSegment)
  ) {
    return issueFromInput({
      code: "hash.invalid",
      message: issue.message,
      path,
    });
  }

  return issueFromInput({
    code: "schema.invalid",
    message: issue.message,
    path,
  });
}

export function addIssue(
  issues: CmsValidationIssueV1[],
  input: IssueInput
): void {
  issues.push(issueFromInput(input));
}

function issueFromInput(input: IssueInput): CmsValidationIssueV1 {
  return {
    severity: input.severity ?? "error",
    code: input.code,
    message: input.message,
    path: input.path,
    ...(input.pageId ? { page_id: input.pageId } : {}),
    ...(input.blockId ? { block_id: input.blockId } : {}),
    ...(input.suggestedFix ? { suggested_fix: input.suggestedFix } : {}),
  };
}

export function formatCheckedAt(value: Date | string | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function toJsonPointer(path: ZodIssue["path"]): string {
  if (!path.length) {
    return "/";
  }

  return `/${path.map((segment) => escapePointerSegment(String(segment))).join("/")}`;
}

function escapePointerSegment(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

export function getTarget(
  input: unknown
): CmsValidationResultV1["target"] | undefined {
  if (!isRecord(input)) {
    return undefined;
  }

  const inputIntegrity = input["integrity"];
  const integrity = isRecord(inputIntegrity) ? inputIntegrity : undefined;
  const target: NonNullable<CmsValidationResultV1["target"]> = {};
  const packageHash = integrity?.["package_hash"];
  const packageId = input["package_id"];

  if (typeof packageHash === "string" && isCmsSha256Hash(packageHash)) {
    target.package_hash = packageHash;
  }

  if (typeof packageId === "string") {
    target.package_id = packageId;
  }

  return Object.keys(target).length ? target : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

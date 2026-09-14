import {
  canonicalizeJson,
  cmsPackageSchema,
  validateCmsPackageV1,
  withComputedCmsHashes,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";

export const CMS_AGENT_FILE_MAX_BYTES = 1024 * 1024;

type CmsAgentReviewErrorCode =
  | "invalid_file"
  | "too_large"
  | "stale_base"
  | "identity_changed"
  | "assets_changed"
  | "invalid_package";

export class CmsAgentReviewError extends Error {
  constructor(readonly code: CmsAgentReviewErrorCode) {
    super(code);
    this.name = "CmsAgentReviewError";
  }
}

export interface CmsAgentDocumentChange {
  readonly path: string;
  readonly before: unknown;
  readonly after: unknown;
}

export interface CmsAgentDocumentReview {
  readonly baseHash: string;
  readonly cmsPackage: CmsPackageV1;
  readonly summary: string;
  readonly changes: readonly CmsAgentDocumentChange[];
}

/** Check complexity before schema parsing or traversing untrusted agent JSON. */
function assertBounded(input: unknown): void {
  const queue = [{ value: input, depth: 0 }];
  let nodes = 0;
  while (queue.length) {
    const item = queue.pop();
    if (!item) break;
    if (++nodes > 50000 || item.depth > 32)
      throw new CmsAgentReviewError("too_large");
    if (item.value === null || typeof item.value !== "object") continue;
    for (const [key, value] of Object.entries(item.value)) {
      if (["__proto__", "constructor", "prototype"].includes(key))
        throw new CmsAgentReviewError("invalid_file");
      queue.push({ value, depth: item.depth + 1 });
    }
  }
  if (
    new TextEncoder().encode(JSON.stringify(input)).byteLength >
    CMS_AGENT_FILE_MAX_BYTES
  )
    throw new CmsAgentReviewError("too_large");
}

export function reviewCmsAgentFile(
  base: CmsPackageV1,
  json: string
): CmsAgentDocumentReview {
  if (new TextEncoder().encode(json).byteLength > CMS_AGENT_FILE_MAX_BYTES)
    throw new CmsAgentReviewError("too_large");
  let input: unknown;
  try {
    input = JSON.parse(json) as unknown;
  } catch {
    throw new CmsAgentReviewError("invalid_file");
  }
  assertBounded(input);
  if (input === null || typeof input !== "object" || Array.isArray(input))
    throw new CmsAgentReviewError("invalid_file");
  const record = input as Record<string, unknown>;
  if (
    record["schema"] !== "6529.cms.agent_file_proposal.v1" ||
    typeof record["base_package_hash"] !== "string" ||
    typeof record["summary"] !== "string" ||
    !record["summary"].trim() ||
    record["summary"].length > 1000
  )
    throw new CmsAgentReviewError("invalid_file");
  return reviewCmsAgentCandidate({
    base,
    candidate: record["candidate_package"],
    expectedBaseHash: record["base_package_hash"],
    summary: record["summary"],
  });
}

export function reviewCmsAgentCandidate({
  base,
  candidate,
  expectedBaseHash,
  summary,
}: {
  readonly base: CmsPackageV1;
  readonly candidate: unknown;
  readonly expectedBaseHash: string;
  readonly summary: string;
}): CmsAgentDocumentReview {
  if (base.integrity.package_hash !== expectedBaseHash)
    throw new CmsAgentReviewError("stale_base");
  assertBounded(candidate);
  const parsed = cmsPackageSchema.safeParse(candidate);
  if (!parsed.success) throw new CmsAgentReviewError("invalid_package");
  const proposed = parsed.data;
  if (
    proposed.package_id !== base.package_id ||
    canonicalizeJson(proposed.profile) !== canonicalizeJson(base.profile) ||
    proposed.site.base_path !== base.site.base_path
  )
    throw new CmsAgentReviewError("identity_changed");
  if (
    canonicalizeJson(proposed.payload.assets) !==
    canonicalizeJson(base.payload.assets)
  )
    throw new CmsAgentReviewError("assets_changed");

  const cmsPackage = withComputedCmsHashes(proposed);
  // A proposal never inherits claims that its changed content was signed or stored.
  const at = new Date().toISOString();
  cmsPackage.signatures = [
    { type: "fixture", signer: "fixture", signature: "fixture", signed_at: at },
  ];
  cmsPackage.storage = [
    {
      provider: "fixture",
      uri: "https://6529.io/profile-cms/draft",
      content_hash: cmsPackage.integrity.package_hash,
      canonical: false,
      recorded_at: at,
    },
  ];
  if (
    !validateCmsPackageV1(cmsPackage, {
      allowFixtureSignatures: true,
      allowFixtureStorage: true,
      enforceHashes: true,
    }).valid
  )
    throw new CmsAgentReviewError("invalid_package");

  return {
    baseHash: expectedBaseHash,
    cmsPackage,
    summary,
    changes: getChanges(base, cmsPackage),
  };
}

function getChanges(
  base: CmsPackageV1,
  proposed: CmsPackageV1
): CmsAgentDocumentChange[] {
  const changes: CmsAgentDocumentChange[] = [];
  const compare = (path: string, before: unknown, after: unknown) => {
    if (
      (before === undefined) !== (after === undefined) ||
      canonicalizeJson(before ?? null) !== canonicalizeJson(after ?? null)
    )
      changes.push({ path, before, after });
  };
  const coreKeys = new Set([...Object.keys(base), ...Object.keys(proposed)]);
  for (const key of coreKeys) {
    if (["integrity", "signatures", "storage", "payload"].includes(key))
      continue;
    compare(
      `/${key}`,
      (base as Record<string, unknown>)[key],
      (proposed as Record<string, unknown>)[key]
    );
  }
  const payloadKeys = new Set([
    ...Object.keys(base.payload),
    ...Object.keys(proposed.payload),
  ]);
  for (const key of payloadKeys) {
    if (key === "pages") continue;
    compare(
      `/payload/${key}`,
      (base.payload as Record<string, unknown>)[key],
      (proposed.payload as Record<string, unknown>)[key]
    );
  }
  compare(
    "/payload/pages/order",
    base.payload.pages.map((page) => page.id),
    proposed.payload.pages.map((page) => page.id)
  );
  const beforePages = new Map(
    base.payload.pages.map((page) => [page.id, page])
  );
  const afterPages = new Map(
    proposed.payload.pages.map((page) => [page.id, page])
  );
  for (const id of new Set([...beforePages.keys(), ...afterPages.keys()])) {
    compare(`/payload/pages/${id}`, beforePages.get(id), afterPages.get(id));
  }
  return changes;
}

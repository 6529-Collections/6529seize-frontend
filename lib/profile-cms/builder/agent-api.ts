import { z } from "zod";
import {
  commonApiDeleteWithResponse,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";
import { isProfileCmsBuilderApiEnabledEnv } from "@/config/profileCmsBuilderEnv";

const hashSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const grantSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string(),
  draft_id: z.string(),
  package_id: z.string(),
  base_version: z.number().int().positive(),
  base_package_hash: hashSchema,
  label: z.string(),
  created_at: z.number().int(),
  expires_at: z.number().int(),
  revoked_at: z.number().int().nullable(),
  requests_remaining: z.number().int().nonnegative(),
  proposals_remaining: z.number().int().nonnegative(),
});
const proposalSchema = z.object({
  id: z.string().uuid(),
  grant_id: z.string().uuid(),
  profile_id: z.string(),
  draft_id: z.string(),
  base_version: z.number().int().positive(),
  base_package_hash: hashSchema,
  candidate_package_hash: hashSchema,
  candidate_package: z.unknown(),
  summary: z.string().max(1000),
  created_at: z.number().int(),
  status: z.enum(["pending", "rejected", "applied"]),
  reviewed_at: z.number().int().nullable(),
  result_draft_id: z.string().nullable(),
  result_package_hash: hashSchema.nullable(),
});

export type CmsAgentGrant = z.infer<typeof grantSchema>;
export type CmsAgentProposal = z.infer<typeof proposalSchema>;
const proposalSummarySchema = proposalSchema.omit({ candidate_package: true });
export type CmsAgentProposalSummary = z.infer<typeof proposalSummarySchema>;

function enabled(): void {
  if (!isProfileCmsBuilderApiEnabledEnv())
    throw new Error("profile_cms_builder_api_disabled");
}
function draftEndpoint(draftId: string, suffix: string): string {
  return `profile-cms/packages/${encodeURIComponent(draftId)}/agent-${suffix}`;
}

export async function createCmsAgentGrant({
  draftId,
  expectedHash,
  label,
  expiresInSeconds,
  signal,
}: {
  readonly draftId: string;
  readonly expectedHash: string;
  readonly label: string;
  readonly expiresInSeconds: number;
  readonly signal?: AbortSignal | undefined;
}): Promise<{ grant: CmsAgentGrant; token: string }> {
  enabled();
  const response = await commonApiPost({
    endpoint: draftEndpoint(draftId, "grants"),
    body: {
      expected_package_hash: expectedHash,
      label,
      expires_in_seconds: expiresInSeconds,
    },
    signal,
    errorMode: "structured",
  });
  return z
    .object({
      grant: grantSchema,
      token: z.string().regex(/^cms_agent_[a-f0-9-]{36}\.[a-f0-9]{64}$/),
    })
    .parse(response);
}

export async function listCmsAgentGrants(
  draftId: string,
  offset: number,
  signal?: AbortSignal
): Promise<CmsAgentGrant[]> {
  enabled();
  const response = await commonApiFetch<unknown>({
    endpoint: draftEndpoint(draftId, "grants"),
    params: { limit: "50", offset: String(offset) },
    signal,
    errorMode: "structured",
  });
  return z.array(grantSchema).max(50).parse(response);
}

export async function revokeCmsAgentGrant(
  id: string,
  signal?: AbortSignal
): Promise<CmsAgentGrant> {
  enabled();
  const response = await commonApiDeleteWithResponse<unknown>({
    endpoint: `profile-cms/agent-grants/${encodeURIComponent(id)}`,
    signal,
    errorMode: "structured",
  });
  return grantSchema.parse(response);
}

export async function listCmsAgentProposals(
  draftId: string,
  offset: number,
  signal?: AbortSignal
): Promise<CmsAgentProposalSummary[]> {
  enabled();
  const response = await commonApiFetch<unknown>({
    endpoint: draftEndpoint(draftId, "proposals"),
    params: { limit: "50", offset: String(offset) },
    signal,
    errorMode: "structured",
  });
  return z.array(proposalSummarySchema).max(50).parse(response);
}

export async function getCmsAgentProposal(
  id: string,
  signal?: AbortSignal
): Promise<CmsAgentProposal> {
  enabled();
  const response = await commonApiFetch<unknown>({
    endpoint: `profile-cms/agent-proposals/${encodeURIComponent(id)}`,
    signal,
    errorMode: "structured",
  });
  return proposalSchema.parse(response);
}

/** Records owner review only. Saving and signing remain separate endpoints. */
export async function recordCmsAgentProposalReview({
  proposal,
  result,
  signal,
}: {
  readonly proposal: CmsAgentProposalSummary;
  readonly result:
    | { readonly draftId: string; readonly packageHash: string }
    | "rejected";
  readonly signal?: AbortSignal | undefined;
}): Promise<CmsAgentProposal> {
  enabled();
  const response = await commonApiPost({
    endpoint: `profile-cms/agent-proposals/${encodeURIComponent(proposal.id)}`,
    body: {
      status: result === "rejected" ? "rejected" : "applied",
      expected_draft_id: proposal.draft_id,
      expected_base_package_hash: proposal.base_package_hash,
      expected_candidate_package_hash: proposal.candidate_package_hash,
      ...(result === "rejected"
        ? {}
        : {
            result_draft_id: result.draftId,
            result_package_hash: result.packageHash,
          }),
    },
    signal,
    errorMode: "structured",
  });
  return proposalSchema.parse(response);
}

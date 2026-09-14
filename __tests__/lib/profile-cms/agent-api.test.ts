import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { isProfileCmsBuilderApiEnabledEnv } from "@/config/profileCmsBuilderEnv";
import {
  commonApiDeleteWithResponse,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";
import {
  createCmsAgentGrant,
  getCmsAgentProposal,
  listCmsAgentGrants,
  listCmsAgentProposals,
  recordCmsAgentProposalReview,
  revokeCmsAgentGrant,
  type CmsAgentProposal,
} from "@/lib/profile-cms/builder/agent-api";

jest.mock("@/config/profileCmsBuilderEnv");
jest.mock("@/services/api/common-api");

type Spec = {
  paths: Record<
    string,
    Record<string, { security: Record<string, never[]>[] }>
  >;
  components: {
    schemas: Record<
      string,
      {
        properties: Record<string, unknown>;
        required: string[];
        additionalProperties: boolean;
      }
    >;
  };
};
const spec = parse(
  readFileSync(join(process.cwd(), "openapi.yaml"), "utf8")
) as Spec;
const hash = `sha256:${"a".repeat(64)}`;
const candidateHash = `sha256:${"b".repeat(64)}`;
const id = "eafbc931-0530-4f4b-82e3-36c576e9acbd";
const grant = {
  id,
  profile_id: "profile",
  draft_id: "draft",
  package_id: "package",
  base_version: 1,
  base_package_hash: hash,
  label: "My local client",
  created_at: 1789084800000,
  expires_at: 1789088400000,
  revoked_at: null,
  requests_remaining: 100,
  proposals_remaining: 10,
};
const proposal: CmsAgentProposal = {
  id,
  grant_id: id,
  profile_id: "profile",
  draft_id: "draft",
  base_version: 1,
  base_package_hash: hash,
  candidate_package_hash: candidateHash,
  candidate_package: { private: "Draft content" },
  summary: "Proposed copy changes",
  created_at: grant.created_at,
  status: "pending",
  reviewed_at: null,
  result_draft_id: null,
  result_package_hash: null,
};
const fetchApi = jest.mocked(commonApiFetch);
const post = jest.mocked(commonApiPost);
const remove = jest.mocked(commonApiDeleteWithResponse);

function expectDocumentedBody(name: string, body: unknown) {
  if (body === null || typeof body !== "object")
    throw new Error("Expected request body");
  const schema = spec.components.schemas[name]!;
  expect(schema.additionalProperties).toBe(false);
  expect(Object.keys(body)).toEqual(expect.arrayContaining(schema.required));
  for (const key of Object.keys(body))
    expect(schema.properties).toHaveProperty(key);
}
function expectOwnerRoute(path: string, method: string) {
  expect(spec.paths[path]?.[method]?.security).toEqual([{ bearerAuth: [] }]);
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(isProfileCmsBuilderApiEnabledEnv).mockReturnValue(true);
});

it("creates owner access with the documented draft endpoint and request fields", async () => {
  const signal = new AbortController().signal;
  const token = `cms_agent_${id}.${"c".repeat(64)}`;
  post.mockResolvedValue({ grant, token });
  await expect(
    createCmsAgentGrant({
      draftId: "draft",
      expectedHash: hash,
      label: grant.label,
      expiresInSeconds: 3600,
      signal,
    })
  ).resolves.toEqual({ grant, token });
  expectOwnerRoute("/profile-cms/packages/{id}/agent-grants", "post");
  const call = post.mock.calls[0]![0];
  expect(call).toMatchObject({
    endpoint: "profile-cms/packages/draft/agent-grants",
    signal,
    errorMode: "structured",
  });
  expect(call.body).toEqual({
    expected_package_hash: hash,
    label: grant.label,
    expires_in_seconds: 3600,
  });
  expectDocumentedBody("ApiCreateProfileCmsAgentGrantRequest", call.body);
});

it("lists bounded summaries without retaining private candidate content", async () => {
  fetchApi.mockResolvedValueOnce([grant]).mockResolvedValueOnce([proposal]);
  expect(await listCmsAgentGrants("draft/encoded", 50)).toEqual([grant]);
  const summaries = await listCmsAgentProposals("draft/encoded", 100);
  expect(summaries[0]).not.toHaveProperty("candidate_package");
  expect(
    fetchApi.mock.calls.map(([call]) => ({
      endpoint: call.endpoint,
      params: call.params,
    }))
  ).toEqual([
    {
      endpoint: "profile-cms/packages/draft%2Fencoded/agent-grants",
      params: { limit: "50", offset: "50" },
    },
    {
      endpoint: "profile-cms/packages/draft%2Fencoded/agent-proposals",
      params: { limit: "50", offset: "100" },
    },
  ]);
  expectOwnerRoute("/profile-cms/packages/{id}/agent-grants", "get");
  expectOwnerRoute("/profile-cms/packages/{id}/agent-proposals", "get");
  fetchApi.mockResolvedValue(Array.from({ length: 51 }, () => grant));
  await expect(listCmsAgentGrants("draft", 0)).rejects.toThrow();
});

it("loads owner proposal details and revokes grants through separate authenticated paths", async () => {
  const signal = new AbortController().signal;
  fetchApi.mockResolvedValue(proposal);
  remove.mockResolvedValue({ ...grant, revoked_at: grant.created_at });
  expect(await getCmsAgentProposal(id, signal)).toEqual(proposal);
  expect((await revokeCmsAgentGrant(id, signal)).revoked_at).toBe(
    grant.created_at
  );
  expect(fetchApi).toHaveBeenCalledWith({
    endpoint: `profile-cms/agent-proposals/${id}`,
    signal,
    errorMode: "structured",
  });
  expect(remove).toHaveBeenCalledWith({
    endpoint: `profile-cms/agent-grants/${id}`,
    signal,
    errorMode: "structured",
  });
  expectOwnerRoute("/profile-cms/agent-proposals/{id}", "get");
  expectOwnerRoute("/profile-cms/agent-grants/{id}", "delete");
});

it.each(["applied", "rejected"] as const)(
  "records %s with authoritative base and candidate hashes, without saving or publishing",
  async (status) => {
    const result =
      status === "applied"
        ? { draftId: "saved", packageHash: candidateHash }
        : "rejected";
    post.mockResolvedValue({ ...proposal, status });
    await recordCmsAgentProposalReview({ proposal, result });
    const call = post.mock.calls[0]![0];
    expect(call.endpoint).toBe(`profile-cms/agent-proposals/${id}`);
    expect(call.body).toEqual({
      status,
      expected_draft_id: "draft",
      expected_base_package_hash: hash,
      expected_candidate_package_hash: candidateHash,
      ...(status === "applied"
        ? { result_draft_id: "saved", result_package_hash: candidateHash }
        : {}),
    });
    expectDocumentedBody("ApiReviewProfileCmsAgentProposalRequest", call.body);
    expectOwnerRoute("/profile-cms/agent-proposals/{id}", "post");
    expect(post).toHaveBeenCalledTimes(1);
  }
);

it("fails before network requests when builder APIs are disabled", async () => {
  jest.mocked(isProfileCmsBuilderApiEnabledEnv).mockReturnValue(false);
  await expect(getCmsAgentProposal(id)).rejects.toThrow(
    "profile_cms_builder_api_disabled"
  );
  expect(fetchApi).not.toHaveBeenCalled();
});

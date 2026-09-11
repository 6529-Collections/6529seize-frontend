import {
  confirmCmsAgentProposalSave,
  saveCmsAgentProposalDraft,
} from "@/lib/profile-cms/builder/agent-save";
import {
  getCmsAgentProposal,
  recordCmsAgentProposalReview,
  type CmsAgentProposal,
} from "@/lib/profile-cms/builder/agent-api";
import {
  getProfileCmsPackageById,
  runProfileCmsBuilderAction,
  listProfileCmsPackagesForProfile,
} from "@/lib/profile-cms/builder/api";
import {
  CMS_STUDIO_TEMPLATES,
  instantiateCmsStudioTemplate,
} from "@/lib/profile-cms/studio/templates";
import { bindCmsDraftIdentity } from "@/lib/profile-cms/builder/identity";
import {
  withComputedCmsHashes,
  cmsPackageSchema,
} from "@/lib/profile-cms/protocol/v1";
import type { LoadedProfileCmsPackageRecord } from "@/lib/profile-cms/builder/package-normalize";

jest.mock("@/lib/profile-cms/builder/api", () => ({
  getProfileCmsPackageById: jest.fn(),
  runProfileCmsBuilderAction: jest.fn(),
  listProfileCmsPackagesForProfile: jest.fn(),
}));
jest.mock("@/lib/profile-cms/builder/agent-api", () => ({
  getCmsAgentProposal: jest.fn(),
  recordCmsAgentProposalReview: jest.fn(),
}));
const wallet = "0x0000000000000000000000000000000000000001";
const load = jest.mocked(getProfileCmsPackageById);
const history = jest.mocked(listProfileCmsPackagesForProfile);
const save = jest.mocked(runProfileCmsBuilderAction);
const readProposal = jest.mocked(getCmsAgentProposal);
const recordReview = jest.mocked(recordCmsAgentProposalReview);

function setup() {
  const basePackage = bindCmsDraftIdentity(
    instantiateCmsStudioTemplate(CMS_STUDIO_TEMPLATES[0]!.id, "punk6529"),
    "profile",
    wallet
  );
  const candidate = cmsPackageSchema.parse(
    JSON.parse(JSON.stringify(basePackage))
  );
  candidate.site.title = "A proposed title";
  const proposed = withComputedCmsHashes(candidate);
  const base: LoadedProfileCmsPackageRecord = {
    id: "base",
    profileId: "profile",
    profileHandle: "punk6529",
    packageId: basePackage.package_id,
    version: 1,
    status: "draft",
    isPrimary: false,
    packageHash: basePackage.integrity.package_hash,
    payloadHash: basePackage.integrity.payload_hash,
    createdAt: "2026-09-11T00:00:00.000Z",
    updatedAt: "2026-09-11T00:00:00.000Z",
    cmsPackage: basePackage,
  };
  const result: LoadedProfileCmsPackageRecord = {
    ...base,
    id: "saved",
    version: 2,
    packageHash: proposed.integrity.package_hash,
    payloadHash: proposed.integrity.payload_hash,
    cmsPackage: proposed,
  };
  const proposal: CmsAgentProposal = {
    id: "proposal",
    grant_id: "grant",
    profile_id: "profile",
    draft_id: base.id,
    base_version: 1,
    base_package_hash: base.packageHash,
    candidate_package_hash: result.packageHash,
    candidate_package: proposed,
    summary: "Change the title",
    created_at: Date.parse(base.createdAt),
    status: "pending",
    reviewed_at: null,
    result_draft_id: null,
    result_package_hash: null,
  };
  load.mockImplementation(async (id) => {
    if (id === base.id) return base;
    if (id === result.id) return result;
    throw new Error("unknown draft");
  });
  history.mockResolvedValue([result, base]);
  readProposal.mockResolvedValue(proposal);
  save.mockResolvedValue({
    ok: true,
    action: "save_draft",
    code: "draft_saved",
    draftId: result.id,
    packageHash: result.packageHash,
    version: result.version,
  });
  recordReview.mockResolvedValue({
    ...proposal,
    status: "applied",
    result_draft_id: result.id,
    result_package_hash: result.packageHash,
  });
  const controller = new AbortController();
  const input = {
    proposal,
    profileId: "profile",
    primaryWallet: wallet,
    signal: controller.signal,
  };
  return { base, result, proposal, controller, input };
}

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  let lock: Promise<unknown> = Promise.resolve();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: (
        _name: string,
        options: LockOptions,
        callback: () => Promise<unknown>
      ) => {
        const run = async () => {
          await lock;
          options.signal?.throwIfAborted();
          return callback();
        };
        const result = run();
        lock = result.catch(() => undefined);
        return result;
      },
    },
  });
});

it("saves an exact reviewed candidate and records the verified new draft without publishing", async () => {
  const { input, result, proposal } = setup();
  await expect(saveCmsAgentProposalDraft(input)).resolves.toMatchObject({
    record: result,
    reviewRecorded: true,
  });
  expect(save).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      action: "save_draft",
      profileId: "profile",
      cmsPackage: expect.objectContaining({
        integrity: expect.objectContaining({
          package_hash: proposal.candidate_package_hash,
        }),
      }),
    })
  );
  expect(recordReview).toHaveBeenCalledWith({
    proposal,
    result: { draftId: result.id, packageHash: result.packageHash },
    signal: input.signal,
  });
});

it("returns the saved receipt when only the review-status write fails", async () => {
  const { input, result } = setup();
  recordReview.mockRejectedValue(new Error("status unavailable"));
  await expect(saveCmsAgentProposalDraft(input)).resolves.toMatchObject({
    record: result,
    reviewRecorded: false,
  });
  expect(save).toHaveBeenCalledTimes(1);
  expect(recordReview).toHaveBeenCalledTimes(1);
});

it.each(["rejected", "applied"] as const)(
  "does not save a proposal already %s",
  async (status) => {
    const { input, proposal } = setup();
    readProposal.mockResolvedValue({ ...proposal, status });
    await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
      "cms_agent_proposal_changed"
    );
    expect(save).not.toHaveBeenCalled();
    expect(recordReview).not.toHaveBeenCalled();
  }
);

it("aborts before any mutation when the owner scope is lost during reads", async () => {
  const { input, controller } = setup();
  controller.abort();
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow();
  expect(save).not.toHaveBeenCalled();
  expect(recordReview).not.toHaveBeenCalled();
});

it("refuses a swapped candidate or profile before saving", async () => {
  const { input, proposal } = setup();
  readProposal.mockResolvedValue({ ...proposal, profile_id: "other-profile" });
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
    "cms_agent_proposal_changed"
  );
  expect(save).not.toHaveBeenCalled();
});

it("does not record applied when the persisted result differs", async () => {
  const { input, base, result } = setup();
  load
    .mockReset()
    .mockResolvedValueOnce(base)
    .mockResolvedValueOnce({ ...result, version: 1 });
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
    "cms_agent_saved_record_mismatch"
  );
  expect(recordReview).not.toHaveBeenCalled();
});

it("retains the saved ID before a failed canonical read and confirms that same row on retry", async () => {
  const { input, base, result } = setup();
  load
    .mockReset()
    .mockResolvedValueOnce(base)
    .mockRejectedValueOnce(new Error("read lost"));
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow("read lost");
  expect(localStorage.getItem(localStorage.key(0)!)).toContain(
    '"resultDraftId":"saved"'
  );
  load.mockResolvedValue(result);
  await expect(confirmCmsAgentProposalSave(input)).resolves.toMatchObject({
    record: result,
  });
  expect(save).toHaveBeenCalledTimes(1);
  expect(history).not.toHaveBeenCalled();
  expect(load).toHaveBeenLastCalledWith(result.id);
});

it("reconciles a lost POST response from exact owner history without allocating a second revision", async () => {
  const { input, result } = setup();
  save.mockRejectedValueOnce(new Error("response lost"));
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
    "response lost"
  );
  await expect(saveCmsAgentProposalDraft(input)).resolves.toMatchObject({
    record: result,
  });
  expect(save).toHaveBeenCalledTimes(1);
  expect(history).toHaveBeenCalledWith(input.profileId);
});

it.each([
  "empty",
  "multiple",
  "wrong profile",
  "wrong package",
  "old",
  "published",
])(
  "keeps unresolved %s history locked through repeated confirmation attempts",
  async (kind) => {
    const { input, result } = setup();
    save.mockRejectedValueOnce(new Error("response lost"));
    await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow();
    const choices: Record<string, LoadedProfileCmsPackageRecord[]> = {
      empty: [],
      multiple: [result, { ...result, id: "another" }],
      "wrong profile": [{ ...result, profileId: "other" }],
      "wrong package": [{ ...result, packageId: "other" }],
      old: [{ ...result, createdAt: "2020-01-01T00:00:00Z" }],
      published: [{ ...result, status: "published" }],
    };
    history.mockResolvedValue(choices[kind]!);
    await expect(confirmCmsAgentProposalSave(input)).rejects.toThrow(
      "cms_agent_save_unconfirmed"
    );
    await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
      "cms_agent_save_unconfirmed"
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(recordReview).not.toHaveBeenCalled();
  }
);

it("retains the checkpoint and only retries owner disposition after a status response is lost", async () => {
  const { input, proposal, result } = setup();
  recordReview.mockRejectedValueOnce(new Error("status response lost"));
  await expect(saveCmsAgentProposalDraft(input)).resolves.toMatchObject({
    reviewRecorded: false,
  });
  readProposal.mockResolvedValue({
    ...proposal,
    status: "applied",
    result_draft_id: result.id,
    result_package_hash: result.packageHash,
  });
  await expect(confirmCmsAgentProposalSave(input)).resolves.toMatchObject({
    reviewRecorded: true,
    record: result,
  });
  expect(save).toHaveBeenCalledTimes(1);
  expect(recordReview).toHaveBeenCalledTimes(1);
  expect(localStorage.length).toBe(0);
});

it("checkpoints only public identifiers and hashes, without candidate content", async () => {
  const { input } = setup();
  save.mockImplementationOnce(async () => {
    const stored = localStorage.getItem(localStorage.key(0)!)!;
    expect(stored).toContain('"proposalId":"proposal"');
    expect(stored).not.toContain("A proposed title");
    expect(stored).not.toContain("candidate_package");
    expect(stored).not.toContain("token");
    throw new Error("lost");
  });
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow("lost");
});

it("does not POST if durable storage is corrupt or cannot be written", async () => {
  const { input } = setup();
  localStorage.setItem("6529:cms:agent-save:v1:profile", "malformed");
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
    "cms_agent_save_checkpoint_unavailable"
  );
  localStorage.clear();
  const failure = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("quota");
    });
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
    "cms_agent_save_checkpoint_unavailable"
  );
  failure.mockRestore();
  expect(save).not.toHaveBeenCalled();
});

it("does not POST without cross-tab Web Locks", async () => {
  const { input } = setup();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: undefined,
  });
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
    "cms_agent_save_checkpoint_unavailable"
  );
  expect(save).not.toHaveBeenCalled();
});

it("retains the known saved ID even if the owner leaves before the POST response", async () => {
  const { input, controller, result } = setup();
  save.mockImplementationOnce(async () => {
    controller.abort();
    return {
      ok: true,
      action: "save_draft",
      code: "draft_saved",
      draftId: result.id,
      packageHash: result.packageHash,
      version: result.version,
    };
  });
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow();
  await expect(
    confirmCmsAgentProposalSave({
      ...input,
      signal: new AbortController().signal,
    })
  ).resolves.toMatchObject({ record: result });
  expect(save).toHaveBeenCalledTimes(1);
  expect(history).not.toHaveBeenCalled();
});

it("serializes duplicate in-flight saves and refuses another proposal while unresolved", async () => {
  const { input, proposal } = setup();
  save.mockRejectedValue(new Error("lost"));
  history.mockResolvedValue([]);
  const results = await Promise.allSettled([
    saveCmsAgentProposalDraft(input),
    saveCmsAgentProposalDraft(input),
  ]);
  expect(results.map((result) => result.status)).toEqual([
    "rejected",
    "rejected",
  ]);
  await expect(
    saveCmsAgentProposalDraft({
      ...input,
      proposal: { ...proposal, id: "other" },
    })
  ).rejects.toThrow("cms_agent_proposal_changed");
  expect(save).toHaveBeenCalledTimes(1);
});

it.each([400, 401, 403, 404])(
  "releases a definitively rejected POST %s so a corrected session can save",
  async (status) => {
    const { input, result } = setup();
    save.mockRejectedValueOnce(
      Object.assign(new Error("pre-write rejection"), { status })
    );
    await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
      "pre-write rejection"
    );
    expect(localStorage.length).toBe(0);
    await expect(saveCmsAgentProposalDraft(input)).resolves.toMatchObject({
      record: result,
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(history).not.toHaveBeenCalled();
  }
);

it.each([422, 500, 502, 503, 504])(
  "keeps an uncertain POST %s checkpoint without allowing a resave",
  async (status) => {
    const { input } = setup();
    save.mockRejectedValueOnce(
      Object.assign(new Error("uncertain outcome"), { status })
    );
    history.mockResolvedValue([]);
    await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
      "uncertain outcome"
    );
    await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
      "cms_agent_save_unconfirmed"
    );
    expect(save).toHaveBeenCalledTimes(1);
  }
);

it.each(["api_disabled", "missing_profile_id"] as const)(
  "releases an explicit local %s no-write result",
  async (code) => {
    const { input, result } = setup();
    save.mockResolvedValueOnce({
      ok: false,
      action: "save_draft",
      code,
      expectedEndpoint: "profile-cms/packages",
    });
    await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
      "cms_agent_save_unconfirmed"
    );
    expect(localStorage.length).toBe(0);
    await expect(saveCmsAgentProposalDraft(input)).resolves.toMatchObject({
      record: result,
    });
    expect(save).toHaveBeenCalledTimes(2);
  }
);

it("releases a checkpoint only when abort occurs before POST dispatch", async () => {
  const { input, controller, result } = setup();
  const abort = () => controller.abort();
  globalThis.addEventListener("cms-agent-save-checkpoint", abort, {
    once: true,
  });
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow();
  expect(save).not.toHaveBeenCalled();
  expect(localStorage.length).toBe(0);
  await expect(
    saveCmsAgentProposalDraft({
      ...input,
      signal: new AbortController().signal,
    })
  ).resolves.toMatchObject({ record: result });
});

it("never clears a known saved row when a follow-up read returns 401", async () => {
  const { input, base, result } = setup();
  load
    .mockReset()
    .mockResolvedValueOnce(base)
    .mockRejectedValueOnce(
      Object.assign(new Error("read unauthorized"), { status: 401 })
    );
  await expect(saveCmsAgentProposalDraft(input)).rejects.toThrow(
    "read unauthorized"
  );
  load.mockResolvedValue(result);
  await expect(saveCmsAgentProposalDraft(input)).resolves.toMatchObject({
    record: result,
  });
  expect(save).toHaveBeenCalledTimes(1);
  expect(history).not.toHaveBeenCalled();
});

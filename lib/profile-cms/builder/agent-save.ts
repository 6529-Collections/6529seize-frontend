import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import { reviewCmsAgentCandidate } from "@/lib/profile-cms/agent-review";
import { bindCmsDraftIdentity } from "./identity";
import {
  getProfileCmsPackageById,
  listProfileCmsPackagesForProfile,
  runProfileCmsBuilderAction,
} from "./api";
import {
  getCmsAgentProposal,
  recordCmsAgentProposalReview,
  type CmsAgentProposal,
} from "./agent-api";
import {
  clearCmsAgentSaveCheckpoint,
  readCmsAgentSaveCheckpoint,
  withCmsAgentSaveLock,
  writeCmsAgentSaveCheckpoint,
  type CmsAgentSaveCheckpoint,
} from "./agent-save-checkpoint";
import type {
  LoadedProfileCmsPackageRecord,
  ProfileCmsPackageRecord,
} from "./package-normalize";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

type SaveScope = {
  readonly profileId: string;
  readonly primaryWallet: string;
  readonly signal: AbortSignal;
};

function matchesSavedRecord(
  record: ProfileCmsPackageRecord,
  checkpoint: CmsAgentSaveCheckpoint
): boolean {
  return (
    record.profileId === checkpoint.profileId &&
    record.packageId === checkpoint.packageId &&
    record.packageHash === checkpoint.candidateHash &&
    record.id !== checkpoint.draftId &&
    record.version > checkpoint.baseVersion &&
    record.status === "draft" &&
    Date.parse(record.createdAt) >= checkpoint.proposalCreatedAt
  );
}

function assertProposalMatches(
  proposal: CmsAgentProposal,
  checkpoint: CmsAgentSaveCheckpoint
): void {
  if (
    proposal.id !== checkpoint.proposalId ||
    proposal.profile_id !== checkpoint.profileId ||
    proposal.draft_id !== checkpoint.draftId ||
    proposal.base_version !== checkpoint.baseVersion ||
    proposal.base_package_hash !== checkpoint.baseHash ||
    proposal.candidate_package_hash !== checkpoint.candidateHash ||
    proposal.created_at !== checkpoint.proposalCreatedAt
  )
    throw new Error("cms_agent_proposal_changed");
}

async function confirmSavedRecord(
  checkpoint: CmsAgentSaveCheckpoint,
  signal: AbortSignal
): Promise<LoadedProfileCmsPackageRecord> {
  let resultId = checkpoint.resultDraftId;
  if (!resultId) {
    const history = await listProfileCmsPackagesForProfile(
      checkpoint.profileId
    );
    signal.throwIfAborted();
    const matches = history.filter((record) =>
      matchesSavedRecord(record, checkpoint)
    );
    // No match is not proof that a timed-out POST failed. Multiple matching
    // revisions are ambiguous too; neither case authorizes another write.
    if (matches.length !== 1) throw new Error("cms_agent_save_unconfirmed");
    resultId = matches[0]!.id;
    writeCmsAgentSaveCheckpoint({ ...checkpoint, resultDraftId: resultId });
  }
  const record = await getProfileCmsPackageById(resultId);
  signal.throwIfAborted();
  if (record.id !== resultId || !matchesSavedRecord(record, checkpoint))
    throw new Error("cms_agent_saved_record_mismatch");
  writeCmsAgentSaveCheckpoint({
    ...checkpoint,
    resultDraftId: resultId,
    confirmed: true,
  });
  return record;
}

async function finishSave(
  checkpoint: CmsAgentSaveCheckpoint,
  current: CmsAgentProposal,
  signal: AbortSignal
) {
  assertProposalMatches(current, checkpoint);
  if (current.status === "rejected") {
    // The owner's terminal decision prevents another save of this proposal,
    // even if an earlier POST response was lost. Release the local lock without
    // loading its candidate or recording a conflicting applied decision.
    clearCmsAgentSaveCheckpoint(checkpoint.profileId);
    throw new Error("cms_agent_proposal_rejected");
  }
  const record = await confirmSavedRecord(checkpoint, signal);
  let reviewRecorded =
    current.status === "applied" &&
    current.result_draft_id === record.id &&
    current.result_package_hash === record.packageHash;
  if (current.status === "applied" && !reviewRecorded)
    throw new Error("cms_agent_proposal_changed");
  if (!reviewRecorded) {
    try {
      const reviewed = await recordCmsAgentProposalReview({
        proposal: current,
        result: { draftId: record.id, packageHash: record.packageHash },
        signal,
      });
      signal.throwIfAborted();
      assertProposalMatches(reviewed, checkpoint);
      reviewRecorded =
        reviewed.status === "applied" &&
        reviewed.result_draft_id === record.id &&
        reviewed.result_package_hash === record.packageHash;
    } catch {
      signal.throwIfAborted();
      // Retain the confirmed receipt. Retrying only confirms this same row.
    }
  }
  if (reviewRecorded) clearCmsAgentSaveCheckpoint(checkpoint.profileId);
  return { record, proposal: current, reviewRecorded };
}

/** Reconcile an attempted save; this function can never create a draft. */
export async function confirmCmsAgentProposalSave(scope: SaveScope) {
  return withCmsAgentSaveLock(scope.profileId, scope.signal, async () => {
    const checkpoint = readCmsAgentSaveCheckpoint(scope.profileId);
    if (!checkpoint) throw new Error("cms_agent_save_checkpoint_missing");
    const current = await getCmsAgentProposal(
      checkpoint.proposalId,
      scope.signal
    );
    scope.signal.throwIfAborted();
    return finishSave(checkpoint, current, scope.signal);
  });
}

/** Save once, then retain a durable confirmation checkpoint until reviewed. */
export async function saveCmsAgentProposalDraft({
  proposal,
  ...scope
}: SaveScope & { readonly proposal: CmsAgentProposal }) {
  return withCmsAgentSaveLock(scope.profileId, scope.signal, async () => {
    const retained = readCmsAgentSaveCheckpoint(scope.profileId);
    if (retained) {
      assertProposalMatches(proposal, retained);
      const current = await getCmsAgentProposal(
        retained.proposalId,
        scope.signal
      );
      scope.signal.throwIfAborted();
      return finishSave(retained, current, scope.signal);
    }
    return startSave(proposal, scope);
  });
}

async function startSave(proposal: CmsAgentProposal, scope: SaveScope) {
  const { profileId, primaryWallet, signal } = scope;
  const [current, base] = await Promise.all([
    getCmsAgentProposal(proposal.id, signal),
    getProfileCmsPackageById(proposal.draft_id),
  ]);
  signal.throwIfAborted();
  const checkpoint: CmsAgentSaveCheckpoint = {
    schema: "6529.cms.agent_save_checkpoint.v1",
    profileId,
    primaryWallet: primaryWallet.toLowerCase(),
    proposalId: proposal.id,
    draftId: base.id,
    packageId: base.packageId,
    baseVersion: base.version,
    baseHash: proposal.base_package_hash,
    candidateHash: proposal.candidate_package_hash,
    proposalCreatedAt: proposal.created_at,
    attemptedAt: Date.now(),
    confirmed: false,
  };
  assertProposalMatches(current, checkpoint);
  if (
    current.status !== "pending" ||
    base.profileId !== profileId ||
    base.status !== "draft" ||
    base.packageHash !== current.base_package_hash
  )
    throw new Error("cms_agent_proposal_changed");
  const review = reviewCmsAgentCandidate({
    base: base.cmsPackage,
    candidate: current.candidate_package,
    expectedBaseHash: current.base_package_hash,
    summary: current.summary,
  });
  if (
    review.cmsPackage.integrity.package_hash !== current.candidate_package_hash
  )
    throw new Error("cms_agent_candidate_mismatch");
  const result = await postDraftOnce(review.cmsPackage, scope, checkpoint);
  // Retain the returned row ID even if the owner left while POST was running.
  if (result.ok && result.draftId) {
    checkpoint.resultDraftId = result.draftId;
    writeCmsAgentSaveCheckpoint(checkpoint);
  }
  signal.throwIfAborted();
  if (
    !result.ok ||
    !result.draftId ||
    result.packageHash !== checkpoint.candidateHash
  )
    throw new Error("cms_agent_save_unconfirmed");
  return finishSave(checkpoint, current, signal);
}

async function postDraftOnce(
  cmsPackage: CmsPackageV1,
  scope: SaveScope,
  checkpoint: CmsAgentSaveCheckpoint
) {
  const { profileId, primaryWallet, signal } = scope;
  // The ordinary save adapter binds the current owner again. A historical
  // base can belong to another wallet in the same consolidated profile; do
  // not save a different document from the one the owner just reviewed.
  if (
    bindCmsDraftIdentity(cmsPackage, profileId, primaryWallet).integrity
      .package_hash !== checkpoint.candidateHash
  )
    throw new Error("cms_agent_proposal_changed");
  // Persist before the first write. Storage failure must fail before POST.
  writeCmsAgentSaveCheckpoint(checkpoint);
  if (signal.aborted) {
    // The checkpoint event can unmount the owner UI synchronously. No POST has
    // started yet, so releasing this checkpoint cannot duplicate a save.
    clearCmsAgentSaveCheckpoint(profileId);
    signal.throwIfAborted();
  }
  let result;
  try {
    result = await runProfileCmsBuilderAction({
      action: "save_draft",
      cmsPackage,
      profileId,
      primaryWallet,
    });
  } catch (error) {
    // The save handler checks JWT, ownership, schema/identity and profile
    // existence before insertion. Only these known POST rejections prove no
    // revision was saved. Follow-up reads/status writes never enter this catch.
    const status = getStructuredApiErrorStatus(error);
    if (status !== undefined && [400, 401, 403, 404].includes(status))
      clearCmsAgentSaveCheckpoint(profileId);
    throw error;
  }
  if (
    !result.ok &&
    ["api_disabled", "missing_profile_id"].includes(result.code)
  )
    clearCmsAgentSaveCheckpoint(profileId);
  return result;
}

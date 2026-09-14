import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import {
  createCmsAgentGrant,
  getCmsAgentProposal,
  listCmsAgentGrants,
  listCmsAgentProposals,
  recordCmsAgentProposalReview,
  revokeCmsAgentGrant,
  type CmsAgentGrant,
  type CmsAgentProposal,
  type CmsAgentProposalSummary,
} from "@/lib/profile-cms/builder/agent-api";
import { getProfileCmsPackageById } from "@/lib/profile-cms/builder/api";
import type { LoadedProfileCmsPackageRecord } from "@/lib/profile-cms/builder/package-normalize";
import {
  reviewCmsAgentCandidate,
  type CmsAgentDocumentReview,
} from "@/lib/profile-cms/agent-review";

export function useCmsAgentConnection({
  draftId,
  profileId,
  enabled,
  locale,
}: {
  readonly draftId: string | undefined;
  readonly profileId: string | undefined;
  readonly enabled: boolean;
  readonly locale: SupportedLocale;
}) {
  const [base, setBase] = useState<LoadedProfileCmsPackageRecord | null>(null);
  const [grants, setGrants] = useState<CmsAgentGrant[]>([]);
  const [proposals, setProposals] = useState<CmsAgentProposalSummary[]>([]);
  const [token, setToken] = useState("");
  const [selected, setSelected] = useState<{
    proposal: CmsAgentProposal;
    review: CmsAgentDocumentReview;
  } | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const nextOffset = useRef(0);

  const { run, error, working } = useCmsAgentRequest(locale);

  const load = useCallback(
    (more = false) =>
      run(async (signal) => {
        if (!enabled || !draftId || !profileId) return;
        const offset = more ? nextOffset.current : 0;
        const [record, grantPage, proposalPage] = await Promise.all([
          getProfileCmsPackageById(draftId),
          listCmsAgentGrants(draftId, offset, signal),
          listCmsAgentProposals(draftId, offset, signal),
        ]);
        if (signal.aborted) return;
        if (record.profileId !== profileId || record.id !== draftId)
          throw new Error("profile_mismatch");
        if (
          grantPage.some(
            (grant) =>
              grant.profile_id !== profileId || grant.draft_id !== draftId
          ) ||
          proposalPage.some(
            (proposal) =>
              proposal.profile_id !== profileId || proposal.draft_id !== draftId
          )
        )
          throw new Error("agent_scope_mismatch");
        setBase(record);
        setGrants((previous) =>
          more ? [...previous, ...grantPage] : grantPage
        );
        setProposals((previous) =>
          more ? [...previous, ...proposalPage] : proposalPage
        );
        setHasMore(grantPage.length === 50 || proposalPage.length === 50);
        nextOffset.current = offset + 50;
      }),
    [enabled, draftId, profileId, run]
  );

  useEffect(() => {
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-ref-to-parent -- Initial owner data fetch uses private pagination/abort refs; no ref is passed to or received from a parent.
    void load();
  }, [load]);

  const issue = (label: string, expiresInSeconds: number) =>
    run(async (signal) => {
      if (!base || !enabled || base.status !== "draft") return;
      const created = await createCmsAgentGrant({
        draftId: base.id,
        expectedHash: base.packageHash,
        label,
        expiresInSeconds,
        signal,
      });
      if (signal.aborted) return;
      if (
        created.grant.profile_id !== profileId ||
        created.grant.draft_id !== base.id ||
        created.grant.base_package_hash !== base.packageHash
      )
        throw new Error("agent_scope_mismatch");
      setToken(created.token);
      setGrants((previous) => [created.grant, ...previous]);
    });
  const revoke = (id: string) =>
    run(async (signal) => {
      const revoked = await revokeCmsAgentGrant(id, signal);
      if (signal.aborted) return;
      setGrants((previous) =>
        previous.map((grant) => (grant.id === id ? revoked : grant))
      );
      if (token.startsWith(`cms_agent_${id}.`)) setToken("");
    });
  const review = (id: string) =>
    run(async (signal) => {
      if (!base) return;
      const proposal = await getCmsAgentProposal(id, signal);
      if (signal.aborted) return;
      if (
        proposal.profile_id !== profileId ||
        proposal.draft_id !== base.id ||
        proposal.base_version !== base.version
      )
        throw new Error("agent_scope_mismatch");
      const reviewed = reviewCmsAgentCandidate({
        base: base.cmsPackage,
        candidate: proposal.candidate_package,
        expectedBaseHash: proposal.base_package_hash,
        summary: proposal.summary,
      });
      if (
        reviewed.cmsPackage.integrity.package_hash !==
        proposal.candidate_package_hash
      )
        throw new Error("agent_candidate_mismatch");
      setSelected({ proposal, review: reviewed });
    });
  const reject = (proposal: CmsAgentProposalSummary) =>
    run(async (signal) => {
      const rejected = await recordCmsAgentProposalReview({
        proposal,
        result: "rejected",
        signal,
      });
      if (signal.aborted) return;
      setProposals((previous) =>
        previous.map((item) => (item.id === rejected.id ? rejected : item))
      );
      if (selected?.proposal.id === rejected.id) setSelected(null);
    });
  return {
    base,
    grants,
    proposals,
    token,
    selected,
    error,
    working,
    hasMore,
    load,
    issue,
    revoke,
    review,
    reject,
    clearToken: () => setToken(""),
    closeReview: () => setSelected(null),
  };
}

function useCmsAgentRequest(locale: SupportedLocale) {
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const run = useCallback(
    async (action: (signal: AbortSignal) => Promise<void>) => {
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      setWorking(true);
      setError("");
      try {
        await action(controller.signal);
      } catch (failure) {
        if (!controller.signal.aborted) {
          const status = getStructuredApiErrorStatus(failure);
          const key = getRequestErrorKey(status);
          setError(t(locale, key));
        }
      } finally {
        if (!controller.signal.aborted) setWorking(false);
      }
    },
    [locale]
  );

  return { run, error, working };
}

function getRequestErrorKey(status: number | undefined) {
  if (status === 409) return "profileCms.agent.stale";
  if (status === 429) return "profileCms.agent.quota";
  return "profileCms.agent.requestFailed";
}

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  confirmCmsAgentProposalSave,
  saveCmsAgentProposalDraft,
} from "@/lib/profile-cms/builder/agent-save";
import type { CmsAgentProposal } from "@/lib/profile-cms/builder/agent-api";
import {
  parseCmsAgentSaveCheckpoint,
  readCmsAgentSaveCheckpointRaw,
  subscribeCmsAgentSaveCheckpoint,
} from "@/lib/profile-cms/builder/agent-save-checkpoint";

export function useCmsAgentProposalSave({
  profileId,
  primaryWallet,
  enabled,
}: {
  readonly profileId: string | undefined;
  readonly primaryWallet: string | undefined;
  readonly enabled: boolean;
}) {
  const active = useRef<AbortController | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [checkpointFailure, setCheckpointFailure] = useState(false);
  const scopeKey = enabled
    ? `${profileId ?? ""}:${primaryWallet?.toLowerCase() ?? ""}`
    : "";
  const raw = useSyncExternalStore(
    subscribeCmsAgentSaveCheckpoint,
    () =>
      enabled && profileId ? readCmsAgentSaveCheckpointRaw(profileId) : null,
    () => null
  );
  const checkpointState = useMemo(() => {
    try {
      return {
        checkpoint: profileId
          ? parseCmsAgentSaveCheckpoint(raw, profileId)
          : null,
        unavailable: false,
      };
    } catch {
      return { checkpoint: null, unavailable: true };
    }
  }, [raw, profileId]);
  useEffect(() => () => active.current?.abort(), [scopeKey]);

  const begin = () => {
    if (!enabled || !profileId || !primaryWallet)
      throw new Error("cms_agent_save_unavailable");
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    return { profileId, primaryWallet, signal: controller.signal };
  };
  const save = async (
    proposal: CmsAgentProposal,
    requestedProfileId: string,
    requestedWallet: string
  ) => {
    if (
      requestedProfileId !== profileId ||
      requestedWallet.toLowerCase() !== primaryWallet?.toLowerCase()
    )
      throw new Error("cms_agent_save_unavailable");
    const scope = begin();
    try {
      const saved = await saveCmsAgentProposalDraft({ proposal, ...scope });
      scope.signal.throwIfAborted();
      return saved.record;
    } catch (error) {
      if (
        !scope.signal.aborted &&
        error instanceof Error &&
        error.message === "cms_agent_save_checkpoint_unavailable"
      )
        setCheckpointFailure(true);
      throw error;
    }
  };
  const retryConfirmation = async () => {
    if (retrying || !checkpointState.checkpoint) return undefined;
    const scope = begin();
    setRetrying(true);
    try {
      const saved = await confirmCmsAgentProposalSave(scope);
      scope.signal.throwIfAborted();
      return saved.record;
    } catch {
      // Keep the durable checkpoint and explicit retry control. No retry saves.
      return undefined;
    } finally {
      if (!scope.signal.aborted) setRetrying(false);
    }
  };
  return {
    save,
    pendingConfirmation:
      checkpointState.checkpoint?.confirmed === false
        ? checkpointState.checkpoint
        : null,
    pendingReview:
      checkpointState.checkpoint?.confirmed === true
        ? checkpointState.checkpoint
        : null,
    checkpointUnavailable: checkpointState.unavailable || checkpointFailure,
    retry: retryConfirmation,
    retryConfirmation,
    retrying,
  };
}

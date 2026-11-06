"use client";

import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiWaveAllMentionCount } from "@/generated/models/ApiWaveAllMentionCount";
import { commonApiFetch } from "@/services/api/common-api";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DropMutationBody } from "./drop-submission.types";

export type AllMentionConfirmationState =
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "ready"; readonly count: number };

interface PendingConfirmation {
  readonly scope: string;
  readonly promise: Promise<boolean>;
  readonly resolve: (accepted: boolean) => void;
  controller: AbortController | null;
}

export function useAllMentionConfirmation({
  submitDrop,
  waveId,
  profileId,
}: {
  readonly submitDrop: (
    request: DropMutationBody
  ) => boolean | Promise<boolean>;
  readonly waveId: string;
  readonly profileId: string | null;
}) {
  const scope = `${waveId}:${profileId ?? "anonymous"}`;
  const pending = useRef<PendingConfirmation | null>(null);
  const [dialog, setDialog] = useState<{
    readonly scope: string;
    readonly state: AllMentionConfirmationState;
  } | null>(null);

  const cancel = useCallback(() => {
    const request = pending.current;
    pending.current = null;
    request?.controller?.abort();
    request?.resolve(false);
    setDialog(null);
  }, []);

  if (dialog !== null && dialog.scope !== scope) setDialog(null);

  useEffect(
    () => () => {
      const request = pending.current;
      if (request?.scope === scope) {
        pending.current = null;
        request.controller?.abort();
        request.resolve(false);
      }
    },
    [scope]
  );

  const loadCount = useCallback(() => {
    const request = pending.current;
    if (request?.scope !== scope) return;
    request.controller?.abort();
    const controller = new AbortController();
    request.controller = controller;
    setDialog({ scope, state: { status: "loading" } });
    void commonApiFetch<ApiWaveAllMentionCount>({
      endpoint: `v2/waves/${encodeURIComponent(waveId)}/all-mention-count`,
      signal: controller.signal,
    })
      .then(({ count }) => {
        if (pending.current !== request || controller.signal.aborted) return;
        if (!Number.isSafeInteger(count) || count < 0)
          throw new Error("Invalid audience count");
        setDialog({ scope, state: { status: "ready", count } });
      })
      .catch(() => {
        if (pending.current === request && !controller.signal.aborted) {
          setDialog({ scope, state: { status: "error" } });
        }
      });
  }, [scope, waveId]);

  const submit = useCallback(
    (request: DropMutationBody): boolean | Promise<boolean> => {
      if (!request.drop.mentioned_groups?.includes(ApiDropGroupMention.All)) {
        return submitDrop(request);
      }
      if (pending.current?.scope === scope) return pending.current.promise;
      cancel();
      let resolveDecision!: (accepted: boolean) => void;
      const decision = new Promise<boolean>((resolve) => {
        resolveDecision = resolve;
      });
      const promise = decision.then((accepted) =>
        accepted ? submitDrop(request) : false
      );
      pending.current = {
        scope,
        resolve: resolveDecision,
        promise,
        controller: null,
      };
      loadCount();
      return promise;
    },
    [cancel, loadCount, scope, submitDrop]
  );

  const confirm = useCallback(() => {
    if (dialog?.scope !== scope || dialog.state.status !== "ready") return;
    const request = pending.current;
    pending.current = null;
    setDialog(null);
    request?.resolve(true);
  }, [dialog, scope]);

  return {
    submitDrop: submit,
    confirmation: dialog?.scope === scope ? dialog.state : null,
    cancel,
    confirm,
    retry: loadCount,
  };
}

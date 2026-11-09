import type { QueryClient } from "@tanstack/react-query";
import {
  ProcessIncomingDropType,
  type ProcessIncomingDropFn,
} from "@/contexts/wave/hooks/useWaveRealtimeUpdater.helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import { isWaveRepliesCollapsed } from "@/helpers/waves/collapsed-replies.helpers";
import { settleTemporaryThreadReply } from "../drops/reply-threads/pending-replies";
import type { DropMutationBody } from "./drop-submission.types";

/** Publish the accepted row in both stream and reply caches without a gap. */
export function acceptCreatedDrop({
  serverDrop,
  body,
  wave,
  queryClient,
  processIncomingDrop,
}: {
  readonly serverDrop: ApiDrop;
  readonly body: DropMutationBody;
  readonly wave: ApiWave;
  readonly queryClient: QueryClient;
  readonly processIncomingDrop: ProcessIncomingDropFn;
}): void {
  void Promise.resolve(
    processIncomingDrop(serverDrop, ProcessIncomingDropType.DROP_INSERT, {
      pendingDropId: body.dropId,
    })
  ).catch(() => undefined);
  if (body.dropId && isWaveRepliesCollapsed(wave)) {
    settleTemporaryThreadReply(
      queryClient,
      body.drop.wave_id,
      body.dropId,
      serverDrop
    );
  }
}

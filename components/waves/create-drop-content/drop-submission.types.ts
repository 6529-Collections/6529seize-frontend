import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";

export interface DropMutationBody {
  readonly drop: ApiCreateDropRequest;
  readonly dropId: string | null;
  readonly onSuccess?: (() => void) | undefined;
  readonly onError?: ((error: unknown) => boolean | void) | undefined;
  /**
   * The sender waits for submitDrop's answer and keeps its draft when it is
   * false, so a refusal needn't say the draft is gone.
   */
  readonly keepsDraftWhenRefused?: boolean | undefined;
}

export interface SlowModeChatReservation {
  readonly id: number;
  readonly waveId: string;
  readonly cooldownMs: number;
}

export interface QueuedDropMutationBody extends DropMutationBody {
  readonly slowModeChatReservation?: SlowModeChatReservation | undefined;
  readonly nativeEntrySubmit?:
    | ((drop: ApiCreateDropRequest) => Promise<ApiDrop>)
    | undefined;
}

export interface SlowModeChatWaveState {
  pendingReservationId: number | null;
  cooldownUntil: number | null;
  cooldownMs: number | null;
}

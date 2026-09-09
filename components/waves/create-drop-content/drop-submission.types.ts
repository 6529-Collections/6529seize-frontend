import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";

export interface DropMutationBody {
  readonly drop: ApiCreateDropRequest;
  readonly dropId: string | null;
  readonly onSuccess?: (() => void) | undefined;
  readonly onError?: ((error: unknown) => boolean | void) | undefined;
}

export interface SlowModeChatReservation {
  readonly id: number;
  readonly waveId: string;
  readonly cooldownMs: number;
}

export interface QueuedDropMutationBody extends DropMutationBody {
  readonly slowModeChatReservation?: SlowModeChatReservation | undefined;
}

export interface SlowModeChatWaveState {
  pendingReservationId: number | null;
  cooldownUntil: number | null;
  cooldownMs: number | null;
}

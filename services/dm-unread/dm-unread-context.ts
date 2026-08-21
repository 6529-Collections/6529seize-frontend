import type { ApiDmUnreadConversationState } from "@/generated/models/ApiDmUnreadConversationState";
import { createContext } from "react";
import type { DmUnreadReadOperation, DmUnreadStore } from "./dm-unread-store";

export interface DmUnreadContextValue {
  readonly activeProfileId: string | null;
  readonly activationId: number;
  readonly store: DmUnreadStore;
  readonly applyServerState: (
    state: ApiDmUnreadConversationState,
    expectedProfileId: string | null,
    expectedActivationId: number
  ) => boolean;
  readonly beginRead: (
    expectedProfileId: string | null,
    expectedActivationId: number,
    waveId: string,
    readThroughSerialNo?: number
  ) => DmUnreadReadOperation | null;
  readonly reconcileFailedRead: (
    operation: DmUnreadReadOperation
  ) => Promise<void>;
  readonly cancelRead: (operation: DmUnreadReadOperation) => void;
}

export const DmUnreadContext = createContext<DmUnreadContextValue | null>(null);

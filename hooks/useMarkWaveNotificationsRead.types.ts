import type {
  AuthHeaders,
  WaveReadIdentityConfig,
  WaveReadTemporaryProxyRoleIdentity,
  WaveReadVerifiedIdentity,
} from "@/hooks/useMarkWaveNotificationsRead.identity";
import type { RefObject } from "react";
import type { ApiMarkWaveReadResponse } from "@/generated/models/ApiMarkWaveReadResponse";

export type MarkWaveNotificationsReadResult = "sent" | "skipped";

export interface MarkWaveNotificationsReadOptions {
  readonly shouldSend?: () => boolean;
  readonly queueIfBlocked?: boolean;
  readonly readThroughSerialNo?: number | undefined;
  readonly requestDmUnreadState?: boolean;
  readonly onReadResponse?: (response: ApiMarkWaveReadResponse) => void;
  /**
   * False when the read only confirms what the open wave already shows, so
   * the wave lists need no refetch. Notification queries still refresh.
   */
  readonly refreshWaveLists?: boolean;
}

export interface WaveNotificationsReadMarkerState {
  readonly markWaveNotificationsRead: (
    waveId: string,
    options?: MarkWaveNotificationsReadOptions
  ) => Promise<MarkWaveNotificationsReadResult>;
  readonly identityKey: string;
  readonly proxyRoleIdentityKey: string | null;
}

export interface WaveNotificationsReadMarkerConfig extends WaveReadIdentityConfig {
  readonly invalidateNotifications: (
    options?: InvalidateNotificationsOptions
  ) => void;
}

export type WaveReadAddressEpoch = object;

export type WaveReadShouldSend = (() => boolean) | undefined;

export interface InvalidateNotificationsOptions {
  readonly refreshWaveLists: boolean;
}

export type InvalidateNotificationsRef = Readonly<{
  current: (options?: InvalidateNotificationsOptions) => void;
}>;

export interface WaveReadSendRetryContext {
  readonly addressKey: string;
  readonly activeProfileProxyId: string | null;
  readonly proxyCreatorId: string | null;
  readonly identityKey: string;
  readonly requestKey: string;
  readonly waveId: string;
  readonly addressEpoch: WaveReadAddressEpoch;
  readonly latestAddressEpochRef: RefObject<WaveReadAddressEpoch>;
}

export interface WaveReadSendIntent {
  readonly shouldSend: WaveReadShouldSend;
  readonly retryContext: WaveReadSendRetryContext | undefined;
  readonly readThroughSerialNo: number | undefined;
  readonly onReadResponse:
    | ((response: ApiMarkWaveReadResponse) => void)
    | undefined;
  readonly refreshWaveLists?: boolean | undefined;
}

export interface WaveReadRequestState {
  promise: Promise<MarkWaveNotificationsReadResult>;
  readonly addressKey: string;
  readonly requestKey: string;
  authHeaders: AuthHeaders;
  jwtExpiresAt: number;
  sendIntents: WaveReadSendIntent[];
  pendingSendIntents: WaveReadSendIntent[];
}

export interface PendingWaveReadRequestState {
  readonly addressKey: string;
  readonly activeProfileProxyId: string | null;
  readonly proxyCreatorId: string | null;
  readonly identityKey: string;
  readonly requestKey: string;
  readonly waveId: string;
  readonly addressEpoch: WaveReadAddressEpoch;
  readonly latestAddressEpochRef: RefObject<WaveReadAddressEpoch>;
  readonly promise: Promise<MarkWaveNotificationsReadResult>;
  readonly resolve: (result: MarkWaveNotificationsReadResult) => void;
  readonly reject: (error: unknown) => void;
  readonly sendIntents: WaveReadSendIntent[];
}

export interface WaveReadCacheRefs {
  readonly invalidateNotificationsRef: InvalidateNotificationsRef;
  readonly latestAddressEpochRef: RefObject<WaveReadAddressEpoch>;
  readonly authByIdentityRef: RefObject<Map<string, WaveReadVerifiedIdentity>>;
  readonly temporaryProxyRoleIdentityByIdentityRef: RefObject<
    Map<string, WaveReadTemporaryProxyRoleIdentity>
  >;
  readonly latestVerifiedIdentityByAddressRef: RefObject<
    Map<string, WaveReadVerifiedIdentity>
  >;
  readonly latestVerifiedIdentityByProxyRoleRef: RefObject<
    Map<string, WaveReadVerifiedIdentity>
  >;
  readonly clearedIdentityKeysRef: RefObject<Set<string>>;
}

import type {
  AuthHeaders,
  WaveReadIdentityConfig,
  WaveReadTemporaryProxyRoleIdentity,
  WaveReadVerifiedIdentity,
} from "@/hooks/useMarkWaveNotificationsRead.identity";
import type { RefObject } from "react";

export type MarkWaveNotificationsReadResult = "sent" | "skipped";

export interface MarkWaveNotificationsReadOptions {
  readonly shouldSend?: () => boolean;
  readonly queueIfBlocked?: boolean;
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
  readonly invalidateNotifications: () => void;
}

export type WaveReadAddressEpoch = object;

export type WaveReadShouldSend = (() => boolean) | undefined;

export type InvalidateNotificationsRef = Readonly<{
  current: () => void;
}>;

export interface WaveReadRequestState {
  promise: Promise<MarkWaveNotificationsReadResult>;
  readonly addressKey: string;
  readonly requestKey: string;
  authHeaders: AuthHeaders;
  shouldSends: WaveReadShouldSend[];
  pendingShouldSends: WaveReadShouldSend[];
}

export interface PendingWaveReadRequestState {
  readonly addressKey: string;
  readonly activeProfileProxyId: string | null;
  readonly proxyCreatorId: string | null;
  readonly identityKey: string;
  readonly requestKey: string;
  readonly waveId: string;
  readonly promise: Promise<MarkWaveNotificationsReadResult>;
  readonly resolve: (result: MarkWaveNotificationsReadResult) => void;
  readonly reject: (error: unknown) => void;
  readonly shouldSends: WaveReadShouldSend[];
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

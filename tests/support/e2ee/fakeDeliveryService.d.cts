import type { E2eeApiClient } from "../../../lib/e2ee/api";

export interface FakeResponse {
  status: number;
  body: any;
}

export interface FakeFault {
  method: string;
  path: RegExp;
  status: number;
  code?: string;
  /** Number of requests to fail; -1 = until removed. Default 1. */
  times?: number;
}

export interface FakeLogItemContext {
  profileId: string;
  deviceKey: string;
}

export interface FakeDeliveryService {
  handle(
    method: string,
    path: string,
    input?: {
      profileId?: string;
      body?: unknown;
      query?: Record<string, string>;
    }
  ): Promise<FakeResponse>;
  state: {
    notifyLog: {
      group: string;
      sender_profile_id: string;
      hints: { profile_id: string; kind: string }[];
    }[];
    wakes: { profile_id: string; reason: string; group: string }[];
    reports: {
      id: string;
      verified: boolean;
      sender_profile_id: string | null;
      reason: string;
      body: string;
    }[];
    requests: {
      method: string;
      path: string;
      profileId: string;
      status: number;
      code: string | null;
    }[];
    rosterRepairs?: number;
    [key: string]: any;
  };
  setDmPolicy(
    profileId: string,
    value: "EVERYONE" | "PEOPLE_I_FOLLOW" | "NOBODY" | "GROUP_MEMBERS"
  ): void;
  /** GROUP_MEMBERS with the given members; followed profiles bypass by default. */
  setDmGroup(
    profileId: string,
    memberProfileIds: string[],
    allowFollowed?: boolean
  ): void;
  setAttachmentsEnabled(enabled: boolean): void;
  follow(subscriber: string, target: string): void;
  block(blocker: string, blocked: string): void;
  unblock(blocker: string, blocked: string): void;
  setWallets(profileId: string, wallets: string[]): void;
  storeLoginGrant(input: {
    message: string;
    signature: string;
    wallet: string;
  }): string;
  revokeLoginGrant(grantId: string): void;
  subscribe(
    profileId: string,
    listener: (event: { type: string; data: unknown }) => void
  ): () => void;
  addFault(fault: FakeFault): () => void;
  clearFaults(): void;
  hold(path: RegExp): {
    waiting(): number;
    /** Resolves once a matching POST is being held. */
    arrived(): Promise<void>;
    release(): void;
  };
  setTamper(fn: ((item: any, context: FakeLogItemContext) => any) | null): void;
  group(g: string): any;
  devicesOf(profileId: string): any[];
  /** D172: closes (false: v1 grants and 0x004F refused) or reopens the transition window. */
  setV1GrantsAccepted(accepted: boolean): void;
  /** D172 seed: a v1 (0x004F) grant on a registered device, no KeyPackages. */
  markLegacySuiteDevice(deviceKey: string): any;
}

export function createFakeDeliveryService(options?: {
  now?: () => number;
  attachmentsEnabled?: boolean;
  /** D172: false starts with the v1-grant transition window closed. */
  v1GrantsAccepted?: boolean;
}): FakeDeliveryService;
export function createFakeApiClient(
  ds: FakeDeliveryService,
  profileId: string
): E2eeApiClient;
export function verifyEd25519(
  publicKey: string,
  digest: string,
  signature: string
): boolean;
export function entryDigest(
  g: string,
  epoch: number,
  kind: "commit" | "proposal",
  entryHash: string,
  epochCommitment: string,
  nextCommitKey: string,
  paddedLen: number
): string;
export function rosterDigest(
  g: string,
  epoch: number,
  deviceKeys: string[]
): string;
export function revokeDigest(
  target: string,
  revoker: string,
  revokedAt: number
): string;
export function messageDigest(
  g: string,
  epoch: number,
  body: Uint8Array
): string;
export function grantStatement(deviceKey: string, expiresAt: number): string;
export function grantTypedData(grant: unknown): unknown;

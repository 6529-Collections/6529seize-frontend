import { asE2eeApiError, type E2eeApiClient } from "../api";
import type { ApiE2eeDevice } from "../api-types";
import { digestBytes, revokeDigest } from "../digests";
import {
  parseCredentialIdentity,
  verifyGrant,
  type GrantVerification,
} from "../grant";
import type { WasmLeaf } from "../wasm-types";
import { RetryableError } from "./errors";

/** Device records fetched from the delivery service plus client verification. */

export const DEVICE_TTL_MS = 5 * 60_000;
export const PROFILE_DEVICES_TTL_MS = 5 * 60_000;

interface CachedDevice {
  record: ApiE2eeDevice;
  fetchedAt: number;
}

interface CachedProfileDevices {
  devices: ApiE2eeDevice[];
  fetchedAt: number;
}

export type RevocationState = "none" | "verified" | "unverified";

export interface LeafCheck {
  ok: boolean;
  profileId: string | null;
  record: ApiE2eeDevice | null;
  verification: GrantVerification | null;
  reason: string | null;
}

export interface DirectoryDeps {
  api: E2eeApiClient;
  now: () => number;
  verifyEd25519: (pub: string, digest32: Uint8Array, sig: string) => boolean;
  verifyContractSignature?:
    | ((wallet: string, hash: string, sig: string) => Promise<boolean>)
    | undefined;
}

const isNotFound = (error: unknown): boolean => {
  const apiError = asE2eeApiError(error);
  return apiError?.status === 404;
};

const isRetryable = (error: unknown): boolean => {
  const apiError = asE2eeApiError(error);
  return !apiError || apiError.status === 0 || apiError.status >= 500;
};

export class DeviceDirectory {
  private readonly deps: DirectoryDeps;
  private readonly devices = new Map<string, CachedDevice>();
  private readonly missing = new Map<string, number>();
  private readonly profiles = new Map<string, CachedProfileDevices>();
  private readonly verifications = new Map<string, GrantVerification>();
  private readonly revocations = new Map<string, RevocationState>();
  /** Bumps whenever cached device data changes (snapshot invalidation). */
  version = 0;

  constructor(deps: DirectoryDeps) {
    this.deps = deps;
  }

  /** Seeds records obtained elsewhere (claims, /me, profile lists). */
  seed(records: readonly ApiE2eeDevice[]): void {
    const now = this.deps.now();
    for (const record of records) {
      const key = record.device_key.toLowerCase();
      const previous = this.devices.get(key)?.record;
      const changed =
        !previous ||
        previous.revoked_at !== record.revoked_at ||
        previous.grant_id !== record.grant_id ||
        previous.label !== record.label;
      if (changed) {
        this.version += 1;
        this.verifications.delete(key);
        this.revocations.delete(key);
      }
      this.devices.set(key, { record, fetchedAt: now });
      this.missing.delete(key);
    }
  }

  cached(deviceKey: string): ApiE2eeDevice | null {
    return this.devices.get(deviceKey.toLowerCase())?.record ?? null;
  }

  profileOf(deviceKey: string): string | null {
    return this.cached(deviceKey)?.profile_id ?? null;
  }

  invalidateDevice(deviceKey: string): void {
    const key = deviceKey.toLowerCase();
    const cached = this.devices.get(key);
    if (cached) {
      cached.fetchedAt = 0;
    }
    this.missing.delete(key);
    this.revocations.delete(key);
  }

  invalidateProfile(profileId: string): void {
    this.profiles.delete(profileId);
    for (const cached of this.devices.values()) {
      if (cached.record.profile_id === profileId) {
        cached.fetchedAt = 0;
      }
    }
  }

  /** Null when the server does not know the device; throws RetryableError. */
  async getDevice(
    deviceKey: string,
    maxAgeMs = DEVICE_TTL_MS
  ): Promise<ApiE2eeDevice | null> {
    const key = deviceKey.toLowerCase();
    const now = this.deps.now();
    const cached = this.devices.get(key);
    if (cached && now - cached.fetchedAt <= maxAgeMs) {
      return cached.record;
    }
    const missingAt = this.missing.get(key);
    if (!cached && missingAt !== undefined && now - missingAt <= maxAgeMs) {
      return null;
    }
    try {
      const record = await this.deps.api.getDevice(key);
      this.seed([record]);
      return record;
    } catch (error) {
      if (isNotFound(error)) {
        this.missing.set(key, now);
        return null;
      }
      if (cached && !isRetryable(error)) {
        return cached.record;
      }
      throw new RetryableError("device lookup failed");
    }
  }

  async getProfileDevices(
    profileId: string,
    maxAgeMs = PROFILE_DEVICES_TTL_MS
  ): Promise<ApiE2eeDevice[]> {
    const now = this.deps.now();
    const cached = this.profiles.get(profileId);
    if (cached && now - cached.fetchedAt <= maxAgeMs) {
      return cached.devices;
    }
    try {
      const devices = await this.deps.api.getProfileDevices(profileId);
      this.seed(devices);
      this.profiles.set(profileId, { devices, fetchedAt: now });
      return devices;
    } catch (error) {
      if (cached) {
        return cached.devices;
      }
      if (isNotFound(error)) {
        return [];
      }
      throw new RetryableError("profile devices lookup failed");
    }
  }

  /** Grant verification at `atMs` (cached per device/grant when "now"). */
  async verify(record: ApiE2eeDevice, atMs?: number): Promise<GrantVerification> {
    const key = `${record.device_key.toLowerCase()}:${record.grant_id}`;
    const at = atMs ?? this.deps.now();
    const cached = this.verifications.get(key);
    if (cached && atMs === undefined && cached.ok) {
      if (record.grant.expires_at * 1000 > at) {
        return cached;
      }
    }
    const result = await verifyGrant(record, {
      atMs: at,
      verifyContractSignature: this.deps.verifyContractSignature,
    });
    if (atMs === undefined) {
      this.verifications.set(key, result);
    }
    return result;
  }

  /** Cached "verified by this client" flag for snapshots (no network). */
  isVerified(deviceKey: string): boolean {
    const record = this.cached(deviceKey);
    if (!record) {
      return false;
    }
    const key = `${record.device_key.toLowerCase()}:${record.grant_id}`;
    return this.verifications.get(key)?.verified === true;
  }

  /** A revocation counts only when its signature verifies (2.4). */
  async revocationState(record: ApiE2eeDevice): Promise<RevocationState> {
    if (record.revoked_at === null || !record.revocation) {
      return record.revoked_at === null ? "none" : "unverified";
    }
    const key = record.device_key.toLowerCase();
    const cached = this.revocations.get(key);
    if (cached) {
      return cached;
    }
    const revocation = record.revocation;
    const digest = revokeDigest(
      record.device_key,
      revocation.revoker_device_key,
      revocation.revoked_at
    );
    let state: RevocationState = "unverified";
    if (
      this.deps.verifyEd25519(
        revocation.revoker_device_key,
        digestBytes(digest),
        revocation.signature
      )
    ) {
      const revoker =
        revocation.revoker_device_key.toLowerCase() === key
          ? record
          : await this.getDevice(revocation.revoker_device_key);
      if (revoker?.profile_id === record.profile_id) {
        state = "verified";
      }
    }
    this.revocations.set(key, state);
    return state;
  }

  /**
   * 2.3 / 8.1: credential parses, the device record matches it, the grant
   * verifies at `atMs` and the device was not revoked before `atMs`.
   */
  async checkLeaf(leaf: WasmLeaf, atMs: number): Promise<LeafCheck> {
    const fail = (reason: string, record: ApiE2eeDevice | null): LeafCheck => ({
      ok: false,
      profileId: record?.profile_id ?? null,
      record,
      verification: null,
      reason,
    });
    const credential = parseCredentialIdentity(leaf.identity);
    if (!credential) {
      return fail("credential", null);
    }
    const record = await this.getDevice(leaf.device_key);
    if (!record) {
      return fail("unknown-device", null);
    }
    if (
      record.grant.wallet.toLowerCase() !== credential.wallet ||
      record.grant_id.toLowerCase() !== credential.grantId
    ) {
      return fail("credential-mismatch", record);
    }
    const verification = await this.verify(record, atMs);
    if (!verification.ok) {
      return fail(verification.reason ?? "grant", record);
    }
    if (record.revoked_at !== null && record.revoked_at <= atMs) {
      const revocation = await this.revocationState(record);
      if (revocation === "verified") {
        return fail("revoked", record);
      }
    }
    return {
      ok: true,
      profileId: record.profile_id,
      record,
      verification,
      reason: null,
    };
  }
}

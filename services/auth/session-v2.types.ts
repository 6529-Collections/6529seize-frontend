import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { AuthSessionClientType } from "./session-refresh-coordination.utils";

export type RefreshTokenSessionClientType = Exclude<
  AuthSessionClientType,
  "web"
>;

export interface SessionLoginRequest {
  readonly client_type: AuthSessionClientType;
  readonly server_signature: string;
  readonly client_signature: string;
  readonly client_address: string;
  readonly role?: string | null;
  /** Label for a device key granted by the signed web challenge. */
  readonly device_label?: string;
}

export interface SessionWebResponse {
  readonly address: string;
  readonly role: string | null;
  readonly access_token: string;
  readonly access_token_expires_at: string;
  readonly client_type: "web";
  /** Present when the signed challenge granted a device key. */
  readonly device_grant?: ApiDeviceGrant | undefined;
}

/** Optional web-only challenge parameters that grant a device key. */
export interface SessionNonceDeviceGrantParams {
  readonly device_key: string;
  readonly device_key_type: "ed25519";
  readonly device_scopes: string;
  /** Combined grant (NC8): also grant this MLS device key. */
  readonly mls_device_key?: string;
  readonly mls_ciphersuite?: string;
}

export interface SessionNativeResponse {
  readonly address: string;
  readonly role: string | null;
  readonly access_token: string;
  readonly access_token_expires_at: string;
  readonly client_type: RefreshTokenSessionClientType;
  readonly native_refresh_token: string;
  readonly refresh_token_expires_at: string;
}

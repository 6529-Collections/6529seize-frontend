import { commonApiPost } from "@/services/api/common-api";

export interface DeviceCodeResponse {
  readonly device_code: string;
  readonly user_code: string;
  readonly expires_in: number;
  readonly redirect_uri: string;
}

export interface ApproveResponse {
  readonly client_id: string;
  readonly client_name: string;
  readonly client_description: string;
  readonly redirect_uri: string;
  readonly scope: string;
}

export interface TokenResponse {
  readonly access_token: string;
  readonly token_type: "Bearer";
  readonly expires_in: number;
  readonly scope: string;
  readonly address: string;
}

export async function createDeviceCode(params: {
  clientId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}): Promise<DeviceCodeResponse> {
  return commonApiPost<
    {
      readonly client_id: string;
      readonly redirect_uri: string;
      readonly scope: string;
      readonly code_challenge: string;
      readonly code_challenge_method: string;
    },
    DeviceCodeResponse
  >({
    endpoint: "auth/community-app/device-code",
    body: {
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      scope: params.scope,
      code_challenge: params.codeChallenge,
      code_challenge_method: params.codeChallengeMethod,
    },
  });
}

export async function approveDeviceCode(
  userCode: string
): Promise<ApproveResponse> {
  return commonApiPost<
    { readonly user_code: string },
    ApproveResponse
  >({
    endpoint: "auth/community-app/approve",
    body: { user_code: userCode },
  });
}

export async function exchangeDeviceCode(params: {
  deviceCode: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  return commonApiPost<
    {
      readonly device_code: string;
      readonly code_verifier: string;
    },
    TokenResponse
  >({
    endpoint: "auth/community-app/token",
    body: {
      device_code: params.deviceCode,
      code_verifier: params.codeVerifier,
    },
  });
}
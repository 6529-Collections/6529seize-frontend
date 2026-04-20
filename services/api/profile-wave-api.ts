import { publicEnv } from "@/config/env";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";

export type ApiProfileWaveResponse = {
  readonly profile_wave_id: string | null;
  readonly profile_curation_id: string | null;
};

type SetProfileWaveRequestBody = {
  readonly wave_id: string;
  readonly profile_curation_id?: string | null;
};

const buildProfileWaveUrl = (identity: string): string =>
  `${publicEnv.API_ENDPOINT}/api/profiles/${encodeURIComponent(identity)}/wave`;

const buildProfileWaveHeaders = (): HeadersInit => {
  const apiAuth = getStagingAuth();
  const walletAuth = getAuthJwt();

  return {
    ...(apiAuth ? { "x-6529-auth": apiAuth } : {}),
    ...(walletAuth ? { Authorization: `Bearer ${walletAuth}` } : {}),
  };
};

const parseApiErrorMessage = async (response: Response): Promise<string> => {
  const fallbackMessage = response.statusText || "Something went wrong";

  try {
    const rawContent = await response.text();
    if (!rawContent) {
      return fallbackMessage;
    }

    try {
      const parsedBody = JSON.parse(rawContent) as {
        error?: unknown;
        message?: unknown;
      } | null;

      if (typeof parsedBody?.error === "string") {
        return parsedBody.error;
      }

      if (typeof parsedBody?.message === "string") {
        return parsedBody.message;
      }
    } catch {
      return rawContent;
    }

    return rawContent;
  } catch {
    return fallbackMessage;
  }
};

const parseProfileResponse = async (response: Response): Promise<ApiIdentity> =>
  (await response.json()) as ApiIdentity;

export const setProfileWave = async ({
  identity,
  waveId,
  profileCurationId,
}: {
  readonly identity: string;
  readonly waveId: string;
  readonly profileCurationId?: string | null | undefined;
}): Promise<ApiIdentity> => {
  const body: SetProfileWaveRequestBody = {
    wave_id: waveId,
    ...(profileCurationId !== undefined
      ? { profile_curation_id: profileCurationId }
      : {}),
  };

  return await commonApiPost<SetProfileWaveRequestBody, ApiIdentity>({
    endpoint: `profiles/${encodeURIComponent(identity)}/wave`,
    body,
  });
};

export const getProfileWave = async ({
  identity,
  signal,
}: {
  readonly identity: string;
  readonly signal?: AbortSignal | undefined;
}): Promise<ApiProfileWaveResponse> =>
  await commonApiFetch<ApiProfileWaveResponse>({
    endpoint: `profiles/${encodeURIComponent(identity)}/wave`,
    signal,
  });

export const clearProfileWave = async ({
  identity,
}: {
  readonly identity: string;
}): Promise<ApiIdentity> => {
  const response = await fetch(buildProfileWaveUrl(identity), {
    method: "DELETE",
    headers: buildProfileWaveHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response));
  }

  return await parseProfileResponse(response);
};

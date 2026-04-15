import { publicEnv } from "@/config/env";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiPost } from "@/services/api/common-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";

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
}: {
  readonly identity: string;
  readonly waveId: string;
}): Promise<ApiIdentity> =>
  await commonApiPost<{ wave_id: string }, ApiIdentity>({
    endpoint: `profiles/${encodeURIComponent(identity)}/wave`,
    body: {
      wave_id: waveId,
    },
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

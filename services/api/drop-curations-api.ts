import type { ApiDropCurationRequest } from "@/generated/models/ApiDropCurationRequest";
import { commonApiDeleteWithBody } from "@/services/api/common-api";
import { publicEnv } from "@/config/env";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";

const getDropCurationEndpoint = (dropId: string): string =>
  `${publicEnv.API_ENDPOINT}/api/drops/${dropId}/curations`;

const getDropCurationHeaders = (): Record<string, string> => {
  const apiAuth = getStagingAuth();
  const walletAuth = getAuthJwt();

  return {
    "Content-Type": "application/json",
    ...(apiAuth ? { "x-6529-auth": apiAuth } : {}),
    ...(walletAuth ? { Authorization: `Bearer ${walletAuth}` } : {}),
  };
};

const getErrorMessageFromResponse = async (
  response: Response
): Promise<string> => {
  const fallbackErrorMessage = response.statusText || "Something went wrong";

  try {
    const rawContent = await response.text();
    if (!rawContent) {
      return fallbackErrorMessage;
    }

    try {
      const parsedBody = JSON.parse(rawContent) as Record<string, unknown>;
      if (typeof parsedBody["error"] === "string") {
        return parsedBody["error"];
      }
      if (typeof parsedBody["message"] === "string") {
        return parsedBody["message"];
      }
    } catch {
      return rawContent;
    }

    return rawContent;
  } catch {
    return fallbackErrorMessage;
  }
};

export const postDropCuration = async ({
  dropId,
  body,
}: {
  readonly dropId: string;
  readonly body: ApiDropCurationRequest;
}): Promise<void> => {
  const response = await fetch(getDropCurationEndpoint(dropId), {
    method: "POST",
    headers: getDropCurationHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response));
  }
};

export const deleteDropCuration = async ({
  dropId,
  body,
}: {
  readonly dropId: string;
  readonly body: ApiDropCurationRequest;
}): Promise<void> => {
  await commonApiDeleteWithBody<ApiDropCurationRequest, void>({
    endpoint: `drops/${dropId}/curations`,
    body,
  });
};

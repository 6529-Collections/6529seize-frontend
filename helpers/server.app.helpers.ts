import { publicEnv } from "@/config/env";
import { API_AUTH_COOKIE } from "@/constants";
import { generateClientSignature } from "@/helpers/server-signature.helpers";
import { WALLET_AUTH_COOKIE } from "@/services/auth/auth.utils";
import { cookies } from "next/headers";

export const getAppCommonHeaders = async (): Promise<
  Record<string, string>
> => {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(API_AUTH_COOKIE)?.value;
  const walletAuthCookie = cookieStore.get(WALLET_AUTH_COOKIE)?.value;

  return {
    ...(authCookie ? { [API_AUTH_COOKIE]: authCookie } : {}),
    ...(walletAuthCookie
      ? { Authorization: `Bearer ${walletAuthCookie}` }
      : {}),
  };
};

export const getClientIdHeaders = (
  method: string,
  path: string
): Record<string, string> => {
  if (typeof window !== "undefined") {
    return {};
  }

  const clientId = publicEnv.SSR_CLIENT_ID;
  const clientSecret = publicEnv.SSR_CLIENT_SECRET;

  if (!clientId || !clientSecret || !path) {
    return {};
  }

  const signatureData = generateClientSignature(
    clientId,
    clientSecret,
    method,
    path
  );

  return {
    "x-6529-internal-id": signatureData.clientId,
    "x-6529-internal-signature": signatureData.signature,
    "x-6529-internal-timestamp": signatureData.timestamp.toString(),
  };
};

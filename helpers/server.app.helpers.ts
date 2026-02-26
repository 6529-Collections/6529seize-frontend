import { cookies } from "next/headers";

import { API_AUTH_COOKIE } from "@/constants/constants";
import { WALLET_AUTH_COOKIE } from "@/services/auth/auth.utils";

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

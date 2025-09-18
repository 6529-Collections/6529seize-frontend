import { API_AUTH_COOKIE } from "@/constants";
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

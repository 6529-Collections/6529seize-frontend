import { cookies } from "next/headers";

export const getAppCommonHeaders = async (): Promise<
  Record<string, string>
> => {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("x-6529-auth")?.value;
  const walletAuthCookie = cookieStore.get("wallet-auth")?.value;

  return {
    ...(authCookie ? { "x-6529-auth": authCookie } : {}),
    ...(walletAuthCookie
      ? { Authorization: `Bearer ${walletAuthCookie}` }
      : {}),
  };
};

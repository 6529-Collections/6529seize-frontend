import Cookies from "js-cookie";

const WALLET_AUTH_COOKIE = "wallet-auth";

export const setAuthJwt = (jwt: string) => {
  Cookies.set(WALLET_AUTH_COOKIE, jwt, { expires: 7 });
};

export const getAuthJwt = () => {
  return Cookies.get(WALLET_AUTH_COOKIE) ?? null;
};

export const removeAuthJwt = () => {
  Cookies.remove(WALLET_AUTH_COOKIE);
};

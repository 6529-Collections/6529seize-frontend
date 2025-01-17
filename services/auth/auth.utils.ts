import Cookies from "js-cookie";
import {
  WALLET_REFRESH_TOKEN_COOKIE,
  WALLET_AUTH_COOKIE,
  WALLET_ADDRESS_COOKIE,
  WALLET_ROLE_COOKIE,
} from "../../constants";

export const setAuthJwt = (
  address: string,
  jwt: string,
  refreshToken: string,
  role?: string,
  walletType?: string
) => {
  //short expiry for auth token
  Cookies.set(WALLET_AUTH_COOKIE, jwt, { expires: 7 });

  //long expiry for address, refresh token and role
  Cookies.set(WALLET_ADDRESS_COOKIE, address, { expires: 365 });
  Cookies.set(WALLET_REFRESH_TOKEN_COOKIE, refreshToken, { expires: 365 });
  if (role) {
    Cookies.set(WALLET_ROLE_COOKIE, role, { expires: 365 });
  }
};

export const getAuthJwt = () => {
  return Cookies.get(WALLET_AUTH_COOKIE) ?? null;
};

export const getRefreshToken = () => {
  return Cookies.get(WALLET_REFRESH_TOKEN_COOKIE) ?? null;
};

export const getWalletAddress = () => {
  return Cookies.get(WALLET_ADDRESS_COOKIE) ?? null;
};

export const getWalletRole = () => {
  return Cookies.get(WALLET_ROLE_COOKIE) ?? null;
};

export const removeAuthJwt = () => {
  Cookies.remove(WALLET_AUTH_COOKIE);
  Cookies.remove(WALLET_ADDRESS_COOKIE);
  Cookies.remove(WALLET_REFRESH_TOKEN_COOKIE);
  Cookies.remove(WALLET_ROLE_COOKIE);
};

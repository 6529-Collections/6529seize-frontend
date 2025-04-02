import Cookies from "js-cookie";
import {
  WALLET_REFRESH_TOKEN_COOKIE,
  WALLET_AUTH_COOKIE,
  WALLET_ADDRESS_COOKIE,
  WALLET_ROLE_COOKIE,
} from "../../constants";
import { jwtDecode } from "jwt-decode";

const COOKIE_OPTIONS = {
  secure: true,
  sameSite: "strict" as const,
};

const COOKIE_OPTIONS_LONG = {
  ...COOKIE_OPTIONS,
  expires: 365,
};

const getJwtExpiration = (jwt: string): number => {
  const decodedJwt = jwtDecode<{
    exp: number;
  }>(jwt);
  return decodedJwt.exp;
};

export const setAuthJwt = (
  address: string,
  jwt: string,
  refreshToken: string,
  role?: string
) => {
  const jwtExpiration = getJwtExpiration(jwt);
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = jwtExpiration - now;
  const expiresInDays = expiresInSeconds / 86400;

  // custom expiry for auth token
  Cookies.set(WALLET_AUTH_COOKIE, jwt, {
    ...COOKIE_OPTIONS,
    expires: expiresInDays,
  });

  // long expiry for address, refresh token and role
  Cookies.set(WALLET_ADDRESS_COOKIE, address, COOKIE_OPTIONS_LONG);
  Cookies.set(WALLET_REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS_LONG);
  if (role) {
    Cookies.set(WALLET_ROLE_COOKIE, role, COOKIE_OPTIONS_LONG);
  }
};


// TODO: change these back
 export const getAuthJwt = () => {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBlOTUyODVjLTg3MmItNDk5My1hMjJiLTMzMTY0MGU0YTY2ZCIsInN1YiI6IjB4MjNhODY3YzliMzljOTQwZTk0NjdmNWIzYjQzZmEwZTVhMmJkMWU2ZSIsInJvbGUiOiIwZjgzMmZlOS04N2I0LTExZWUtOWQ4Mi0wMjlhMGU0YjYxNTkiLCJpYXQiOjE3NDM0OTYwODYsImV4cCI6MTc0NjEyNDM3NH0.Huz0VI3CCnJWRaNyxBgKO_6Z1MpTlyB3h-3gR13Lj_Q"
  return Cookies.get(WALLET_AUTH_COOKIE) ?? null;
};

export const getRefreshToken = () => {
  return "aaeb862e5de03ded56ad6f1424dad3d3d5c1c412cac1ed3bc326f71877c8e8b3b8052d479d1c22514d583fcff65e01033937c99282ba6584f2e7a4093585ed9d"
  return Cookies.get(WALLET_REFRESH_TOKEN_COOKIE) ?? null;
};

export const getWalletAddress = () => {
  return "0x23a867C9b39c940E9467f5b3B43FA0e5a2bD1e6E"
  return Cookies.get(WALLET_ADDRESS_COOKIE) ?? null;
};

export const getWalletRole = () => {
  return Cookies.get(WALLET_ROLE_COOKIE) ?? null;
};

export const removeAuthJwt = () => {
  Cookies.remove(WALLET_AUTH_COOKIE, COOKIE_OPTIONS);
  Cookies.remove(WALLET_ADDRESS_COOKIE, COOKIE_OPTIONS_LONG);
  Cookies.remove(WALLET_REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS_LONG);
  Cookies.remove(WALLET_ROLE_COOKIE, COOKIE_OPTIONS_LONG);
};

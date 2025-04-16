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

export const getAuthJwt = () => {
  // TODO: remove this
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwZmJiN2UzLTVkNzYtNGQwNy04ZDc0LTljYjFmOWI2OWNjYyIsInN1YiI6IjB4MjNhODY3YzliMzljOTQwZTk0NjdmNWIzYjQzZmEwZTVhMmJkMWU2ZSIsInJvbGUiOiIwZjgzMmZlOS04N2I0LTExZWUtOWQ4Mi0wMjlhMGU0YjYxNTkiLCJpYXQiOjE3NDQyMDY2NzMsImV4cCI6MTc0NjgzNDk2MX0.zzi259KlrkJAHYMn280R8z3IPpg33Iwzu4iJtGH6tCk"
  return Cookies.get(WALLET_AUTH_COOKIE) ?? null;
};

export const getRefreshToken = () => {
  return Cookies.get(WALLET_REFRESH_TOKEN_COOKIE) ?? null;
};

export const getWalletAddress = () => {
  // TODO: remove this
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

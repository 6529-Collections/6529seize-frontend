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
  if (true) {
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNhZTVjMzg4LTk2NWMtNDYzMi04OTRhLWQ0NTYwZDIzN2JjNyIsInN1YiI6IjB4OWI4Nzc1ZTdhMWU2YmYwNzQ1NmJiODEwZmIwN2VmODIzNzViYTEzMiIsInJvbGUiOiJhZmNiOWRhMy05NzY5LTRjNWUtOGQwMi0xMzdlNmNmZjY3YWUiLCJpYXQiOjE3NDM1MDc0MjcsImV4cCI6MTc0NjEzNTcxNX0.QMBPoJXWZL-0HX2fXyOtgCmWHNx25pjZ_agDYEE4_vQ";
  }
  return Cookies.get(WALLET_AUTH_COOKIE) ?? null;
};

export const getRefreshToken = () => {
  if (true) {
    return "77ce023da5e8e3f57fa5012b36c0635ec1b0e4a83e6d414150a215fb70afcdbb8d4cb0b224cbb87580ddd4cc5aeec1c74fc5fd731b970f9706b1f9fcdcb22b7d";
  }
  return Cookies.get(WALLET_REFRESH_TOKEN_COOKIE) ?? null;
};

export const getWalletAddress = () => {
  if (true) {
    return "0x9B8775e7A1e6BF07456bB810fb07ef82375ba132";
  }
  return Cookies.get(WALLET_ADDRESS_COOKIE) ?? null;
}; 


/* export const getAuthJwt = () => {
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
}; */

export const removeAuthJwt = () => {
  Cookies.remove(WALLET_AUTH_COOKIE, COOKIE_OPTIONS);
  Cookies.remove(WALLET_ADDRESS_COOKIE, COOKIE_OPTIONS_LONG);
  Cookies.remove(WALLET_REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS_LONG);
  Cookies.remove(WALLET_ROLE_COOKIE, COOKIE_OPTIONS_LONG);
};

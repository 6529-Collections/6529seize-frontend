import Cookies from "js-cookie";
import {
  WALLET_REFRESH_TOKEN_COOKIE,
  WALLET_AUTH_COOKIE,
  WALLET_ADDRESS_COOKIE,
  WALLET_ROLE_COOKIE,
  WALLET_TYPE_COOKIE,
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
  if (walletType) {
    Cookies.set(WALLET_TYPE_COOKIE, walletType, { expires: 365 });
  }
};


export const getAuthJwt = () => {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1Y2I4YzlkLTExNDQtNDlkMi1iMTUzLTk3NGIyZTY4ZWVkOSIsInN1YiI6IjB4Y2U4ZDcyOWEyYmZhZGQ2OTRjM2EyZDA0YzQ3ZDJjODk2OTBjNzNmMSIsImlhdCI6MTczNzEwOTMwOCwiZXhwIjoxNzM3Mjc1NzA4fQ.xluO-2_vResBuI-rurDsu0K14RoQCizrBk11xirz-I8"
};

export const getRefreshToken = () => {
  return "a6460fa0c4fe0f66ea54f0d1cf54718afcc8497d797388933e5aa0b1fb179a73260817d07489281eedc39672e17465bd247d8d29d21bdb4aae3aba6f0073a375"
};

export const getWalletAddress = () => {
  return "0xce8d729a2bfadd694c3a2d04c47d2c89690c73f1"
};


export const getWalletType = () => {
  return Cookies.get(WALLET_TYPE_COOKIE) ?? null;
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
*/

export const getWalletRole = () => {
  return Cookies.get(WALLET_ROLE_COOKIE) ?? null;
};

export const removeAuthJwt = () => {
  Cookies.remove(WALLET_AUTH_COOKIE);
  Cookies.remove(WALLET_ADDRESS_COOKIE);
  Cookies.remove(WALLET_REFRESH_TOKEN_COOKIE);
  Cookies.remove(WALLET_ROLE_COOKIE);
  Cookies.remove(WALLET_TYPE_COOKIE);
};

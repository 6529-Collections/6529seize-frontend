import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { safeLocalStorage } from "../../helpers/safeLocalStorage";

export const WALLET_AUTH_COOKIE = "wallet-auth";

// TODO: remove these cookies once migration is complete
const WALLET_ADDRESS_COOKIE = "wallet-address";
const WALLET_REFRESH_TOKEN_COOKIE = "wallet-refresh-token";
const WALLET_ROLE_COOKIE = "wallet-role";

const WALLET_ADDRESS_STORAGE_KEY = "6529-wallet-address";
const WALLET_REFRESH_TOKEN_STORAGE_KEY = "6529-wallet-refresh-token";
const WALLET_ROLE_STORAGE_KEY = "6529-wallet-role";

const COOKIE_OPTIONS = {
  secure: true,
  sameSite: "strict" as const,
};

const getJwtExpiration = (jwt: string): number => {
  const decodedJwt = jwtDecode<{
    exp: number;
  }>(jwt);
  return decodedJwt.exp;
};

// TODO: remove these cookies once migration is complete
export const migrateCookiesToLocalStorage = () => {
  const walletAddress = Cookies.get(WALLET_ADDRESS_COOKIE);
  const walletRefreshToken = Cookies.get(WALLET_REFRESH_TOKEN_COOKIE);
  const walletRole = Cookies.get(WALLET_ROLE_COOKIE);

  if (walletAddress) {
    safeLocalStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, walletAddress);
    Cookies.remove(WALLET_ADDRESS_COOKIE);
  }
  if (walletRefreshToken) {
    safeLocalStorage.setItem(
      WALLET_REFRESH_TOKEN_STORAGE_KEY,
      walletRefreshToken
    );
    Cookies.remove(WALLET_REFRESH_TOKEN_COOKIE);
  }
  if (walletRole) {
    safeLocalStorage.setItem(WALLET_ROLE_STORAGE_KEY, walletRole);
    Cookies.remove(WALLET_ROLE_COOKIE);
  }
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

  safeLocalStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, address);
  safeLocalStorage.setItem(WALLET_REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  if (role) {
    safeLocalStorage.setItem(WALLET_ROLE_STORAGE_KEY, role);
  }
};

//  export const getAuthJwt = () => {
//   if (true) {
//     return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NTEyN2ZiLWI2NjctNDNkMS05MTdkLWRjNmFkMWIwZGU1MSIsInN1YiI6IjB4OWI4Nzc1ZTdhMWU2YmYwNzQ1NmJiODEwZmIwN2VmODIzNzViYTEzMiIsInJvbGUiOiJhZmNiOWRhMy05NzY5LTRjNWUtOGQwMi0xMzdlNmNmZjY3YWUiLCJpYXQiOjE3NDY0NDM5NzQsImV4cCI6MTc0OTA3MjI2Mn0.0p_hd9ZX57agqa-CvxWYfRdZiphRv25o6mAVIhtoPlQ";
//   }
//   return Cookies.get(WALLET_AUTH_COOKIE) ?? null;
// };

// export const getRefreshToken = () => {
//   if (true) {
//     return "77ce023da5e8e3f57fa5012b36c0635ec1b0e4a83e6d414150a215fb70afcdbb8d4cb0b224cbb87580ddd4cc5aeec1c74fc5fd731b970f9706b1f9fcdcb22b7d";
//   }
//   return Cookies.get(WALLET_REFRESH_TOKEN_COOKIE) ?? null;
// };

// export const getWalletAddress = () => {
//   if (true) {
//     return "0x9B8775e7A1e6BF07456bB810fb07ef82375ba132";
//   }
//   return Cookies.get(WALLET_ADDRESS_COOKIE) ?? null;
// }; 


export const getAuthJwt = () => {
  return Cookies.get(WALLET_AUTH_COOKIE) ?? null;
};

export const getRefreshToken = () => {
  return safeLocalStorage.getItem(WALLET_REFRESH_TOKEN_STORAGE_KEY) ?? null;
};

export const getWalletAddress = () => {
  return safeLocalStorage.getItem(WALLET_ADDRESS_STORAGE_KEY) ?? null;
};

export const getWalletRole = () => {
  return safeLocalStorage.getItem(WALLET_ROLE_STORAGE_KEY) ?? null;
};

export const removeAuthJwt = () => {
  Cookies.remove(WALLET_AUTH_COOKIE, COOKIE_OPTIONS);
  safeLocalStorage.removeItem(WALLET_ADDRESS_STORAGE_KEY);
  safeLocalStorage.removeItem(WALLET_REFRESH_TOKEN_STORAGE_KEY);
  safeLocalStorage.removeItem(WALLET_ROLE_STORAGE_KEY);
};

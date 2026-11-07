/**
 * @jest-environment-options {"url": "https://6529.io/"}
 */
import {
  AUTH_TOKEN_CHANGED_EVENT,
  getAuthJwt,
  syncWalletAuthCookie,
} from "@/services/auth/auth.utils";
import { render } from "@testing-library/react";
import { StrictMode, useEffect } from "react";

// Real js-cookie, jwt-decode and document.cookie: no module mocks here.
const ADDRESS = "0x0000000000000000000000000000000000000529";
const b64 = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const STORED_JWT = [
  b64({ alg: "none", typ: "JWT" }),
  b64({ sub: ADDRESS, exp: Math.floor(Date.now() / 1000) + 3600 }),
  "",
].join(".");

// Mirrors the SeizeConnectProvider mount effect.
function SessionCookieSync() {
  useEffect(() => {
    syncWalletAuthCookie();
  }, []);
  return null;
}

const cookieEntries = () =>
  document.cookie
    .split("; ")
    .filter(Boolean)
    .map((entry) => entry.split("=")[0]);

describe("syncWalletAuthCookie in a real cookie jar", () => {
  beforeEach(() => {
    const { publicEnv } = require("@/config/env");
    publicEnv.USE_DEV_AUTH = "false";
    localStorage.setItem(
      "6529-wallet-accounts",
      JSON.stringify([
        {
          address: ADDRESS,
          jwt: STORED_JWT,
          refreshToken: null,
          role: null,
          profileId: null,
          profileHandle: null,
          authSessionVersion: "v2",
        },
      ])
    );
    localStorage.setItem("6529-wallet-active-address", ADDRESS);
    document.cookie = "wallet-auth=legacy-token; path=/";
  });

  afterEach(() => {
    localStorage.clear();
    for (const name of ["__Host-wallet-auth", "wallet-auth"]) {
      document.cookie = `${name}=; path=/; Secure; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });

  it("is idempotent across a StrictMode double mount and a remount", () => {
    const listener = jest.fn();
    globalThis.addEventListener(AUTH_TOKEN_CHANGED_EVENT, listener);
    try {
      const first = render(
        <StrictMode>
          <SessionCookieSync />
        </StrictMode>
      );
      expect(cookieEntries()).toEqual(["__Host-wallet-auth"]);
      expect(document.cookie).toBe(`__Host-wallet-auth=${STORED_JWT}`);
      expect(getAuthJwt()).toBe(STORED_JWT);

      first.unmount();
      render(
        <StrictMode>
          <SessionCookieSync />
        </StrictMode>
      );
      expect(cookieEntries()).toEqual(["__Host-wallet-auth"]);
      expect(getAuthJwt()).toBe(STORED_JWT);
      expect(listener).not.toHaveBeenCalled();
    } finally {
      globalThis.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, listener);
    }
  });
});

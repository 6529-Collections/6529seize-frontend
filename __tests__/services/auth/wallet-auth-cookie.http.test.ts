/**
 * @jest-environment-options {"url": "http://dev.local/"}
 */
import { writeWalletAuthCookie } from "@/services/auth/wallet-auth-cookie";
import Cookies from "js-cookie";

// Real js-cookie and jsdom cookie jar on a plain-http development origin. In
// Chromium and Firefox a Secure expiry write does not remove a non-Secure
// cookie on such a host; jsdom does not model that rule, so the test also
// checks that a removal without Secure is sent. The https case is covered in
// wallet-auth-cookie.strict-mode.test.tsx.
const b64 = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const JWT = [
  b64({ alg: "none", typ: "JWT" }),
  b64({
    sub: "0x0000000000000000000000000000000000000529",
    exp: Math.floor(Date.now() / 1000) + 3600,
  }),
  "",
].join(".");

const cookieNames = () =>
  document.cookie
    .split("; ")
    .filter(Boolean)
    .map((entry) => entry.split("=")[0]);

describe("writeWalletAuthCookie on a plain-http origin", () => {
  beforeEach(() => {
    // How the agent-login tools wrote the old cookie over http: no Secure.
    document.cookie = "wallet-auth=legacy-token; path=/; SameSite=Strict";
    expect(cookieNames()).toContain("wallet-auth");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.cookie =
      "wallet-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });

  it.each([
    ["writing a session", JWT],
    ["signing out", null],
  ])("clears the unprefixed cookie when %s", (_, jwt) => {
    const remove = jest.spyOn(Cookies, "remove");

    writeWalletAuthCookie(jwt);

    expect(cookieNames()).not.toContain("wallet-auth");
    expect(remove).toHaveBeenCalledWith("wallet-auth", {
      path: "/",
      sameSite: "strict",
    });
  });
});

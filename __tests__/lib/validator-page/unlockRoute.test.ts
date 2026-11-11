/** @jest-environment node */
import { NextRequest } from "next/server";

import { isAccessCookieValid } from "@/lib/validator-page/accessGate";

const PASSWORD = "test-only-password-3";

type UnlockRoute = typeof import("@/app/validator/unlock/route");

function loadRoute(): UnlockRoute {
  let route: UnlockRoute | undefined;
  jest.isolateModules(() => {
    route = require("@/app/validator/unlock/route") as UnlockRoute;
  });
  return route!;
}

function post(fields: Record<string, string>, ip = "8.8.8.8"): NextRequest {
  return new NextRequest("https://6529.io/validator/unlock", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-forwarded-for": ip,
    },
    body: new URLSearchParams(fields).toString(),
  });
}

describe("POST /validator/unlock", () => {
  beforeEach(() => {
    process.env["VALIDATOR_PAGE_PASSWORD"] = PASSWORD;
    delete process.env["VALIDATOR_PAGE_PUBLIC"];
  });

  afterAll(() => {
    delete process.env["VALIDATOR_PAGE_PASSWORD"];
  });

  it("sets a strict, HttpOnly 30-day cookie for the right password", async () => {
    const { POST } = loadRoute();
    const response = await POST(
      post({ password: ` ${PASSWORD}\n`, next: "/validator/guide" })
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/validator/guide");
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^validator_access=v1\.\d+\.[\w-]+; /);
    expect(cookie).toContain("Path=/validator");
    expect(cookie).toContain("Max-Age=2592000");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    const value = /^validator_access=([^;]+)/.exec(cookie)?.[1];
    expect(isAccessCookieValid(value, PASSWORD)).toBe(true);
  });

  it("sends a wrong password back to the form, with no cookie", async () => {
    const { POST } = loadRoute();
    const response = await POST(
      post({ password: "wrong", next: "/validator" })
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/validator?gate=wrong");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("never redirects off /validator", async () => {
    const { POST } = loadRoute();
    const response = await POST(
      post({ password: PASSWORD, next: "https://example.com/" })
    );
    expect(response.headers.get("location")).toBe("/validator");
  });

  it("stops checking after ten tries from one address in 15 minutes", async () => {
    const { POST } = loadRoute();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await POST(post({ password: "wrong" }, "1.1.1.1"));
      expect(response.headers.get("location")).toBe("/validator?gate=wrong");
    }
    const blocked = await POST(post({ password: PASSWORD }, "1.1.1.1"));
    expect(blocked.headers.get("location")).toBe("/validator?gate=wait");
    expect(blocked.headers.get("set-cookie")).toBeNull();

    const otherAddress = await POST(post({ password: PASSWORD }, "1.0.0.1"));
    expect(otherAddress.headers.get("set-cookie")).not.toBeNull();
  });

  describe("shared budget of wrong passwords", () => {
    beforeEach(() => {
      jest.useFakeTimers({ now: new Date("2026-11-10T00:00:00.000Z") });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    /** Sends `count` wrong passwords, ten per address so none is limited. */
    async function failMany(
      POST: UnlockRoute["POST"],
      count: number,
      firstOctet: number
    ): Promise<void> {
      for (let attempt = 0; attempt < count; attempt += 1) {
        const ip = `${firstOctet}.0.${Math.floor(attempt / 10)}.1`;
        const response = await POST(post({ password: "wrong" }, ip));
        expect(response.headers.get("location")).toBe("/validator?gate=wrong");
      }
    }

    it("pauses every unlock once 100 wrong passwords arrive from many addresses", async () => {
      const { POST } = loadRoute();
      await failMany(POST, 100, 20);

      const blocked = await POST(post({ password: PASSWORD }, "9.9.9.9"));
      expect(blocked.headers.get("location")).toBe("/validator?gate=wait");
      expect(blocked.headers.get("set-cookie")).toBeNull();

      jest.advanceTimersByTime(15 * 60 * 1000);
      const later = await POST(post({ password: PASSWORD }, "9.9.9.9"));
      expect(later.headers.get("location")).toBe("/validator");
      expect(later.headers.get("set-cookie")).not.toBeNull();
    });

    it("does not spend the budget on right passwords", async () => {
      const { POST } = loadRoute();
      await failMany(POST, 99, 30);
      for (let index = 0; index < 5; index += 1) {
        const ok = await POST(post({ password: PASSWORD }, `40.0.0.${index}`));
        expect(ok.headers.get("set-cookie")).not.toBeNull();
      }

      const lastWrong = await POST(post({ password: "wrong" }, "50.0.0.1"));
      expect(lastWrong.headers.get("location")).toBe("/validator?gate=wrong");
      const paused = await POST(post({ password: "wrong" }, "50.0.0.2"));
      expect(paused.headers.get("location")).toBe("/validator?gate=wait");
    });
  });

  it("treats an oversized form as a wrong password", async () => {
    const { POST } = loadRoute();
    const response = await POST(
      post({ password: PASSWORD, next: "/validator", pad: "x".repeat(8192) })
    );
    expect(response.headers.get("location")).toBe("/validator?gate=wrong");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("sends a GET back to the page", () => {
    const { GET } = loadRoute();
    expect(GET().headers.get("location")).toBe("/validator");
  });
});

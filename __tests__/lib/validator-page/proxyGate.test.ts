/** @jest-environment node */
import { NextRequest } from "next/server";

import { createAccessCookieValue } from "@/lib/validator-page/accessGate";
import { handleValidatorPageGate } from "@/lib/validator-page/proxyGate";

const PASSWORD = "test-only-password-2";

function request(
  path: string,
  init: {
    cookie?: string;
    headers?: Record<string, string>;
    method?: string;
  } = {}
): NextRequest {
  const headers = new Headers(init.headers);
  if (init.cookie) {
    headers.set("cookie", `validator_access=${init.cookie}`);
  }
  return new NextRequest(`https://6529.io${path}`, {
    method: init.method ?? "GET",
    headers,
  });
}

function rewriteTarget(response: Response | undefined): string | null {
  return response?.headers.get("x-middleware-rewrite") ?? null;
}

describe("handleValidatorPageGate", () => {
  beforeEach(() => {
    process.env["VALIDATOR_PAGE_PASSWORD"] = PASSWORD;
    delete process.env["VALIDATOR_PAGE_PUBLIC"];
  });

  afterAll(() => {
    delete process.env["VALIDATOR_PAGE_PASSWORD"];
  });

  it("ignores paths outside /validator", () => {
    expect(
      handleValidatorPageGate(request("/waves"), "/waves")
    ).toBeUndefined();
    expect(
      handleValidatorPageGate(request("/validatorx"), "/validatorx")
    ).toBeUndefined();
  });

  it.each([
    "/validator",
    "/validator/guide",
    "/validator/hardware",
    "/validator/download/x/y",
  ])("shows the password form at %s without a cookie", (path) => {
    const response = handleValidatorPageGate(request(path), path);
    expect(rewriteTarget(response)).toBe("https://6529.io/validator/locked");
    expect(
      response?.headers.get("x-middleware-request-x-6529-validator-next")
    ).toBe(path);
  });

  it("keeps the pages' screenshots in public/validator behind the password", () => {
    const path = "/validator/app-today.webp";
    expect(rewriteTarget(handleValidatorPageGate(request(path), path))).toBe(
      "https://6529.io/validator/locked"
    );
    const valid = createAccessCookieValue(PASSWORD);
    expect(
      handleValidatorPageGate(request(path, { cookie: valid }), path)
    ).toBeUndefined();
  });

  it("lets a valid cookie through and refuses a forged one", () => {
    const valid = createAccessCookieValue(PASSWORD);
    expect(
      handleValidatorPageGate(
        request("/validator", { cookie: valid }),
        "/validator"
      )
    ).toBeUndefined();
    const forged = createAccessCookieValue("another-password");
    expect(
      rewriteTarget(
        handleValidatorPageGate(
          request("/validator", { cookie: forged }),
          "/validator"
        )
      )
    ).toBe("https://6529.io/validator/locked");
  });

  it.each([
    "/validator/releases.json",
    "/validator/releases.json.sig",
    "/validator/unlock",
    "/validator/authorize",
  ])("keeps %s open without a cookie", (path) => {
    expect(handleValidatorPageGate(request(path), path)).toBeUndefined();
  });

  it("locks a path below the authorize page", () => {
    expect(
      rewriteTarget(
        handleValidatorPageGate(
          request("/validator/authorize/more"),
          "/validator/authorize/more"
        )
      )
    ).toBe("https://6529.io/validator/locked");
  });

  it.each([
    "/%76alidator/app-today.webp",
    "/%76%61lidator/guide",
    "/validator%2Fapp-today.webp",
    "/%76alidator/%E0%A4%A",
  ])("gates %s, a spelling of a path under /validator", (path) => {
    expect(rewriteTarget(handleValidatorPageGate(request(path), path))).toBe(
      "https://6529.io/validator/locked"
    );
  });

  it("opens everything when the page is public or has no password", () => {
    process.env["VALIDATOR_PAGE_PUBLIC"] = "true";
    expect(
      handleValidatorPageGate(request("/validator"), "/validator")
    ).toBeUndefined();
    const encoded = "/%76alidator/app-today.webp";
    expect(handleValidatorPageGate(request(encoded), encoded)).toBeUndefined();
    delete process.env["VALIDATOR_PAGE_PUBLIC"];
    delete process.env["VALIDATOR_PAGE_PASSWORD"];
    expect(
      handleValidatorPageGate(request("/validator"), "/validator")
    ).toBeUndefined();
  });

  it("reloads a navigation from another site once, so the strict cookie is sent", async () => {
    const response = handleValidatorPageGate(
      request("/validator", {
        headers: {
          "sec-fetch-site": "cross-site",
          "sec-fetch-mode": "navigate",
        },
      }),
      "/validator"
    );
    expect(response?.status).toBe(200);
    expect(response?.headers.get("cache-control")).toBe("private, no-store");
    const html = (await response?.text()) ?? "";
    expect(html).toContain('http-equiv="refresh"');
    // A refresh to the same address with a fragment only scrolls, so a
    // link to /validator#send-feedback would stay here: the page reloads.
    expect(html).toContain("<script>location.reload()</script>");

    const sameSite = handleValidatorPageGate(
      request("/validator", {
        headers: {
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "navigate",
        },
      }),
      "/validator"
    );
    expect(rewriteTarget(sameSite)).toBe("https://6529.io/validator/locked");
  });
});

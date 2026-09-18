import type { Page, Route } from "@playwright/test";

import { installLocalMuseumCountryCheck } from "../../tests/support/localMuseumCountryCheck";
import {
  assertNoConsoleErrors,
  assertNoFailedResponses,
} from "../../tests/support/consoleDiagnostics";

describe("local Museum country lookup fixture", () => {
  const originalEnvironment = process.env["PLAYWRIGHT_ENV"];
  const disposeRoute = jest
    .fn<Promise<void>, []>()
    .mockResolvedValue(undefined);
  const registerRoute = jest
    .fn<ReturnType<Page["route"]>, Parameters<Page["route"]>>()
    .mockResolvedValue({
      dispose: disposeRoute,
      [Symbol.asyncDispose]: disposeRoute,
    });

  beforeEach(() => {
    delete process.env["PLAYWRIGHT_ENV"];
    registerRoute.mockClear();
  });

  afterAll(() => {
    if (originalEnvironment === undefined) {
      delete process.env["PLAYWRIGHT_ENV"];
    } else {
      process.env["PLAYWRIGHT_ENV"] = originalEnvironment;
    }
  });

  it.each([
    "http://localhost:3001",
    "http://127.0.0.1:3101",
    "http://[::1]:3001",
  ])("installs on the local test origin %s", async (baseURL) => {
    await installLocalMuseumCountryCheck({ route: registerRoute }, baseURL);
    expect(registerRoute).toHaveBeenCalledTimes(1);
  });

  it.each(["staging", "production", "remote", "unknown"])(
    "preserves live requests in the explicit %s environment",
    async (environment) => {
      process.env["PLAYWRIGHT_ENV"] = environment;
      await installLocalMuseumCountryCheck(
        { route: registerRoute },
        "http://localhost:3001"
      );
      expect(registerRoute).not.toHaveBeenCalled();
    }
  );

  it.each([
    undefined,
    "https://staging.6529.io",
    "https://6529.io",
    "http://localhost.example.com",
    "https://localhost:3001",
    "http://fixture:password@localhost:3001",
  ])(
    "does not install on a nonlocal or untrusted origin %s",
    async (baseURL) => {
      process.env["PLAYWRIGHT_ENV"] = "local";
      await installLocalMuseumCountryCheck({ route: registerRoute }, baseURL);
      expect(registerRoute).not.toHaveBeenCalled();
    }
  );

  async function fixtureRegistration() {
    await installLocalMuseumCountryCheck(
      { route: registerRoute },
      "http://localhost:3001"
    );
    const registration = registerRoute.mock.calls[0];
    if (!registration || typeof registration[0] !== "function") {
      throw new Error("Expected a URL predicate and route handler.");
    }
    return { matches: registration[0], handle: registration[1] };
  }

  it("matches only the exact hosted HTTPS country-check endpoints", async () => {
    const { matches } = await fixtureRegistration();
    expect(
      matches(new URL("https://api.6529.io/api/policies/country-check"))
    ).toBe(true);
    expect(
      matches(new URL("https://api.staging.6529.io/api/policies/country-check"))
    ).toBe(true);
    for (const url of [
      "http://api.6529.io/api/policies/country-check",
      "https://api.6529.io:444/api/policies/country-check",
      "https://api.6529.io.example.com/api/policies/country-check",
      "https://api.6529.io/api/policies/country-check/other",
      "https://api.6529.io/api/policies/country-check/",
      "https://api.6529.io/api/policies/cookies-consent",
      "https://api.6529.io/api/settings",
      "https://api.6529.io/api/waves",
      "https://artblocks-mainnet.s3.amazonaws.com/164000308.png",
      "http://localhost:3001/api/policies/country-check",
      "https://fixture:password@api.6529.io/api/policies/country-check",
    ]) {
      expect(matches(new URL(url))).toBe(false);
    }
  });

  function mockRoute(method: string) {
    const fulfill = jest.fn().mockResolvedValue(undefined);
    const fallback = jest.fn().mockResolvedValue(undefined);
    const request = { method: () => method };
    const route = {
      request: () => request,
      fulfill,
      fallback,
    } as unknown as Route;
    return { route, fulfill, fallback };
  }

  it("returns a deterministic country for GET", async () => {
    const { handle } = await fixtureRegistration();
    const { route, fulfill, fallback } = mockRoute("GET");
    await handle(route, route.request());
    expect(fulfill).toHaveBeenCalledWith({
      status: 200,
      json: { country: "US", is_eu: false },
    });
    expect(fallback).not.toHaveBeenCalled();
  });

  it.each(["POST", "DELETE", "OPTIONS", "HEAD"])(
    "passes %s through to the existing request guards",
    async (method) => {
      const { handle } = await fixtureRegistration();
      const { route, fulfill, fallback } = mockRoute(method);
      await handle(route, route.request());
      expect(fallback).toHaveBeenCalledTimes(1);
      expect(fulfill).not.toHaveBeenCalled();
    }
  );

  it.each([
    "http://localhost:3001/museum/network/research/institutional-practice",
    "https://api.6529.io/api/waves",
    "https://rpc.walletconnect.org/v1/",
  ])("still rejects HTTP 500 console and response errors for %s", (url) => {
    const diagnostics = {
      consoleErrors: [
        "Failed to load resource: the server responded with a status of 500 ()",
      ],
      failedResponses: [`500 GET ${url}`],
      pageErrors: [],
    };
    expect(() => assertNoConsoleErrors(diagnostics)).toThrow(
      "Unexpected browser console error(s)"
    );
    expect(() => assertNoFailedResponses(diagnostics)).toThrow(
      "Unexpected browser 5xx response(s)"
    );
  });
});

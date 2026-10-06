import type { Page } from "@playwright/test";

import {
  attachMuseumMediaDiagnostics,
  museumMediaEvidenceHeaders,
  museumMediaEvidenceUrl,
} from "../../tests/support/museumMediaDiagnostics";
import type { PageDiagnostics } from "../../tests/support/consoleDiagnostics";

const SOURCE =
  "https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031.png";

it("confines evidence to Art Blocks transport and removes private URL fields and headers", () => {
  expect(museumMediaEvidenceUrl(`${SOURCE}?token=private#fragment`)).toBe(
    SOURCE
  );
  expect(
    museumMediaEvidenceUrl(
      "https://user:password@media-proxy.artblocks.io/1/image.png"
    )
  ).toBe("https://media-proxy.artblocks.io/1/image.png");
  expect(museumMediaEvidenceUrl("https://example.com/image.png")).toBeNull();
  expect(museumMediaEvidenceUrl("invalid")).toBeNull();
  expect(
    museumMediaEvidenceHeaders({
      "Content-Type": "text/html",
      "Set-Cookie": "secret",
      Authorization: "secret",
      Server: "x".repeat(300),
    })
  ).toEqual({ "content-type": "text/html", server: "x".repeat(256) });
});

it("captures original status and ORB evidence without replacing it with a replay", async () => {
  const session = {
    on: jest.fn(),
    send: jest.fn().mockResolvedValue(undefined),
    detach: jest.fn().mockResolvedValue(undefined),
  };
  const page = {
    context: () => ({
      browser: () => ({ browserType: () => ({ name: () => "chromium" }) }),
      newCDPSession: async () => session,
    }),
  } as unknown as Page;
  const diagnostics: PageDiagnostics = {
    consoleErrors: [],
    networkFailures: [],
    pageErrors: [],
  };
  const detach = await attachMuseumMediaDiagnostics(page, diagnostics);
  const emit = (name: string, value: object) => {
    const callback: (value: object) => void = session.on.mock.calls.find(
      ([event]) => event === name
    )![1];
    callback(value);
  };
  emit("Network.requestWillBeSent", {
    requestId: "image",
    request: { url: SOURCE },
  });
  emit("Network.responseReceivedExtraInfo", {
    requestId: "image",
    statusCode: 403,
    headers: { "content-type": "text/html", "set-cookie": "secret" },
  });
  emit("Network.loadingFailed", {
    requestId: "image",
    errorText: "net::ERR_BLOCKED_BY_ORB",
  });
  expect(diagnostics.networkFailures).toHaveLength(2);
  expect(diagnostics.networkFailures?.join()).toContain('"status":403');
  expect(diagnostics.networkFailures?.join()).toContain(
    "net::ERR_BLOCKED_BY_ORB"
  );
  expect(diagnostics.networkFailures?.join()).not.toContain("secret");
  expect(session.send).toHaveBeenCalledTimes(1);
  expect(session.send).toHaveBeenCalledWith("Network.enable");
  await detach();
  expect(session.detach).toHaveBeenCalledTimes(1);
});

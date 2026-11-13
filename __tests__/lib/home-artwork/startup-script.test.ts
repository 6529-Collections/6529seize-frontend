/** @jest-environment node */
import { runInNewContext } from "node:vm";
import { getHomeArtworkStartupScript } from "@/lib/home-artwork/startup-script";
import type { HomeArtworkStartup } from "@/lib/home-artwork/startup-fetch";

const API = "https://api.example.test";
const WAVE = "00000000-0000-4000-8000-000000000529";

function launch(
  options: {
    pathname?: string;
    apiBase?: string;
    memesWaveOverride?: string;
    cookie?: string;
    storedSession?: boolean;
    useDevAuth?: boolean;
    accountAddress?: string;
    failLatest?: boolean;
    latestResponse?: Response;
  } = {}
) {
  let now = 0;
  const fetch = jest.fn(async (url: string, _init: RequestInit) => {
    if (options.failLatest && url.endsWith("/memes_latest")) {
      throw new Error("offline");
    }
    if (options.latestResponse && url.endsWith("/memes_latest")) {
      return options.latestResponse;
    }
    return new Response(
      JSON.stringify(
        url.endsWith("/settings") ? { memes_wave_id: WAVE } : { id: 574 }
      )
    );
  });
  const browser = {
    location: { pathname: options.pathname ?? "/" },
    document: { cookie: options.cookie ?? "" },
    localStorage: {
      getItem: (key: string) => {
        if (options.accountAddress && key === "6529-wallet-active-address")
          return options.accountAddress;
        if (options.accountAddress && key === "6529-wallet-accounts")
          return JSON.stringify([{ address: options.accountAddress }]);
        return options.storedSession ? "stored" : null;
      },
    },
    fetch,
    Headers,
    atob,
    AbortController,
    Date: { now: () => now },
    setTimeout,
    clearTimeout,
    addEventListener: jest.fn(),
    __6529HomeArtworkStartup: undefined as HomeArtworkStartup | undefined,
  };
  const script = getHomeArtworkStartupScript({
    apiBase: options.apiBase ?? API,
    memesWaveOverride: options.memesWaveOverride,
    useDevAuth: options.useDevAuth ?? false,
  });
  Reflect.deleteProperty(browser, "__6529HomeArtworkStartup");
  runInNewContext(script, browser);
  return {
    browser,
    fetch,
    script,
    advance: (milliseconds: number) => {
      now += milliseconds;
    },
  };
}

const settle = async () => {
  await new Promise<void>((resolve) => setImmediate(resolve));
};

describe("home artwork document startup", () => {
  it("starts current drop and settings together, then the winner, without choosing artwork", async () => {
    const { browser, fetch } = launch();
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      `${API}/api/memes_latest`,
      `${API}/api/settings`,
    ]);
    await settle();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[2]?.[0]).toBe(
      `${API}/api/v2/waves/${WAVE}/decisions?sort_direction=DESC&sort=decision_time&page=1&page_size=1`
    );
    const response = await browser.__6529HomeArtworkStartup?.take(
      `${API}/api/memes_latest`,
      new Headers()
    );
    expect(await response?.json()).toEqual({ id: 574 });
    expect(
      browser.__6529HomeArtworkStartup?.take(
        `${API}/api/memes_latest`,
        new Headers()
      )
    ).toBeNull();
  });

  it("uses the same URL spelling as the API clients when the configured base has a trailing slash", async () => {
    const { browser, fetch } = launch({ apiBase: `${API}/` });
    expect(fetch.mock.calls[0]?.[0]).toBe(`${API}//api/memes_latest`);
    const claim = browser.__6529HomeArtworkStartup?.take(
      `${API}//api/memes_latest`,
      new Headers()
    );
    expect(await (await claim)?.json()).toEqual({ id: 574 });
    await settle();
  });

  it("uses the configured wave override for the winner lookup", async () => {
    const override = "00000000-0000-4000-8000-000000000530";
    const { fetch } = launch({ memesWaveOverride: override });
    await settle();
    expect(fetch.mock.calls[2]?.[0]).toBe(
      `${API}/api/v2/waves/${override}/decisions?sort_direction=DESC&sort=decision_time&page=1&page_size=1`
    );
  });

  it("adopts settings with the same decoded staging cookie header as the API client", async () => {
    const { browser } = launch({ cookie: "x-6529-auth=stage%2Btoken%3D" });
    const response = await browser.__6529HomeArtworkStartup?.take(
      `${API}/api/settings`,
      new Headers({ "x-6529-auth": "stage+token=" })
    );
    expect(await response?.json()).toEqual({ memes_wave_id: WAVE });
    await settle();
  });

  it("adopts an authenticated response only for the same wallet token", async () => {
    const address = "0x0000000000000000000000000000000000000529";
    const token = `e30.${btoa(JSON.stringify({ sub: address, exp: 10000000000 }))}.signature`;
    const { browser } = launch({
      cookie: `__Host-wallet-auth=${token}`,
      accountAddress: address,
    });
    const response = await browser.__6529HomeArtworkStartup?.take(
      `${API}/api/memes_latest`,
      new Headers({ Authorization: `Bearer ${token}` })
    );
    expect(await response?.json()).toEqual({ id: 574 });
    await settle();
  });

  it.each(["refreshed", "anonymous"])(
    "rejects and aborts an old token's response for a %s caller",
    async (caller) => {
      const address = "0x0000000000000000000000000000000000000529";
      const payload = btoa(JSON.stringify({ sub: address, exp: 10000000000 }));
      const { browser, fetch } = launch({
        cookie: `__Host-wallet-auth=e30.${payload}.old-signature`,
        accountAddress: address,
      });
      const headers = new Headers();
      if (caller === "refreshed") {
        headers.set("Authorization", `Bearer e30.${payload}.new-signature`);
      }
      expect(
        browser.__6529HomeArtworkStartup?.take(
          `${API}/api/memes_latest`,
          headers
        )
      ).toBeNull();
      expect(fetch.mock.calls[0]?.[1].signal?.aborted).toBe(true);
      await settle();
    }
  );

  it("leaves the dependent winner request to the app once normal data consumption starts", async () => {
    const { browser, fetch } = launch();
    await browser.__6529HomeArtworkStartup?.take(
      `${API}/api/settings`,
      new Headers()
    );
    await settle();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not start a late winner lookup after the app misses adoption", async () => {
    const { browser, fetch } = launch();
    expect(
      browser.__6529HomeArtworkStartup?.take(
        `${API}/api/unrelated`,
        new Headers()
      )
    ).toBeNull();
    await settle();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("keeps the caller's response body readable while tracking cancellation", async () => {
    const { browser } = launch();
    const caller = new AbortController();
    const response = await browser.__6529HomeArtworkStartup?.take(
      `${API}/api/memes_latest`,
      new Headers(),
      caller.signal
    );
    expect(await response?.json()).toEqual({ id: 574 });
    await settle();
  });

  it("matches wallet and staging credentials before reusing the raw response", async () => {
    const address = "0x0000000000000000000000000000000000000529";
    const token = `e30.${btoa(JSON.stringify({ sub: address, exp: 10000000000 }))}.signature`;
    const { browser, fetch } = launch({
      cookie: `__Host-wallet-auth=${token}; x-6529-auth=stage-token`,
      accountAddress: address,
    });
    const latestHeaders = fetch.mock.calls[0]?.[1].headers as Headers;
    expect(latestHeaders.get("authorization")).toBe(`Bearer ${token}`);
    const settingsHeaders = fetch.mock.calls[1]?.[1].headers as Headers;
    expect(settingsHeaders.has("authorization")).toBe(false);
    expect(settingsHeaders.get("x-6529-auth")).toBe("stage-token");
    expect(
      browser.__6529HomeArtworkStartup?.take(
        `${API}/api/memes_latest`,
        new Headers({
          Authorization: "Bearer changed-account",
          "x-6529-auth": "stage-token",
        })
      )
    ).toBeNull();
    expect(fetch.mock.calls[0]?.[1].signal?.aborted).toBe(true);
    await settle();
  });

  it("discards results that are too old instead of serving them on a later visit", async () => {
    const { browser, fetch, advance } = launch();
    advance(10_000);
    expect(
      browser.__6529HomeArtworkStartup?.take(
        `${API}/api/memes_latest`,
        new Headers()
      )
    ).toBeNull();
    expect(fetch.mock.calls[0]?.[1].signal?.aborted).toBe(true);
    await settle();
  });

  it.each([
    { subject: "0x0000000000000000000000000000000000000001", exp: 10000000000 },
    { subject: "0x0000000000000000000000000000000000000529", exp: 5 },
  ])(
    "leaves mismatched or expiring cookie sessions to normal auth: %j",
    async ({ subject, exp }) => {
      const token = `e30.${btoa(JSON.stringify({ sub: subject, exp }))}.signature`;
      const { fetch } = launch({
        cookie: `__Host-wallet-auth=${token}`,
        accountAddress: "0x0000000000000000000000000000000000000529",
      });
      expect(fetch).not.toHaveBeenCalled();
      await settle();
    }
  );

  it("never adopts the legacy wallet cookie as an authenticated session", async () => {
    const { fetch } = launch({
      cookie: "wallet-auth=legacy-token",
      accountAddress: "0x0000000000000000000000000000000000000529",
    });
    expect(fetch).not.toHaveBeenCalled();
    await settle();
  });

  it("does not start a winner lookup for a session that changed while settings loaded", async () => {
    const address = "0x0000000000000000000000000000000000000529";
    const token = `e30.${btoa(JSON.stringify({ sub: address, exp: 10000000000 }))}.signature`;
    const { browser, fetch } = launch({
      cookie: `__Host-wallet-auth=${token}`,
      accountAddress: address,
    });
    browser.document.cookie = "";
    await settle();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("falls back to the normal request when early networking fails", async () => {
    const { browser } = launch({ failLatest: true });
    expect(
      await browser.__6529HomeArtworkStartup?.take(
        `${API}/api/memes_latest`,
        new Headers()
      )
    ).toBeNull();
    await settle();
  });

  it("forwards query cancellation to the early network read while its body is pending", async () => {
    let body!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        body = controller;
      },
    });
    const { browser, fetch } = launch({ latestResponse: new Response(stream) });
    const caller = new AbortController();
    browser.__6529HomeArtworkStartup?.take(
      `${API}/api/memes_latest`,
      new Headers(),
      caller.signal
    );
    await settle();
    caller.abort();
    expect(fetch.mock.calls[0]?.[1].signal?.aborted).toBe(true);
    body.close();
    await settle();
  });

  it.each([
    { pathname: "/waves" },
    { useDevAuth: true },
    { storedSession: true },
  ])(
    "leaves unsupported startup/auth paths on their existing flow: %j",
    async (options) => {
      const { fetch } = launch(options);
      expect(fetch).not.toHaveBeenCalled();
      await settle();
    }
  );

  it("releases document data on pagehide", async () => {
    const { browser } = launch();
    await settle();
    const onPageHide = browser.addEventListener.mock
      .calls[0]?.[1] as () => void;
    onPageHide();
    expect(browser.__6529HomeArtworkStartup).toBeUndefined();
  });

  it("escapes markup in serialized configuration", () => {
    const script = getHomeArtworkStartupScript({
      apiBase: "https://api.example.test/</script>",
      useDevAuth: false,
    });
    expect(script).not.toContain("</script>");
  });
});

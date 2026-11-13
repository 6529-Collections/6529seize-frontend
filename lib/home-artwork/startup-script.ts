import { WALLET_AUTH_COOKIE } from "@/services/auth/wallet-auth-cookie";

type StartupConfig = {
  apiBase: string;
  memesWaveOverride?: string | undefined;
  useDevAuth: boolean;
};

// An inline literal stays independent of bundler-injected function helpers.
// It starts only raw requests; the existing selection and auth flow consume them.
const HOME_ARTWORK_STARTUP = `(function startHomeArtwork(config) {
  if (location.pathname !== "/" || config.useDevAuth || Reflect.get(globalThis, "__6529LegacyBrowser") === true || Reflect.has(globalThis, "__6529HomeArtworkStartup") || typeof fetch !== "function") {
    return;
  }
  const readCookie = (name) => {
    const part = document.cookie.split("; ").find((value) => value.startsWith("".concat(name, "=")));
    if (!part) return null;
    try {
      return decodeURIComponent(part.slice(name.length + 1));
    } catch {
      return null;
    }
  };
  const jwt = readCookie(config.walletAuthCookie);
  const apiAuth = readCookie("x-6529-auth");
  const hasMatchingCookieSession = (token) => {
    try {
      const active2 = localStorage.getItem("6529-wallet-active-address");
      const accounts = JSON.parse(
        localStorage.getItem("6529-wallet-accounts") ?? "null"
      );
      if (!active2 || !Array.isArray(accounts)) return false;
      const matchesActive = (account) => typeof account === "object" && account !== null && "address" in account && typeof account.address === "string" && account.address.toLowerCase() === active2.toLowerCase();
      if (!accounts.some(matchesActive)) return false;
      const encoded = token.split(".")[1];
      if (!encoded) return false;
      const payload = JSON.parse(
        atob(encoded.replaceAll("-", "+").replaceAll("_", "/"))
      );
      if (typeof payload !== "object" || payload === null) return false;
      return "sub" in payload && typeof payload.sub === "string" && payload.sub.toLowerCase() === active2.toLowerCase() && "exp" in payload && typeof payload.exp === "number" && payload.exp * 1e3 > Date.now() + 1e4;
    } catch {
      return false;
    }
  };
  const hasStoredSession = () => {
    try {
      return Boolean(
        localStorage.getItem("6529-wallet-active-address") || localStorage.getItem("6529-wallet-address") || localStorage.getItem("6529-wallet-accounts")
      );
    } catch {
      return true;
    }
  };
  if (jwt && !hasMatchingCookieSession(jwt)) return;
  if (!jwt && hasStoredSession()) return;
  let active = true;
  let appStarted = false;
  const entries = /* @__PURE__ */ new Map();
  const headerKey = (headers) => JSON.stringify(Array.from(headers.entries()).sort());
  const apiBase = config.apiBase;
  const maxAge = 1e4;
  const take = (url, headers, signal) => {
    appStarted = true;
    const entry = entries.get(url);
    if (!entry) return null;
    entries.delete(url);
    clearTimeout(entry.timer);
    if (!active || location.pathname !== "/" || Date.now() - entry.startedAt >= maxAge || entry.headers !== headerKey(headers)) {
      entry.controller.abort();
      return null;
    }
    // The adopting query owns cancellation, including the response body.
    if (signal) {
      const abort = () => entry.controller.abort(signal.reason);
      signal.addEventListener("abort", abort, { once: true });
      void entry.response.then((response) => response?.clone().arrayBuffer())
        .catch(() => undefined)
        .finally(() => signal.removeEventListener("abort", abort));
    }
    return entry.response;
  };
  Reflect.set(globalThis, "__6529HomeArtworkStartup", { take });
  const start = (path, includeWallet) => {
    const url = "".concat(apiBase, "/api/").concat(path);
    const headers = new Headers();
    if (apiAuth) headers.set("x-6529-auth", apiAuth);
    if (includeWallet && jwt) headers.set("Authorization", "Bearer ".concat(jwt));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), maxAge);
    const response = fetch(url, {
      headers,
      cache: "no-store",
      signal: controller.signal
    }).catch(() => null).finally(() => clearTimeout(timer));
    entries.set(url, {
      headers: headerKey(headers),
      response,
      controller,
      timer,
      startedAt: Date.now()
    });
    return response;
  };
  void start("memes_latest", true);
  void start("settings", false).then(async (response) => {
    if (!response?.ok) return;
    const settings = await response.clone().json();
    const settingsWave = typeof settings === "object" && settings !== null && "memes_wave_id" in settings ? settings.memes_wave_id : null;
    const waveId = config.memesWaveOverride ?? settingsWave;
    if (typeof waveId !== "string" || !waveId) return;
    // Once the app consumes data, let its dependent queries own the waterfall.
    if (appStarted || !active || location.pathname !== "/") return;
    if (readCookie(config.walletAuthCookie) !== jwt || readCookie("x-6529-auth") !== apiAuth) return;
    if (jwt && !hasMatchingCookieSession(jwt)) return;
    if (!jwt && hasStoredSession()) return;
    void start(
      "v2/waves/".concat(encodeURIComponent(waveId), "/decisions?sort_direction=DESC&sort=decision_time&page=1&page_size=1"),
      true
    );
  }).catch(() => void 0);
  globalThis.addEventListener(
    "pagehide",
    () => {
      active = false;
      for (const entry of entries.values()) entry.controller.abort();
      entries.clear();
      Reflect.deleteProperty(globalThis, "__6529HomeArtworkStartup");
    },
    { once: true }
  );
})`;

export function getHomeArtworkStartupScript(config: StartupConfig): string {
  const serialized = JSON.stringify({
    ...config,
    walletAuthCookie: WALLET_AUTH_COOKIE,
  }).replaceAll("<", String.raw`\u003c`);
  return `(${HOME_ARTWORK_STARTUP})(${serialized});`;
}

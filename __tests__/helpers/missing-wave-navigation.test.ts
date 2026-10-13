import { getMissingWaveNavigationRoute } from "@/helpers/waves/missing-wave-navigation.helpers";

afterEach(() => window.history.replaceState(null, "", "/"));

it.each([
  "/waves/wave-1?tab=chat",
  "/messages/wave-1?drop=123",
  "/waves?wave=wave-1&serialNo=23",
  "/messages?wave=wave-1",
])("allows the current ordinary missing wave on %s", (path) => {
  window.history.replaceState(null, "", path);
  const route = getMissingWaveNavigationRoute("wave-1");
  expect(route?.href).toBe(window.location.href);
  // Callers remove query parameters from a clone, not from the live location.
  route?.searchParams.delete("wave");
  expect(window.location.pathname + window.location.search).toBe(path);
});

it.each([
  "/waves/wave-1/competitions",
  "/waves/wave-1/competitions/alpha?tab=leaderboard",
  "/waves/wave-1/competitions/new",
  "/waves/wave-2?wave=wave-1",
  "/messages/wave-2?wave=wave-1",
  "/waves/create?wave=wave-1",
  "/messages/create?wave=wave-1",
  "/network?wave=wave-1",
  "/waves",
  "/messages",
])("ignores a previous ordinary wave request on %s", (path) => {
  window.history.replaceState(null, "", path);
  expect(getMissingWaveNavigationRoute("wave-1")).toBeNull();
});

it("ignores a request without a selected wave", () => {
  window.history.replaceState(null, "", "/waves/wave-1");
  expect(getMissingWaveNavigationRoute(null)).toBeNull();
});

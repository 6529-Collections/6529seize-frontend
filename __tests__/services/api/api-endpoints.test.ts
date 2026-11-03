import { publicEnv } from "@/config/env";
import {
  apiUrl,
  getApiBase,
  getWebSocketUrl,
  PUBLIC_PRODUCTION_API_BASE,
} from "@/services/api/api-endpoints";

describe("api endpoints", () => {
  const original = {
    API_ENDPOINT: publicEnv.API_ENDPOINT,
    WS_ENDPOINT: publicEnv.WS_ENDPOINT,
  };

  afterEach(() => {
    publicEnv.API_ENDPOINT = original.API_ENDPOINT;
    publicEnv.WS_ENDPOINT = original.WS_ENDPOINT;
  });

  it("returns the configured API base unchanged", () => {
    publicEnv.API_ENDPOINT = "https://api.staging.6529.io";

    expect(getApiBase()).toBe("https://api.staging.6529.io");
  });

  it("follows env changes made after the module loaded", () => {
    publicEnv.API_ENDPOINT = "https://api.one.test";
    expect(apiUrl("/api/settings")).toBe("https://api.one.test/api/settings");

    publicEnv.API_ENDPOINT = "https://api.two.test";
    expect(apiUrl("/api/settings")).toBe("https://api.two.test/api/settings");
  });

  it("appends paths and query strings exactly as given", () => {
    publicEnv.API_ENDPOINT = "https://api.6529.io";

    expect(apiUrl("/api/nfts?id=1,2&contract=0xabc")).toBe(
      "https://api.6529.io/api/nfts?id=1,2&contract=0xabc"
    );
    expect(apiUrl("/alchemy-proxy/token-metadata")).toBe(
      "https://api.6529.io/alchemy-proxy/token-metadata"
    );
  });

  it("prefers the configured WebSocket endpoint", () => {
    publicEnv.API_ENDPOINT = "https://api.6529.io";
    publicEnv.WS_ENDPOINT = "wss://socket.example.test";

    expect(getWebSocketUrl()).toBe("wss://socket.example.test");
  });

  it("derives the WebSocket endpoint from the API base", () => {
    publicEnv.API_ENDPOINT = "https://api.staging.6529.io";
    publicEnv.WS_ENDPOINT = undefined;

    expect(getWebSocketUrl()).toBe("wss://ws.staging.6529.io");
  });

  it("keeps the historical WebSocket fallback when no API base is set", () => {
    delete (publicEnv as { API_ENDPOINT?: string }).API_ENDPOINT;
    publicEnv.WS_ENDPOINT = undefined;

    expect(getWebSocketUrl()).toBe("wss://default-fallback-url");
  });

  it("names the public production API", () => {
    expect(PUBLIC_PRODUCTION_API_BASE).toBe("https://api.6529.io");
  });
});

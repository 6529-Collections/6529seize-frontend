/** @jest-environment node */

jest.mock("node:dns/promises", () => ({ lookup: jest.fn() }));
const mockFetch = jest.fn();
jest.mock("undici", () => ({
  Agent: jest.fn(() => ({ dispatch: jest.fn() })),
  fetch: (...args: unknown[]) => mockFetch(...args),
}));

import fs from "node:fs";
import path from "node:path";
import { lookup } from "node:dns/promises";
import type { LookupAddress, LookupAllOptions } from "node:dns";
import type { CcipRequestParameters, Hex } from "viem";
import { sepolia } from "viem/chains";
import { getEtherscanNetwork } from "@/lib/link-preview/etherscan/hosts";
import { createServerPublicClient } from "@/lib/ethereum/serverPublicClient";

const lookupAll: (
  hostname: string,
  options: LookupAllOptions
) => Promise<LookupAddress[]> = lookup;
const mockLookup = jest.mocked(lookupAll);

const SENDER = "0x1111111111111111111111111111111111111111";
const CALL_DATA = "0xabcdef" as Hex;

type CcipRequest = (parameters: CcipRequestParameters) => Promise<Hex>;

function getCcipRequest(client: { readonly ccipRead?: unknown }): CcipRequest {
  const config = client.ccipRead as { readonly request?: unknown } | undefined;
  if (typeof config?.request !== "function") {
    throw new TypeError("Server client has no guarded CCIP-Read request.");
  }
  return config.request as CcipRequest;
}

const request = getCcipRequest(
  createServerPublicClient({ chain: sepolia, timeoutMs: 1_000 })
);

function lookupWith(urls: readonly string[]) {
  return request({ data: CALL_DATA, sender: SENDER, urls });
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json" },
  });
}

describe("createServerPublicClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockLookup.mockReset();
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the bounded RPC transport and installs the guarded CCIP-Read request", () => {
    const client = createServerPublicClient({
      chain: sepolia,
      timeoutMs: 2_500,
    });

    expect(client.chain.id).toBe(sepolia.id);
    expect(client.transport).toEqual(
      expect.objectContaining({ retryCount: 0, timeout: 2_500 })
    );
    expect(getCcipRequest(client)).toBe(request);
  });

  it("POSTs to gateways without a {data} template and reads JSON data", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: "0x1234" }));

    await expect(lookupWith(["https://gateway.example/lookup"])).resolves.toBe(
      "0x1234"
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://gateway.example/lookup");
    expect(init).toEqual(
      expect.objectContaining({ method: "POST", redirect: "manual" })
    );
    expect(JSON.parse(init.body as string)).toEqual({
      data: CALL_DATA,
      sender: SENDER,
    });
    expect(new Headers(init.headers).get("content-type")).toBe(
      "application/json"
    );
  });

  it("GETs templated gateway URLs and accepts plain hex responses", async () => {
    mockFetch.mockResolvedValue(new Response("0xbeef"));

    await expect(
      lookupWith(["https://gateway.example/{sender}/{data}.json"])
    ).resolves.toBe("0xbeef");
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://gateway.example/${SENDER}/${CALL_DATA}.json`);
    expect(init).toEqual(expect.objectContaining({ method: "GET" }));
    expect(init.body).toBeUndefined();
  });

  it("substitutes every repeated {sender} and {data} placeholder", async () => {
    mockFetch.mockResolvedValue(new Response("0xbeef"));

    await expect(
      lookupWith([
        "https://gateway.example/{sender}/{data}?s={sender}&d={data}",
      ])
    ).resolves.toBe("0xbeef");
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `https://gateway.example/${SENDER}/${CALL_DATA}?s=${SENDER}&d=${CALL_DATA}`
    );
    expect(init).toEqual(expect.objectContaining({ method: "GET" }));
  });

  it("reports invalid JSON gateway bodies as gateway errors", async () => {
    mockFetch.mockResolvedValue(
      new Response("{not json", {
        headers: { "content-type": "application/json" },
      })
    );

    await expect(
      lookupWith(["https://gateway.example/lookup"])
    ).rejects.toMatchObject({
      name: "HttpRequestError",
      details: "Gateway returned invalid JSON.",
    });
  });

  it("refuses non-HTTPS gateway URLs without resolving or requesting them", async () => {
    await expect(
      lookupWith(["http://gateway.example/{data}", "ftp://gateway.example/"])
    ).rejects.toMatchObject({ name: "HttpRequestError" });
    expect(mockLookup).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("refuses gateways that are not on the public internet", async () => {
    mockLookup.mockResolvedValue([{ address: "10.0.0.8", family: 4 }]);

    await expect(
      lookupWith([
        "https://gateway.example/lookup",
        "https://localhost/lookup",
        "https://192.168.1.10/lookup",
      ])
    ).rejects.toMatchObject({ name: "HttpRequestError" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not follow gateway redirects", async () => {
    mockFetch.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://other.example/lookup" },
      })
    );

    await expect(
      lookupWith(["https://gateway.example/lookup"])
    ).rejects.toMatchObject({ name: "HttpRequestError" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("rejects oversized, failed, or malformed gateway responses and tries the next URL", async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(`0x${"00".repeat(256 * 1024)}`))
      .mockResolvedValueOnce(jsonResponse({ data: "0x1234" }, { status: 500 }))
      .mockResolvedValueOnce(jsonResponse({ data: "not hex" }));

    await expect(
      lookupWith([
        "https://one.example/lookup",
        "https://two.example/lookup",
        "https://three.example/lookup",
      ])
    ).rejects.toMatchObject({ name: "HttpRequestError" });
    expect(mockFetch).toHaveBeenCalledTimes(3);

    mockFetch
      .mockResolvedValueOnce(new Response(`0x${"00".repeat(256 * 1024)}`))
      .mockResolvedValueOnce(jsonResponse({ data: "0x5678" }));
    await expect(
      lookupWith(["https://one.example/lookup", "https://two.example/lookup"])
    ).resolves.toBe("0x5678");
  });

  it("stops after a bounded number of gateway URLs", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(new Response("unavailable", { status: 503 }))
    );

    await expect(
      lookupWith(
        Array.from({ length: 6 }, (_, i) => `https://g${i}.example/lookup`)
      )
    ).rejects.toMatchObject({ name: "HttpRequestError", status: 503 });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("times out gateways that never answer", async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementation(() => new Promise<Response>(() => undefined));

    const pending = expect(
      lookupWith(["https://gateway.example/lookup"])
    ).rejects.toMatchObject({ name: "HttpRequestError" });
    await jest.advanceTimersByTimeAsync(4_000);
    await pending;
  });
});

describe("server-side viem clients", () => {
  const projectRoot = path.resolve(__dirname, "../../..");
  const SERVER_SOURCE_ROOTS = ["app", "lib", "services", "helpers", "utils"];
  const FACTORY_FILE = "lib/ethereum/serverPublicClient.ts";

  function listSourceFiles(directory: string): string[] {
    return fs
      .readdirSync(path.join(projectRoot, directory), { withFileTypes: true })
      .flatMap((entry) => {
        const relative = `${directory}/${entry.name}`;
        if (entry.isDirectory()) {
          return listSourceFiles(relative);
        }
        return /\.tsx?$/.test(entry.name) ? [relative] : [];
      });
  }

  it("are created only through the guarded factory and never resolve avatars with viem", () => {
    const offenders = SERVER_SOURCE_ROOTS.flatMap(listSourceFiles).filter(
      (file) =>
        file !== FACTORY_FILE &&
        /\bcreatePublicClient\s*\(|\.getEnsAvatar\s*\(/.test(
          fs.readFileSync(path.join(projectRoot, file), "utf8")
        )
    );

    expect(offenders).toEqual([]);
  });

  it("covers the Etherscan preview and ENS clients", () => {
    process.env["ETHEREUM_RPC_URL"] = "https://eth-mainnet.example.test/v2/k";
    const {
      getEtherscanEnsClient,
      getEtherscanPublicClient,
    } = require("@/app/api/open-graph/etherscan/networkRegistry");

    for (const host of [
      "etherscan.io",
      "sepolia.etherscan.io",
      "hoodi.etherscan.io",
    ]) {
      const network = getEtherscanNetwork(host);
      expect(network).not.toBeNull();
      expect(getCcipRequest(getEtherscanPublicClient(network))).toBe(request);
    }
    expect(
      getCcipRequest(
        getEtherscanEnsClient(getEtherscanNetwork("sepolia.etherscan.io"))
      )
    ).toBe(request);
  });
});

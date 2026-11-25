import { setTestPublicEnv } from "@/__tests__/helpers/testPublicEnv";
import {
  chainGateway,
  ChainGatewayError,
} from "@/lib/chain-identity/gateway";
import {
  getChainGatewayUrl,
  isChainIdentityEnabled,
} from "@/lib/chain-identity/config";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        ...(globalThis as { __testPublicEnv?: object }).__testPublicEnv,
      };
    },
  };
});

const fetchMock = globalThis.fetch as jest.Mock;
const BASE = "https://gateway.example.test";
const WALLET = "0x00000000000000000000000000000000000000AA" as const;

const answer = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

beforeEach(() => {
  fetchMock.mockReset();
  setTestPublicEnv({
    NEXT_PUBLIC_FEATURE_CHAIN_IDENTITY: "true",
    NEXT_PUBLIC_CHAIN_GATEWAY_URL: `${BASE}/`,
  });
});

afterEach(() => setTestPublicEnv({}));

describe("the gateway's configuration", () => {
  it("is on with the flag and an https gateway", () => {
    expect(getChainGatewayUrl()).toBe(BASE);
    expect(isChainIdentityEnabled()).toBe(true);
  });

  it("is off without the flag, a gateway, or with plain http", () => {
    setTestPublicEnv({ NEXT_PUBLIC_CHAIN_GATEWAY_URL: BASE });
    expect(isChainIdentityEnabled()).toBe(false);
    setTestPublicEnv({ NEXT_PUBLIC_FEATURE_CHAIN_IDENTITY: "true" });
    expect(isChainIdentityEnabled()).toBe(false);
    setTestPublicEnv({
      NEXT_PUBLIC_FEATURE_CHAIN_IDENTITY: "true",
      NEXT_PUBLIC_CHAIN_GATEWAY_URL: "http://gateway.example.test",
    });
    expect(isChainIdentityEnabled()).toBe(false);
  });
});

describe("gateway requests", () => {
  it("reads an identity at the head, without cookies", async () => {
    fetchMock.mockResolvedValue(
      answer(200, { read: {}, data: { principalId: "0x01" } })
    );
    await expect(chainGateway.getIdentityByWallet(WALLET)).resolves.toEqual({
      principalId: "0x01",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `${BASE}/v1/identities/by-wallet/${WALLET.toLowerCase()}?at=head`
    );
    expect(init).toMatchObject({ method: "GET", credentials: "omit" });
  });

  it("reads 404 as no identity", async () => {
    fetchMock.mockResolvedValue(answer(404, { error: { code: "not_found" } }));
    await expect(chainGateway.getIdentityByWallet(WALLET)).resolves.toBeNull();
  });

  it("carries the chain's refusal code and message", async () => {
    fetchMock.mockResolvedValue(
      answer(422, {
        read: {},
        error: {
          code: "inadmissible",
          message: "0x2103 HANDLE_TAKEN, detail 2",
        },
      })
    );
    const failure = chainGateway.submit("0x01", []);
    await expect(failure).rejects.toBeInstanceOf(ChainGatewayError);
    await expect(failure).rejects.toMatchObject({
      status: 422,
      code: "inadmissible",
      message: "0x2103 HANDLE_TAKEN, detail 2",
    });
  });

  it("posts drafts and submits as JSON", async () => {
    fetchMock.mockResolvedValue(answer(200, { data: { txId: "0x02" } }));
    await chainGateway.draft({ opType: "NONCE_SKIP", body: {} });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/v1/draft`);
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ opType: "NONCE_SKIP", body: {} });
  });

  it("uploads a profile document as bytes, checked against its CID", async () => {
    fetchMock.mockResolvedValue(answer(201, { cid: "b", cid_hex: "0x01" }));
    await chainGateway.uploadDoc(new Uint8Array([1, 2]), "0x0155");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/v1/docs?cid=0x0155`);
    expect(init.headers["Content-Type"]).toBe("application/octet-stream");
  });

  it("names an unreachable gateway as status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));
    await expect(chainGateway.getOps()).rejects.toMatchObject({ status: 0 });
  });
});

import {
  asE2eeApiError,
  createE2eeApiClient,
  E2eeApiError,
  e2eeErrorCode,
  toE2eeApiError,
} from "@/lib/e2ee/api";
import {
  commonApiFetch,
  commonApiPost,
  commonApiPut,
} from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => {
  const actual = jest.requireActual("@/services/api/common-api");
  return {
    ...actual,
    commonApiFetch: jest.fn(),
    commonApiPost: jest.fn(),
    commonApiPut: jest.fn(),
  };
});

const fetchMock = commonApiFetch as jest.Mock;
const postMock = commonApiPost as jest.Mock;
const putMock = commonApiPut as jest.Mock;

const KEY = `0x${"ab".repeat(32)}`;
const G = `0x${"cd".repeat(32)}`;

function structuredError(status: number, body: unknown) {
  const error = new Error("boom") as Error & {
    status: number;
    response: unknown;
  };
  error.status = status;
  error.response = { status, body: JSON.stringify(body) };
  return error;
}

describe("E2EE REST client (contract 4.2)", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    postMock.mockReset().mockResolvedValue({ ok: true });
    putMock.mockReset().mockResolvedValue({ ok: true });
  });

  it("maps every endpoint with structured errors", async () => {
    const api = createE2eeApiClient();
    await api.getMe();
    await api.getDevice(KEY);
    await api.getProfileDevices("p 1");
    await api.getGroup(G, KEY);
    await api.getLog(G, { deviceKey: KEY, afterSeq: 5 });
    await api.getWelcomes(KEY);
    await api.getDeviceGroups(KEY);
    await api.getBlobChunk("0xb1", 2, KEY);
    expect(
      fetchMock.mock.calls.map(([arg]) => [arg.endpoint, arg.params ?? null])
    ).toEqual([
      ["e2ee/me", null],
      [`e2ee/devices/${KEY}`, null],
      ["e2ee/profiles/p%201/devices", null],
      [`e2ee/groups/${G}`, { device_key: KEY }],
      [
        `e2ee/groups/${G}/log`,
        { device_key: KEY, after_seq: "5", limit: "100" },
      ],
      [`e2ee/devices/${KEY}/welcomes`, null],
      [`e2ee/devices/${KEY}/groups`, null],
      ["e2ee/blobs/0xb1/chunks/2", { device_key: KEY }],
    ]);
    for (const [arg] of fetchMock.mock.calls) {
      expect(arg).toMatchObject({ errorMode: "structured", cache: "no-store" });
    }

    const body = { x: 1 };
    await api.registerDevice(body as never);
    await api.revokeDevice(KEY, body as never);
    await api.uploadKeyPackages(KEY, body as never);
    await api.claimKeyPackages(body as never);
    await api.checkEligibility(body as never);
    await api.createGroup(body as never);
    await api.submitEntry(G, body as never);
    await api.sendMessage(G, body as never);
    await api.repairRoster(G, body as never);
    await api.ackWelcome(KEY, "w 1");
    await api.createBlob(body as never);
    await api.completeBlob("0xb1");
    await api.report(body as never);
    expect(postMock.mock.calls.map(([arg]) => arg.endpoint)).toEqual([
      "e2ee/devices",
      `e2ee/devices/${KEY}/revoke`,
      `e2ee/devices/${KEY}/key-packages`,
      "e2ee/key-packages/claim",
      "e2ee/eligibility",
      "e2ee/groups",
      `e2ee/groups/${G}/entries`,
      `e2ee/groups/${G}/messages`,
      `e2ee/groups/${G}/roster`,
      `e2ee/devices/${KEY}/welcomes/w%201/ack`,
      "e2ee/blobs",
      "e2ee/blobs/0xb1/complete",
      "e2ee/reports",
    ]);
    for (const [arg] of postMock.mock.calls) {
      expect(arg.errorMode).toBe("structured");
    }
    await api.putBlobChunk("0xb1", 3, { data: "AA==" });
    expect(putMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "e2ee/blobs/0xb1/chunks/3",
        body: { data: "AA==" },
      })
    );
  });

  it("turns structured errors into typed E2eeApiErrors", async () => {
    postMock.mockRejectedValueOnce(
      structuredError(409, {
        error: "conflict",
        code: "E2EE_EPOCH_CONFLICT",
        current_epoch: 7,
      })
    );
    const api = createE2eeApiClient();
    const error = await api
      .submitEntry(G, {} as never)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(E2eeApiError);
    expect(error).toMatchObject({
      status: 409,
      code: "E2EE_EPOCH_CONFLICT",
      currentEpoch: 7,
    });
    expect(e2eeErrorCode(error)).toBe("E2EE_EPOCH_CONFLICT");
  });

  it("treats network failures as status 0 and keeps aborts", () => {
    expect(toE2eeApiError(new Error("Network request failed"))).toMatchObject({
      status: 0,
      code: null,
    });
    const abort = new DOMException("aborted", "AbortError");
    expect(toE2eeApiError(abort)).toBe(abort);
  });

  it("recognizes duck-typed errors from test doubles", () => {
    const duck = Object.assign(new Error("x"), {
      name: "E2eeApiError",
      status: 404,
      code: "E2EE_NOT_MEMBER",
    });
    expect(asE2eeApiError(duck)).toMatchObject({
      status: 404,
      code: "E2EE_NOT_MEMBER",
      currentEpoch: null,
    });
    expect(asE2eeApiError(new Error("plain"))).toBeNull();
    expect(asE2eeApiError("string")).toBeNull();
  });
});

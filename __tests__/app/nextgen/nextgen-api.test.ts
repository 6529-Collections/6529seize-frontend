import {
  fetchNextGenApi,
  fetchNextGenApiOrNull,
} from "@/app/nextgen/nextgen-api";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(() => null),
  getStagingAuth: jest.fn(() => null),
}));

const mockedCommonApiFetch = commonApiFetch as jest.Mock;
const actualCommonApiFetch = jest.requireActual<
  typeof import("@/services/api/common-api")
>("@/services/api/common-api").commonApiFetch;
const fetchMock = global.fetch as jest.Mock;
const request = {
  endpoint: "nextgen/featured",
  headers: { "x-test": "1" },
};

function createApiError(status: number): Error & { status: number } {
  return Object.assign(new Error(`API request failed with ${status}`), {
    name: "ApiError",
    status,
  });
}

async function createActualStructuredError(status: number): Promise<unknown> {
  fetchMock.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: "Not Found",
    headers: new Headers(),
    text: async () => JSON.stringify({ error: "missing" }),
  });

  try {
    await actualCommonApiFetch({
      endpoint: "nextgen/contract-check",
      errorMode: "structured",
      includeWalletAuth: false,
    });
  } catch (error) {
    return error;
  }

  throw new Error("Expected commonApiFetch to reject");
}

describe("NextGen API requests", () => {
  beforeEach(() => {
    mockedCommonApiFetch.mockReset();
    fetchMock.mockReset();
  });

  it("uses structured API errors", async () => {
    mockedCommonApiFetch.mockResolvedValue({ id: 1 });

    await expect(fetchNextGenApi(request)).resolves.toEqual({ id: 1 });
    expect(mockedCommonApiFetch).toHaveBeenCalledWith({
      ...request,
      errorMode: "structured",
    });
  });

  it("retries transient server errors", async () => {
    mockedCommonApiFetch
      .mockRejectedValueOnce(createApiError(503))
      .mockRejectedValueOnce(createApiError(502))
      .mockResolvedValueOnce({ id: 1 });

    await expect(fetchNextGenApi(request)).resolves.toEqual({ id: 1 });
    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(3);
  });

  it("retries network failures", async () => {
    mockedCommonApiFetch
      .mockRejectedValueOnce(
        new Error("Network request failed. Please try again.")
      )
      .mockResolvedValueOnce({ id: 1 });

    await expect(fetchNextGenApi(request)).resolves.toEqual({ id: 1 });
    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(2);
  });

  it("returns null for a real 404 without retrying", async () => {
    const error = await createActualStructuredError(404);
    mockedCommonApiFetch.mockRejectedValue(error);

    await expect(fetchNextGenApiOrNull(request)).resolves.toBeNull();
    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(1);
  });

  it("does not turn persistent server errors into missing data", async () => {
    const error = createApiError(503);
    mockedCommonApiFetch.mockRejectedValue(error);

    await expect(fetchNextGenApiOrNull(request)).rejects.toBe(error);
    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-404 client errors", async () => {
    const error = createApiError(400);
    mockedCommonApiFetch.mockRejectedValue(error);

    await expect(fetchNextGenApiOrNull(request)).rejects.toBe(error);
    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry unknown errors", async () => {
    const error = new Error("Failed to parse response as JSON");
    mockedCommonApiFetch.mockRejectedValue(error);

    await expect(fetchNextGenApi(request)).rejects.toBe(error);
    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(1);
  });
});

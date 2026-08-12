import {
  fetchNextGenApi,
  fetchNextGenApiOrNull,
} from "@/app/nextgen/nextgen-api";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

const mockedCommonApiFetch = commonApiFetch as jest.Mock;
const request = {
  endpoint: "nextgen/featured",
  headers: { "x-test": "1" },
};

describe("NextGen API requests", () => {
  beforeEach(() => {
    mockedCommonApiFetch.mockReset();
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
      .mockRejectedValueOnce({ status: 503 })
      .mockRejectedValueOnce({ response: { status: 502 } })
      .mockResolvedValueOnce({ id: 1 });

    await expect(fetchNextGenApi(request)).resolves.toEqual({ id: 1 });
    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(3);
  });

  it("retries network failures", async () => {
    mockedCommonApiFetch
      .mockRejectedValueOnce(new Error("Network request failed"))
      .mockResolvedValueOnce({ id: 1 });

    await expect(fetchNextGenApi(request)).resolves.toEqual({ id: 1 });
    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(2);
  });

  it("returns null for a real 404 without retrying", async () => {
    mockedCommonApiFetch.mockRejectedValue({ status: 404 });

    await expect(fetchNextGenApiOrNull(request)).resolves.toBeNull();
    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(1);
  });

  it("does not turn persistent server errors into missing data", async () => {
    const error = { status: 503 };
    mockedCommonApiFetch.mockRejectedValue(error);

    await expect(fetchNextGenApiOrNull(request)).rejects.toBe(error);
    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-404 client errors", async () => {
    const error = { status: 400 };
    mockedCommonApiFetch.mockRejectedValue(error);

    await expect(fetchNextGenApiOrNull(request)).rejects.toBe(error);
    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(1);
  });
});

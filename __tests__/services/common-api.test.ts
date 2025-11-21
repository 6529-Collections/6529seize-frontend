import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";

jest.mock("@/services/auth/auth.utils", () => ({
  getStagingAuth: jest.fn(),
  getAuthJwt: jest.fn(),
}));

const fetchMock = global.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockReset();
});

describe("commonApiFetch", () => {
  it("builds url with params and headers", async () => {
    (getStagingAuth as jest.Mock).mockReturnValue("s");
    (getAuthJwt as jest.Mock).mockReturnValue("jwt");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ result: 1 }),
    });

    const result = await commonApiFetch<{ result: number }>({
      endpoint: "test",
      params: { foo: "bar", typ: "nic" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/test?foo=bar&typ=cic",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-6529-auth": "s",
          Authorization: "Bearer jwt",
        }),
        signal: undefined,
      })
    );
    expect(result).toEqual({ result: 1 });
  });

  it("rejects with error body when not ok", async () => {
    (getStagingAuth as jest.Mock).mockReturnValue(null);
    (getAuthJwt as jest.Mock).mockReturnValue(null);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad",
      json: async () => ({ error: "err" }),
    });

    await expect(commonApiFetch({ endpoint: "bad" })).rejects.toThrow("err");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/bad",
      expect.objectContaining({
        headers: {},
        signal: undefined,
      })
    );
  });
});

describe("commonApiPost", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("posts data and returns json", async () => {
    (getStagingAuth as jest.Mock).mockReturnValue("a");
    (getAuthJwt as jest.Mock).mockReturnValue(null);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ res: 1 }),
    });

    const result = await commonApiPost<{ v: number }, { res: number }>({
      endpoint: "e",
      body: { v: 1 },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/e",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-6529-auth": "a",
        }),
        body: JSON.stringify({ v: 1 }),
      })
    );
    expect(result).toEqual({ res: 1 });
  });

  it("rejects on error", async () => {
    (getStagingAuth as jest.Mock).mockReturnValue(null);
    (getAuthJwt as jest.Mock).mockReturnValue(null);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "B",
      json: async () => ({ error: "err" }),
    });

    await expect(commonApiPost({ endpoint: "e", body: {} })).rejects.toThrow(
      "err"
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/e",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({}),
      })
    );
  });
});

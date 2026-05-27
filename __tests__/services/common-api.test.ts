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
      })
    );
    expect(fetchMock.mock.calls[0][1].headers["x-6529-launch-id"]).toBe(
      undefined
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
      text: async () => JSON.stringify({ error: "err" }),
    });

    await expect(commonApiFetch({ endpoint: "bad" })).rejects.toBe("err");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/bad",
      expect.objectContaining({
        headers: {},
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
    expect(fetchMock.mock.calls[0][1].headers["x-6529-launch-id"]).toBe(
      undefined
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
      text: async () => JSON.stringify({ error: "err" }),
    });

    await expect(commonApiPost({ endpoint: "e", body: {} })).rejects.toBe(
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

  it("rejects with structured metadata when requested", async () => {
    (getStagingAuth as jest.Mock).mockReturnValue(null);
    (getAuthJwt as jest.Mock).mockReturnValue(null);
    const responseHeaders = new Headers({ "retry-after": "2" });
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      headers: responseHeaders,
      text: async () => JSON.stringify({ error: "rate limited" }),
    });

    let error: {
      message: string;
      status: number;
      headers: Headers;
      response: {
        status: number;
        headers: Headers;
        statusText?: string;
        body?: unknown;
      };
    } | null = null;

    try {
      await commonApiPost({
        endpoint: "e",
        body: {},
        errorMode: "structured",
      });
    } catch (caught) {
      error = caught as {
        message: string;
        status: number;
        headers: Headers;
        response: {
          status: number;
          headers: Headers;
          statusText?: string;
          body?: unknown;
        };
      };
    }

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe("rate limited");
    expect(error?.status).toBe(429);
    expect(error?.headers).toBe(responseHeaders);
    expect(error?.headers.get("retry-after")).toBe("2");
    expect(error?.response.status).toBe(429);
    expect(error?.response.headers).toBe(responseHeaders);
    expect(error?.response.statusText).toBe("Too Many Requests");
    expect(error?.response.body).toBe('{"error":"rate limited"}');
  });

  it("falls back to statusText in structured errors when the response body is whitespace only", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      text: async () => "   ",
    });

    let error: {
      message: string;
      response: {
        status: number;
        headers: Headers;
        statusText?: string;
        body?: unknown;
      };
    } | null = null;

    try {
      await commonApiPost({
        endpoint: "e",
        body: {},
        errorMode: "structured",
      });
    } catch (caught) {
      error = caught as {
        message: string;
        response: {
          status: number;
          headers: Headers;
          statusText?: string;
          body?: unknown;
        };
      };
    }

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe("Service Unavailable");
    expect(error?.response.body).toBe("   ");
    expect(error?.response.statusText).toBe("Service Unavailable");
  });

  it("falls back to statusText when response body is whitespace only", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      text: async () => "   ",
    });

    await expect(commonApiPost({ endpoint: "e", body: {} })).rejects.toBe(
      "Service Unavailable"
    );
  });

  it("falls back to statusText when parsed json fields are whitespace only", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => JSON.stringify({ error: "   " }),
    });

    let error: {
      message: string;
      response: {
        status: number;
        headers: Headers;
        statusText?: string;
        body?: unknown;
      };
    } | null = null;

    try {
      await commonApiPost({
        endpoint: "e",
        body: {},
        errorMode: "structured",
      });
    } catch (caught) {
      error = caught as {
        message: string;
        response: {
          status: number;
          headers: Headers;
          statusText?: string;
          body?: unknown;
        };
      };
    }

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe("Bad Request");
    expect(error?.response.body).toBe('{"error":"   "}');
    expect(error?.response.statusText).toBe("Bad Request");
  });

  it("prefers message when error field is whitespace only", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () =>
        JSON.stringify({
          error: "   ",
          message: "Name already exists",
        }),
    });

    let error: {
      message: string;
      response: {
        status: number;
        headers: Headers;
        statusText?: string;
        body?: unknown;
      };
    } | null = null;

    try {
      await commonApiPost({
        endpoint: "e",
        body: {},
        errorMode: "structured",
      });
    } catch (caught) {
      error = caught as {
        message: string;
        response: {
          status: number;
          headers: Headers;
          statusText?: string;
          body?: unknown;
        };
      };
    }

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe("Name already exists");
    expect(error?.response.body).toBe(
      '{"error":"   ","message":"Name already exists"}'
    );
    expect(error?.response.statusText).toBe("Bad Request");
  });

  it("prefers details message when higher-priority fields are whitespace only", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () =>
        JSON.stringify({
          error: "   ",
          message: "   ",
          details: [{ message: "Not allowed to reorder this curation" }],
        }),
    });

    let error: {
      message: string;
      response: {
        status: number;
        headers: Headers;
        statusText?: string;
        body?: unknown;
      };
    } | null = null;

    try {
      await commonApiPost({
        endpoint: "e",
        body: {},
        errorMode: "structured",
      });
    } catch (caught) {
      error = caught as {
        message: string;
        response: {
          status: number;
          headers: Headers;
          statusText?: string;
          body?: unknown;
        };
      };
    }

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe("Not allowed to reorder this curation");
    expect(error?.response.body).toBe(
      '{"error":"   ","message":"   ","details":[{"message":"Not allowed to reorder this curation"}]}'
    );
    expect(error?.response.statusText).toBe("Forbidden");
  });

  it("prefers message when error key is missing", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => JSON.stringify({ message: "from message field" }),
    });

    await expect(commonApiPost({ endpoint: "e", body: {} })).rejects.toBe(
      "from message field"
    );
  });

  it("falls back to raw text when body is non-json", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "plain error text",
    });

    await expect(commonApiPost({ endpoint: "e", body: {} })).rejects.toBe(
      "plain error text"
    );
  });

  it("falls back to statusText when response body is empty", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      text: async () => "",
    });

    await expect(commonApiPost({ endpoint: "e", body: {} })).rejects.toBe(
      "Service Unavailable"
    );
  });
});

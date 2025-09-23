// NOTE: API methods are required on-demand inside tests after env is mocked

jest.mock("@/services/auth/auth.utils", () => ({
  getStagingAuth: jest.fn(),
  getAuthJwt: jest.fn(),
}));

import { withMockedEnv } from "@/tests/utils/mock-env";

describe("commonApiFetch", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    jest.resetAllMocks();
  });

  it("builds url with params and headers", async () => {
    await withMockedEnv(
      {
        API_ENDPOINT: "https://example.com",
        NEXT_PUBLIC_WEB3_MODAL_PROJECT_ID: "test-project-id",
      },
      async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ result: 1 }),
        });

        let commonApiFetch: any;
        jest.isolateModules(() => {
          const authMock = require("@/services/auth/auth.utils");
          (authMock.getStagingAuth as jest.Mock).mockReturnValue("s");
          (authMock.getAuthJwt as jest.Mock).mockReturnValue("jwt");
          ({ commonApiFetch } = require("@/services/api/common-api"));
        });

        const result = await commonApiFetch<{ result: number }>({
          endpoint: "test",
          params: { foo: "bar", typ: "nic" },
        });

        expect(global.fetch).toHaveBeenCalledWith(
          "https://example.com/api/test?foo=bar&typ=cic",
          expect.objectContaining({
            headers: expect.objectContaining({
              "Content-Type": "application/json",
              "x-6529-auth": "s",
              Authorization: "Bearer jwt",
            }),
            signal: undefined,
          })
        );
        expect(result).toEqual({ result: 1 });
      }
    );
  });

  it("rejects with error body when not ok", async () => {
    await withMockedEnv(
      {
        API_ENDPOINT: "https://example.com",
        NEXT_PUBLIC_WEB3_MODAL_PROJECT_ID: "test-project-id",
      },
      async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          statusText: "Bad",
          json: async () => ({ error: "err" }),
        });

        let commonApiFetch: any;
        jest.isolateModules(() => {
          const authMock = require("@/services/auth/auth.utils");
          (authMock.getStagingAuth as jest.Mock).mockReturnValue(null);
          (authMock.getAuthJwt as jest.Mock).mockReturnValue(null);
          ({ commonApiFetch } = require("@/services/api/common-api"));
        });

        await expect(commonApiFetch({ endpoint: "bad" })).rejects.toBe("err");
      }
    );
  });
});

describe("commonApiPost", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    jest.resetAllMocks();
  });

  it("posts data and returns json", async () => {
    await withMockedEnv(
      {
        API_ENDPOINT: "https://example.com",
        NEXT_PUBLIC_WEB3_MODAL_PROJECT_ID: "test-project-id",
      },
      async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ res: 1 }),
        });

        let commonApiPost: any;
        jest.isolateModules(() => {
          const authMock = require("@/services/auth/auth.utils");
          (authMock.getStagingAuth as jest.Mock).mockReturnValue("a");
          (authMock.getAuthJwt as jest.Mock).mockReturnValue(null);
          ({ commonApiPost } = require("@/services/api/common-api"));
        });

        const result = await commonApiPost<{ v: number }, { res: number }>({
          endpoint: "e",
          body: { v: 1 },
        });

        expect(global.fetch).toHaveBeenCalledWith(
          "https://example.com/api/e",
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
      }
    );
  });

  it("rejects on error", async () => {
    await withMockedEnv(
      {
        API_ENDPOINT: "https://example.com",
        NEXT_PUBLIC_WEB3_MODAL_PROJECT_ID: "test-project-id",
      },
      async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          statusText: "B",
          json: async () => ({ error: "err" }),
        });

        let commonApiPost: any;
        jest.isolateModules(() => {
          const authMock = require("@/services/auth/auth.utils");
          (authMock.getStagingAuth as jest.Mock).mockReturnValue(null);
          (authMock.getAuthJwt as jest.Mock).mockReturnValue(null);
          ({ commonApiPost } = require("@/services/api/common-api"));
        });

        await expect(commonApiPost({ endpoint: "e", body: {} })).rejects.toBe(
          "err"
        );
      }
    );
  });
});

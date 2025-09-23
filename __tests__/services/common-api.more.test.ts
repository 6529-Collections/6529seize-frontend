import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";
import { withMockedEnv } from "@/tests/utils/mock-env";

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(),
  getStagingAuth: jest.fn(),
}));

beforeEach(() => {
  (global as any).fetch = jest.fn();
  (getAuthJwt as jest.Mock).mockReturnValue("jwt");
  (getStagingAuth as jest.Mock).mockReturnValue("stage");
});

afterAll(() => {});

describe("commonApi utility methods", () => {
  it("commonApiPut posts JSON body", async () => {
    await withMockedEnv(
      {
        API_ENDPOINT: "https://test.6529.io",
      },
      async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ ok: 1 }),
        });

        let commonApiPut: any;
        jest.isolateModules(() => {
          ({ commonApiPut } = require("@/services/api/common-api"));
        });

        const res = await commonApiPut({ endpoint: "e", body: { a: 1 } });
        expect(res).toEqual({ ok: 1 });
        expect(global.fetch).toHaveBeenCalledWith(
          "https://test.6529.io/api/e",
          expect.objectContaining({
            method: "PUT",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
            body: JSON.stringify({ a: 1 }),
          })
        );
      }
    );
  });

  it("commonApiDeleteWithBody deletes with body", async () => {
    await withMockedEnv(
      {
        API_ENDPOINT: "https://test.6529.io",
      },
      async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ r: 2 }),
        });

        let commonApiDeleteWithBody: any;
        jest.isolateModules(() => {
          ({ commonApiDeleteWithBody } = require("@/services/api/common-api"));
        });

        const res = await commonApiDeleteWithBody({
          endpoint: "del",
          body: { a: 1 },
        });
        expect(res).toEqual({ r: 2 });
        expect(global.fetch).toHaveBeenCalledWith(
          "https://test.6529.io/api/del",
          expect.objectContaining({
            method: "DELETE",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
            body: JSON.stringify({ a: 1 }),
          })
        );
      }
    );
  });

  it("commonApiDelete sends DELETE request", async () => {
    await withMockedEnv(
      {
        API_ENDPOINT: "https://test.6529.io",
      },
      async () => {
        (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

        let commonApiDelete: any;
        jest.isolateModules(() => {
          ({ commonApiDelete } = require("@/services/api/common-api"));
        });

        await commonApiDelete({ endpoint: "x" });
        expect(global.fetch).toHaveBeenCalledWith(
          "https://test.6529.io/api/x",
          expect.objectContaining({
            method: "DELETE",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
          })
        );
      }
    );
  });

  it("commonApiPostForm posts form data without content-type", async () => {
    await withMockedEnv(
      {
        API_ENDPOINT: "https://test.6529.io",
      },
      async () => {
        const form = new FormData();
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ res: 3 }),
        });

        let commonApiPostForm: any;
        jest.isolateModules(() => {
          ({ commonApiPostForm } = require("@/services/api/common-api"));
        });

        const result = await commonApiPostForm({ endpoint: "f", body: form });
        expect(result).toEqual({ res: 3 });
        expect(global.fetch).toHaveBeenCalledWith(
          "https://test.6529.io/api/f",
          expect.objectContaining({
            method: "POST",
            headers: expect.any(Object),
            body: form,
          })
        );
      }
    );
  });
});

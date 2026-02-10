import {
  commonApiDelete,
  commonApiDeleteWithBody,
  commonApiPut,
} from "@/services/api/common-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(),
  getStagingAuth: jest.fn(),
}));

beforeEach(() => {
  (global as any).fetch = jest.fn();
  (getAuthJwt as jest.Mock).mockReturnValue("jwt");
  (getStagingAuth as jest.Mock).mockReturnValue("stage");
});

describe("commonApi utility methods", () => {
  it("commonApiPut posts JSON body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: 1 }),
      headers: new Headers({ "content-type": "application/json" }),
    });
    const res = await commonApiPut({ endpoint: "e", body: { a: 1 } });
    expect(res).toEqual({ ok: 1 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/e",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-6529-auth": "stage",
          Authorization: "Bearer jwt",
        },
        body: JSON.stringify({ a: 1 }),
      }
    );
  });

  it("commonApiDeleteWithBody deletes with body", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ r: 2 }),
      headers: new Headers({ "content-type": "application/json" }),
    });
    const res = await commonApiDeleteWithBody({
      endpoint: "del",
      body: { a: 1 },
    });
    expect(res).toEqual({ r: 2 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/del",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-6529-auth": "stage",
          Authorization: "Bearer jwt",
        },
        body: JSON.stringify({ a: 1 }),
      }
    );
  });

  it("commonApiDelete sends DELETE request", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
    });
    await commonApiDelete({ endpoint: "x" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/x",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-6529-auth": "stage",
          Authorization: "Bearer jwt",
        },
      }
    );
  });

  it("commonApiPostForm posts form data without content-type", async () => {
    const form = new FormData();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ res: 3 }),
      headers: new Headers({ "content-type": "application/json" }),
    });
    const { commonApiPostForm } = await import("@/services/api/common-api");
    const result = await commonApiPostForm({ endpoint: "f", body: form });
    expect(result).toEqual({ res: 3 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/f",
      {
        method: "POST",
        headers: { "x-6529-auth": "stage", Authorization: "Bearer jwt" },
        body: form,
      }
    );
  });
});

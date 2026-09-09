import {
  commonApiDelete,
  commonApiDeleteWithBody,
  commonApiDeleteWithResponse,
  commonApiPut,
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
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
  it("reads status only from a structured API error shape", () => {
    expect(getStructuredApiErrorStatus({ status: 422 })).toBe(422);
    expect(getStructuredApiErrorStatus(new Error("422 in message"))).toBe(
      undefined
    );
    expect(getStructuredApiErrorStatus({ status: "422" })).toBeUndefined();
  });

  it("reads a code only from a structured API error response body", () => {
    expect(
      getStructuredApiErrorCode({
        response: {
          body: JSON.stringify({ code: "CONTENT_MODERATION_REJECTED" }),
        },
      })
    ).toBe("CONTENT_MODERATION_REJECTED");
    expect(
      getStructuredApiErrorCode({
        response: { body: { code: "CONTENT_MODERATION_REJECTED" } },
      })
    ).toBe("CONTENT_MODERATION_REJECTED");
    expect(
      getStructuredApiErrorCode({ response: { body: "not-json" } })
    ).toBeUndefined();
    expect(getStructuredApiErrorCode({ status: 422 })).toBeUndefined();
  });

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

  it("commonApiDeleteWithResponse parses a DELETE response without a body", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "WITHDRAWN" }),
      headers: new Headers({ "content-type": "application/json" }),
    });

    await expect(
      commonApiDeleteWithResponse({ endpoint: "report" })
    ).resolves.toEqual({ status: "WITHDRAWN" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/report",
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

  it("commonApiDeleteWithResponse includes wallet authentication", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ deleted: true }),
      headers: new Headers({ "content-type": "application/json" }),
    });

    const result = await commonApiDeleteWithResponse<{ deleted: boolean }>({
      endpoint: "x",
    });

    expect(result).toEqual({ deleted: true });
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

  it("commonApiDelete forwards an abort signal", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
    });
    const controller = new AbortController();

    await commonApiDelete({ endpoint: "x", signal: controller.signal });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/x",
      expect.objectContaining({ signal: controller.signal })
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

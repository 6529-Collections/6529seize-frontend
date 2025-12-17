import { API_AUTH_COOKIE } from "@/constants";
import * as api from "@/services/6529api";
import { getStagingAuth } from "@/services/auth/auth.utils";
import Cookies from "js-cookie";

jest.mock("js-cookie", () => ({ remove: jest.fn() }));
jest.mock("@/services/auth/auth.utils", () => ({ getStagingAuth: jest.fn() }));

const { fetchUrl, fetchAllPages, postData, postFormData } = api;

function getHeaders(callIndex = 0): Headers {
  return (globalThis.fetch as jest.Mock).mock.calls[callIndex][1].headers;
}

describe("6529api service", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (globalThis as any).fetch = jest.fn();
  });

  it("fetchUrl removes cookie on 401 and returns json", async () => {
    (getStagingAuth as jest.Mock).mockReturnValue("token");
    const json = jest.fn().mockResolvedValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockResolvedValue({ status: 401, json });

    const result = await fetchUrl("/foo");

    expect(globalThis.fetch).toHaveBeenCalledWith("/foo", expect.any(Object));
    expect(getHeaders().get("x-6529-auth")).toBe("token");
    expect(Cookies.remove).toHaveBeenCalledWith(API_AUTH_COOKIE);
    expect(result).toEqual({ ok: true });
  });

  it("fetchAllPages concatenates pages", async () => {
    (getStagingAuth as jest.Mock).mockReturnValue(null);
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: ["a"], next: "http://localhost/next" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: ["b"] }),
      });

    const result = await fetchAllPages("http://localhost/start");

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost/start",
      expect.any(Object)
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost/next",
      expect.any(Object)
    );
    expect(getHeaders(0).get("x-6529-auth")).toBeNull();
    expect(getHeaders(1).get("x-6529-auth")).toBeNull();
    expect(result).toEqual(["a", "b"]);
  });

  it("postData sends JSON body and returns status/response", async () => {
    (getStagingAuth as jest.Mock).mockReturnValue(null);
    const json = jest.fn().mockResolvedValue({ done: true });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json,
    });

    const result = await postData("/bar", { foo: "bar" });

    expect(globalThis.fetch).toHaveBeenCalledWith("/bar", expect.any(Object));
    expect(getHeaders().get("Content-Type")).toBe("application/json");
    expect(getHeaders().get("x-6529-auth")).toBeNull();
    expect(result).toEqual({ status: 201, response: { done: true } });
  });

  it("postFormData sends FormData body with auth header", async () => {
    (getStagingAuth as jest.Mock).mockReturnValue("tok");
    const formData = new FormData();
    const json = jest.fn().mockResolvedValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json,
    });

    const result = await postFormData("/fd", formData);

    expect(globalThis.fetch).toHaveBeenCalledWith("/fd", expect.any(Object));
    expect(getHeaders().get("x-6529-auth")).toBe("tok");
    expect(result).toEqual({ status: 200, response: { ok: true } });
  });
});

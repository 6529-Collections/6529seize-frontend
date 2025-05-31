import { distributionPlanApiFetch, distributionPlanApiPost, distributionPlanApiDelete } from "../../services/distribution-plan-api";

jest.mock("../../services/distribution-plan.utils", () => ({ makeErrorToast: jest.fn() }));
jest.mock("../../services/auth/auth.utils", () => ({ getAuthJwt: jest.fn(), removeAuthJwt: jest.fn() }));

const { makeErrorToast } = jest.requireMock("../../services/distribution-plan.utils");
const { getAuthJwt, removeAuthJwt } = jest.requireMock("../../services/auth/auth.utils");

beforeEach(() => {
  jest.clearAllMocks();
  (getAuthJwt as jest.Mock).mockReturnValue(null);
});

describe("distribution-plan-api", () => {
  it("handles successful fetch", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({ foo: "bar" }) }) as any;
    const result = await distributionPlanApiFetch<any>("/path");
    expect(result).toEqual({ success: true, data: { foo: "bar" } });
  });

  it("handles unauthorized", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 401, json: jest.fn() }) as any;
    const res = await distributionPlanApiFetch<any>("/x");
    expect(removeAuthJwt).toHaveBeenCalled();
    expect(makeErrorToast).toHaveBeenCalledWith("Unauthorized");
    expect(res.success).toBe(false);
  });

  it("posts data with auth header", async () => {
    (getAuthJwt as jest.Mock).mockReturnValue("jwt");
    global.fetch = jest.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({ a: 1 }) }) as any;
    await distributionPlanApiPost<any>({ endpoint: "/p", body: { x: 1 } });
    const call = (fetch as jest.Mock).mock.calls[0];
    expect(call[1].headers["Authorization"]).toBe("Bearer jwt");
  });

  it("deletes and handles plain ok response", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 200, statusText: "OK", json: () => { throw new Error("no json") } }) as any;
    const res = await distributionPlanApiDelete<any>({ endpoint: "/d" });
    expect(res).toEqual({ success: true, data: null });
  });
});

// Outside a React server render `cache` is a pass-through, so model its
// per-request memoization to verify that repeated calls share one request.
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  const memoStores: Array<Map<string, unknown>> = [];
  return {
    ...actual,
    __memoStores: memoStores,
    cache: <Args extends unknown[], Result>(fn: (...args: Args) => Result) => {
      const store = new Map<string, Result>();
      memoStores.push(store);
      return (...args: Args): Result => {
        const key = JSON.stringify(args);
        if (!store.has(key)) {
          store.set(key, fn(...args));
        }
        return store.get(key) as Result;
      };
    },
  };
});

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(),
}));
jest.mock("@/helpers/server.helpers", () => ({
  getUserProfile: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";
import {
  loadProfileStatements,
  loadUserProfile,
} from "@/helpers/user-page.server";
import { commonApiFetch } from "@/services/api/common-api";

const memoStores = (
  jest.requireMock("react") as { __memoStores: Array<Map<string, unknown>> }
).__memoStores;
const getAppCommonHeadersMock = getAppCommonHeaders as jest.Mock;
const getUserProfileMock = getUserProfile as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;

describe("user page server loaders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    memoStores.forEach((store) => store.clear());
    getAppCommonHeadersMock.mockResolvedValue({ Authorization: "Bearer jwt" });
    getUserProfileMock.mockResolvedValue({ handle: "alice" });
    commonApiFetchMock.mockResolvedValue([]);
  });

  describe("loadUserProfile", () => {
    it("loads the identity once per request and forwards request auth", async () => {
      const [first, second] = await Promise.all([
        loadUserProfile("alice"),
        loadUserProfile("alice"),
      ]);

      expect(first).toEqual({ ok: true, profile: { handle: "alice" } });
      expect(second).toBe(first);
      expect(getUserProfileMock).toHaveBeenCalledTimes(1);
      expect(getUserProfileMock).toHaveBeenCalledWith({
        user: "alice",
        headers: { Authorization: "Bearer jwt" },
      });
    });

    it("keeps different identities separate", async () => {
      await loadUserProfile("alice");
      await loadUserProfile("bob");

      expect(getUserProfileMock).toHaveBeenCalledTimes(2);
    });

    it("returns failures as a result so callers keep their own handling", async () => {
      const error = Object.assign(new Error("missing"), { status: 404 });
      getUserProfileMock.mockRejectedValueOnce(error);

      await expect(loadUserProfile("ghost")).resolves.toEqual({
        ok: false,
        error,
      });
    });
  });

  describe("loadProfileStatements", () => {
    it("loads the statements once per request for the same identity segment", async () => {
      const statements = [{ statement_type: "BIO" }];
      commonApiFetchMock.mockResolvedValue(statements);

      const [first, second] = await Promise.all([
        loadProfileStatements("alice"),
        loadProfileStatements("alice"),
      ]);

      expect(first).toBe(statements);
      expect(second).toBe(statements);
      expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
      expect(commonApiFetchMock).toHaveBeenCalledWith({
        endpoint: "profiles/alice/cic/statements",
        headers: { Authorization: "Bearer jwt" },
      });
    });

    it.each<[string[], string]>([
      [["Alice", "alice", "ALICE"], "profiles/alice/cic/statements"],
      [
        ["Br%C3%9Cder", "br%c3%9cder", "BRÜDER", "brüder"],
        "profiles/br%C3%BCder/cic/statements",
      ],
      [
        ["Alice%2FAdmin", "alice%2fadmin", "Alice/Admin"],
        "profiles/alice%2Fadmin/cic/statements",
      ],
    ])(
      "shares one request across every spelling of the same identity: %j",
      async (spellings, endpoint) => {
        await Promise.all(
          spellings.map((spelling) => loadProfileStatements(spelling))
        );

        expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
        expect(commonApiFetchMock).toHaveBeenCalledWith({
          endpoint,
          headers: { Authorization: "Bearer jwt" },
        });
      }
    );

    it("keeps different identities separate", async () => {
      await loadProfileStatements("alice");
      await loadProfileStatements("bob");

      expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
    });

    it("keeps a malformed percent sequence as one encoded literal segment", async () => {
      await loadProfileStatements("%E0%A4%A");

      expect(commonApiFetchMock).toHaveBeenCalledWith({
        endpoint: "profiles/%25e0%25a4%25a/cic/statements",
        headers: { Authorization: "Bearer jwt" },
      });
    });

    it.each([["."], [".."], ["%2E%2E"], ["%2e"]])(
      "rejects the dot-only identity %s without calling the API",
      async (identity) => {
        await expect(loadProfileStatements(identity)).rejects.toThrow(
          "Profile identity cannot be addressed as one path segment"
        );
        expect(commonApiFetchMock).not.toHaveBeenCalled();
      }
    );

    it("rejects when the API call fails so each caller can degrade", async () => {
      commonApiFetchMock.mockRejectedValueOnce(new Error("upstream failed"));

      await expect(loadProfileStatements("alice")).rejects.toThrow(
        "upstream failed"
      );
    });
  });
});

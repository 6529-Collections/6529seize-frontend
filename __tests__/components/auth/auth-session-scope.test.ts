import { getAuthSessionRole } from "@/components/auth/auth-session-scope";
import { getAuthJwt } from "@/services/auth/auth.utils";
import { getRole } from "@/services/auth/jwt-validation.utils";

jest.mock("@/services/auth/auth.utils", () => ({ getAuthJwt: jest.fn() }));
jest.mock("@/services/auth/jwt-validation.utils", () => ({
  getRole: jest.fn(),
}));
jest.mock("@/utils/error-sanitizer", () => ({ logErrorSecurely: jest.fn() }));

beforeEach(() => {
  jest.resetAllMocks();
});

it("keeps an unavailable or unreadable token distinct from a direct session", () => {
  jest.mocked(getAuthJwt).mockReturnValue(null);
  expect(getAuthSessionRole()).toBeUndefined();
  expect(getRole).not.toHaveBeenCalled();
  jest.mocked(getAuthJwt).mockReturnValue("unreadable");
  jest.mocked(getRole).mockImplementation(() => {
    throw new Error("Malformed token");
  });
  expect(getAuthSessionRole()).toBeUndefined();
});

it.each([null, "delegating-profile"])(
  "returns the current explicit role %s before the proxy lookup",
  (role) => {
    jest.mocked(getAuthJwt).mockReturnValue("session");
    jest.mocked(getRole).mockReturnValue(role);
    expect(getAuthSessionRole()).toBe(role);
  }
);

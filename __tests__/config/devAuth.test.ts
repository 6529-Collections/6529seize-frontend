const mockGetNodeEnv = jest.fn<string | undefined, []>();
const mockPublicEnv: { USE_DEV_AUTH?: string | undefined } = {};

jest.mock("@/config/env", () => ({
  getNodeEnv: () => mockGetNodeEnv(),
  publicEnv: mockPublicEnv,
}));

import { isDevAuthEnabled, isDevLikeEnv } from "@/config/devAuth";

describe("dev auth runtime guard", () => {
  beforeEach(() => {
    mockGetNodeEnv.mockReset();
    mockPublicEnv.USE_DEV_AUTH = "true";
  });

  it.each(["development", "test", "local"])(
    "treats %s as dev-like",
    (nodeEnv) => {
      mockGetNodeEnv.mockReturnValue(nodeEnv);
      expect(isDevLikeEnv()).toBe(true);
      expect(isDevAuthEnabled()).toBe(true);
    }
  );

  it.each(["production", undefined])(
    "ignores dev auth when the runtime is %s",
    (nodeEnv) => {
      mockGetNodeEnv.mockReturnValue(nodeEnv);
      expect(isDevLikeEnv()).toBe(false);
      expect(isDevAuthEnabled()).toBe(false);
    }
  );

  it.each([undefined, "false", "TRUE", "1"])(
    "stays off unless USE_DEV_AUTH is exactly true (%s)",
    (value) => {
      mockGetNodeEnv.mockReturnValue("development");
      mockPublicEnv.USE_DEV_AUTH = value;
      expect(isDevAuthEnabled()).toBe(false);
    }
  );
});

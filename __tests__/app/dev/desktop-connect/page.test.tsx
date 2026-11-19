import { notFound } from "next/navigation";
import DesktopConnectPreviewPage from "@/app/dev/desktop-connect/page";
import DesktopConnectPreview from "@/app/dev/desktop-connect/DesktopConnectPreview";
import { publicEnv } from "@/config/env";

jest.mock("@/config/env", () => ({
  publicEnv: { NODE_ENV: "test" },
}));
jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: () => ({}),
}));
jest.mock("@/app/dev/desktop-connect/DesktopConnectPreview", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("Preview is unavailable");
  }),
}));

describe("Desktop wallet preview route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(["production", "test", undefined] as const)(
    "hides the preview when NODE_ENV is %s",
    async (nodeEnv) => {
      jest.replaceProperty(publicEnv, "NODE_ENV", nodeEnv);

      await expect(DesktopConnectPreviewPage()).rejects.toThrow(
        "Preview is unavailable"
      );
      expect(notFound).toHaveBeenCalledTimes(1);
    }
  );

  it("renders the preview during development", async () => {
    jest.replaceProperty(publicEnv, "NODE_ENV", "development");

    expect(await DesktopConnectPreviewPage()).toEqual(<DesktopConnectPreview />);
    expect(notFound).not.toHaveBeenCalled();
  });
});

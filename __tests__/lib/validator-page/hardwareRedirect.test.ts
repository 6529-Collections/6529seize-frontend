/** @jest-environment node */
import { VALIDATOR_GUIDE_PAGES } from "@/lib/validator-page/content/guidePages";
import { VALIDATOR_HARDWARE_HREF } from "@/lib/validator-page/content/pageText";

const permanentRedirect = jest.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});

jest.mock("next/navigation", () => ({
  permanentRedirect: (url: string) => permanentRedirect(url),
}));

describe("/validator/hardware", () => {
  it("leads to the guide's Path B, at What to buy", () => {
    expect(VALIDATOR_HARDWARE_HREF).toBe(
      "/validator/guide/home-box#what-to-buy"
    );
    const homeBox = VALIDATOR_GUIDE_PAGES.find(
      (page) => page.slug === "home-box"
    );
    expect(homeBox?.markdown.split("\n")).toContain("## What to buy");
  });

  it("redirects permanently to that section", async () => {
    const { default: ValidatorHardwareRoute } =
      await import("@/app/validator/hardware/page");
    expect(() => ValidatorHardwareRoute()).toThrow(
      `NEXT_REDIRECT ${VALIDATOR_HARDWARE_HREF}`
    );
    expect(permanentRedirect).toHaveBeenCalledWith(VALIDATOR_HARDWARE_HREF);
  });
});

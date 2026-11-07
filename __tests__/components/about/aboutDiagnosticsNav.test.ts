import {
  getAboutNavItemHref,
  getVisibleAboutNavGroups,
} from "@/components/about/about.routes";
import { publicEnv } from "@/config/env";

jest.mock("@/config/env", () => ({ publicEnv: {} }));
const mockEnv = publicEnv as Record<string, string | undefined>;

const diagnosticsHrefs = () =>
  getVisibleAboutNavGroups({ hideSubscriptions: false })
    .flatMap((group) => group.items)
    .map(getAboutNavItemHref)
    .filter((href) => href === "/about/diagnostics");

describe("Send Diagnostics in the About menu", () => {
  afterEach(() => {
    delete mockEnv["NEXT_PUBLIC_FEATURE_DIAGNOSTICS"];
  });

  it("is hidden while the diagnostics flag is off", () => {
    expect(diagnosticsHrefs()).toEqual([]);
  });

  it("links to /about/diagnostics next to Contact Us when the flag is on", () => {
    mockEnv["NEXT_PUBLIC_FEATURE_DIAGNOSTICS"] = "true";
    expect(diagnosticsHrefs()).toEqual(["/about/diagnostics"]);
    const about6529 = getVisibleAboutNavGroups({
      hideSubscriptions: false,
    }).find((group) => group.id === "about6529");
    const hrefs = about6529?.items.map(getAboutNavItemHref) ?? [];
    expect(hrefs.indexOf("/about/diagnostics")).toBe(
      hrefs.indexOf("/about/contact-us") + 1
    );
  });
});

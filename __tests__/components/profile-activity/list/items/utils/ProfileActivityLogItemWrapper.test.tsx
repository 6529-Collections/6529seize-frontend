import ProfileActivityLogItemWrapper from "@/components/profile-activity/list/items/utils/ProfileActivityLogItemWrapper";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import type { ProfileActivityLog } from "@/entities/IProfile";
import { ProfileActivityLogType, RateMatter } from "@/types/enums";
import { fireEvent, render, screen } from "@testing-library/react";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";

let mockPfp: string | null = null;

jest.mock("@/components/user/utils/CommonProfileLink", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="link" />),
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: mockPfp ? { pfp: mockPfp } : null }),
}));
const {
  default: CommonProfileLink,
} = require("@/components/user/utils/CommonProfileLink");

describe("ProfileActivityLogItemWrapper", () => {
  beforeEach(() => {
    (CommonProfileLink as jest.Mock).mockClear();
    mockPfp = null;
  });

  it("passes props to CommonProfileLink using proxy handle and rep tab", () => {
    const log: any = {
      id: "1",
      type: ProfileActivityLogType.RATING_EDIT,
      proxy_handle: "alice",
      profile_handle: "bob",
      contents: { rating_matter: RateMatter.REP },
    };
    render(
      <table>
        <tbody>
          <ProfileActivityLogItemWrapper log={log} user="alice">
            child
          </ProfileActivityLogItemWrapper>
        </tbody>
      </table>
    );
    expect((CommonProfileLink as jest.Mock).mock.calls[0][0]).toMatchObject({
      handleOrWallet: "alice",
      isCurrentUser: true,
      tabTarget: USER_PAGE_TAB_IDS.REP,
    });
  });

  it("omits profile link when archived", () => {
    const log: any = { id: "1", type: ProfileActivityLogType.PROFILE_ARCHIVED };
    render(
      <table>
        <tbody>
          <ProfileActivityLogItemWrapper log={log} user={null}>
            child
          </ProfileActivityLogItemWrapper>
        </tbody>
      </table>
    );
    expect(CommonProfileLink).not.toHaveBeenCalled();
  });

  const avatarLog: ProfileActivityLog = {
    id: "avatar-log",
    type: ProfileActivityLogType.HANDLE_EDIT,
    profile_id: "alice-id",
    profile_handle: "alice",
    target_id: null,
    target_profile_handle: null,
    proxy_id: null,
    proxy_handle: null,
    created_at: new Date("2026-11-06T00:00:00Z"),
    contents: { old_value: "before", new_value: "alice" },
  };
  const cid = "QmZ41GvrNSPUpSs4mfQy4jxUNudcLM6CXUTFwqtVd2m2XP";

  function avatarRow() {
    return (
      <ImageConfigContext.Provider
        value={{
          ...imageConfigDefault,
          remotePatterns: [{ protocol: "https", hostname: "media.6529.io" }],
        }}
      >
        <ProfileActivityLogItemWrapper log={avatarLog} user="alice">
          activity
        </ProfileActivityLogItemWrapper>
      </ImageConfigContext.Provider>
    );
  }

  it("requests a thumbnail for an IPFS avatar and keeps the 24px dimensions", () => {
    mockPfp = `ipfs://${cid}`;
    render(avatarRow());

    const image = screen.getByRole("img", { name: "alice" });
    const url = new URL(image.getAttribute("src")!, "http://localhost");
    expect(url.pathname).toBe("/_next/image");
    expect(url.searchParams.get("url")).toBe(
      `https://media.6529.io/ipfs/${cid}`
    );
    expect(image).toHaveAttribute("sizes", "24px");
    expect(image).toHaveAttribute("width", "24");
    expect(image).toHaveAttribute("height", "24");
    expect(image).toHaveAttribute("loading", "lazy");
  });

  it.each([
    ["https://example.com/avatar.png", "https://example.com/avatar.png"],
    [
      "https://d3lqz0a4bldqgf.cloudfront.net/pfp/user/avatar.png",
      "https://d3lqz0a4bldqgf.cloudfront.net/pfp/user/AUTOx50/avatar.png",
    ],
    [
      `ipfs://${cid}/avatar.gif`,
      `https://media.6529.io/ipfs/${cid}/avatar.gif`,
    ],
    [
      `ipfs://${cid}/avatar.svg`,
      `https://media.6529.io/ipfs/${cid}/avatar.svg`,
    ],
  ])("preserves direct image delivery for %s", (source, expected) => {
    mockPfp = source;
    render(avatarRow());
    const image = screen.getByRole("img", { name: "alice" });
    expect(image).toHaveAttribute("src", expected);
    expect(image).not.toHaveAttribute("srcset");
  });

  it("falls back to the original after an optimizer failure without retrying it", () => {
    mockPfp = `ipfs://${cid}`;
    render(avatarRow());
    const image = screen.getByRole("img", { name: "alice" });

    fireEvent.error(image);
    const fallback = screen.getByRole("img", { name: "alice" });
    expect(fallback).toHaveAttribute(
      "src",
      `https://media.6529.io/ipfs/${cid}`
    );
    expect(fallback).not.toHaveAttribute("srcset");
    fireEvent.error(fallback);
    expect(screen.getByRole("img", { name: "alice" })).toBe(fallback);
    expect(fallback).toHaveAttribute(
      "src",
      `https://media.6529.io/ipfs/${cid}`
    );
    expect(screen.getByText("activity")).toBeVisible();
  });

  it("optimizes a new avatar after the previous source failed", () => {
    mockPfp = `ipfs://${cid}/first.png`;
    const { rerender } = render(avatarRow());
    fireEvent.error(screen.getByRole("img", { name: "alice" }));

    mockPfp = `ipfs://${cid}/second.png`;
    rerender(avatarRow());
    const image = screen.getByRole("img", { name: "alice" });
    const url = new URL(image.getAttribute("src")!, "http://localhost");
    expect(url.pathname).toBe("/_next/image");
    expect(url.searchParams.get("url")).toBe(
      `https://media.6529.io/ipfs/${cid}/second.png`
    );
  });
});

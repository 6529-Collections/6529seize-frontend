import { render, screen } from "@testing-library/react";

import ProfileCmsPage from "@/app/[user]/[...cmsPath]/page";
import minimalPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/minimal-profile-homepage.package.json";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import { getProfileCmsPrimarySite } from "@/lib/profile-cms/runtime/fetcher";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";

jest.mock("@/components/profile-cms/CmsSiteRenderer", () => ({
  __esModule: true,
  default: ({
    page,
  }: {
    readonly page: { readonly metadata: { title: string } };
  }) => <div data-testid="cms-renderer">{page.metadata.title}</div>,
}));

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(),
}));

jest.mock("@/helpers/server.helpers", () => ({
  getUserProfile: jest.fn(),
}));

jest.mock("@/lib/profile-cms/runtime/fetcher", () => ({
  getProfileCmsPrimarySite: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: jest.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
}));

const getAppCommonHeadersMock = getAppCommonHeaders as jest.Mock;
const getUserProfileMock = getUserProfile as jest.Mock;
const getProfileCmsPrimarySiteMock = getProfileCmsPrimarySite as jest.Mock;
const cmsPackage = minimalPackage as unknown as CmsPackageV1;

describe("profile CMS App Router catch-all", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAppCommonHeadersMock.mockResolvedValue({});
    getUserProfileMock.mockResolvedValue({
      handle: "punk6529",
      primary_wallet: "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0",
    });
    getProfileCmsPrimarySiteMock.mockResolvedValue({
      cmsPackage,
      source: "fixture",
    });
  });

  it("does not claim the bare profile route", async () => {
    await expect(
      ProfileCmsPage({
        params: Promise.resolve({ user: "punk6529" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("does not fetch profile data for non-CMS nested profile paths", async () => {
    await expect(
      ProfileCmsPage({
        params: Promise.resolve({
          user: "punk6529",
          cmsPath: ["collected"],
        }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getUserProfileMock).not.toHaveBeenCalled();
    expect(getProfileCmsPrimarySiteMock).not.toHaveBeenCalled();
  });

  it("renders the CMS website at /:handle/index.html", async () => {
    const page = await ProfileCmsPage({
      params: Promise.resolve({
        user: "punk6529",
        cmsPath: ["index.html"],
      }),
    });

    render(page);

    expect(screen.getByTestId("cms-renderer")).toHaveTextContent("punk6529");
    expect(getProfileCmsPrimarySiteMock).toHaveBeenCalledWith({
      handle: "punk6529",
      headers: {},
    });
  });

  it("returns a safe not-found when no primary CMS site exists", async () => {
    getProfileCmsPrimarySiteMock.mockResolvedValueOnce(null);

    await expect(
      ProfileCmsPage({
        params: Promise.resolve({
          user: "punk6529",
          cmsPath: ["index.html"],
        }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("shows an empty state for published packages missing a route", async () => {
    const page = await ProfileCmsPage({
      params: Promise.resolve({
        user: "punk6529",
        cmsPath: ["missing", "index.html"],
      }),
    });

    render(page);

    expect(screen.getByText("Website page not found")).toBeInTheDocument();
  });
});

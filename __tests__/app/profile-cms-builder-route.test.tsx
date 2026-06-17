import { render, screen } from "@testing-library/react";

import ProfileCmsBuilderPage from "@/app/[user]/cms/builder/page";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";

jest.mock("@/components/profile-cms-builder/ProfileCmsBuilder", () => ({
  __esModule: true,
  default: ({
    handle,
    profileId,
    title,
  }: {
    readonly handle: string;
    readonly profileId?: string | undefined;
    readonly title: string;
  }) => (
    <div data-testid="builder-route">
      {title}:{handle}:{profileId}
    </div>
  ),
}));

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(),
}));

jest.mock("@/helpers/server.helpers", () => ({
  getUserProfile: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const getAppCommonHeadersMock = getAppCommonHeaders as jest.Mock;
const getUserProfileMock = getUserProfile as jest.Mock;

describe("profile CMS builder route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env["PROFILE_CMS_BUILDER_ENABLED"];
    delete process.env["NEXT_PUBLIC_PROFILE_CMS_BUILDER_ENABLED"];
    getAppCommonHeadersMock.mockResolvedValue({});
    getUserProfileMock.mockResolvedValue({
      id: "profile-punk6529",
      handle: "punk6529",
    });
  });

  it("is hidden behind a feature flag", async () => {
    await expect(
      ProfileCmsBuilderPage({
        params: Promise.resolve({ user: "punk6529" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the builder for a profile handle when enabled", async () => {
    process.env["PROFILE_CMS_BUILDER_ENABLED"] = "true";

    const page = await ProfileCmsBuilderPage({
      params: Promise.resolve({ user: "punk6529" }),
    });
    render(page);

    expect(screen.getByTestId("builder-route")).toHaveTextContent(
      "Profile CMS builder:punk6529:profile-punk6529"
    );
    expect(getUserProfileMock).toHaveBeenCalledWith({
      user: "punk6529",
      headers: {},
    });
  });

  it("returns not found when the profile lookup fails", async () => {
    process.env["PROFILE_CMS_BUILDER_ENABLED"] = "true";
    getUserProfileMock.mockRejectedValueOnce(new Error("not found"));

    await expect(
      ProfileCmsBuilderPage({
        params: Promise.resolve({ user: "missing" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns not found when the profile lookup has no profile id", async () => {
    process.env["PROFILE_CMS_BUILDER_ENABLED"] = "true";
    getUserProfileMock.mockResolvedValueOnce({ handle: "punk6529" });

    await expect(
      ProfileCmsBuilderPage({
        params: Promise.resolve({ user: "punk6529" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

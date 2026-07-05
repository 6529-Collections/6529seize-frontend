import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProfileCmsVersionHistoryPanel from "@/components/profile-cms-builder/ProfileCmsVersionHistoryPanel";
import {
  listProfileCmsPackagesForProfile,
  rollbackProfileCmsPackage,
  type ProfileCmsPackageRecord,
} from "@/lib/profile-cms/builder/api";

jest.mock("@/lib/profile-cms/builder/api", () => ({
  listProfileCmsPackagesForProfile: jest.fn(),
  rollbackProfileCmsPackage: jest.fn(),
}));

const listMock = listProfileCmsPackagesForProfile as jest.Mock;
const rollbackMock = rollbackProfileCmsPackage as jest.Mock;

const record = (
  overrides: Partial<ProfileCmsPackageRecord>
): ProfileCmsPackageRecord => ({
  id: "pkg-1",
  profileId: "profile-1",
  profileHandle: "punk6529",
  packageId: "pkg-punk6529-builder-mvp",
  version: 1,
  status: "published",
  packageHash: "sha256:aa",
  payloadHash: "sha256:bb",
  updatedAt: "2026-07-05T00:00:00.000Z",
  createdAt: "2026-07-05T00:00:00.000Z",
  ...overrides,
});

const renderPanel = (
  overrides: Partial<
    React.ComponentProps<typeof ProfileCmsVersionHistoryPanel>
  > = {}
) =>
  render(
    <ProfileCmsVersionHistoryPanel
      builderApiEnabled
      canUseBuilderApi
      profileId="profile-1"
      {...overrides}
    />
  );

describe("ProfileCmsVersionHistoryPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists packages with status and marks the primary", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([
      record({ id: "pkg-2", version: 2, status: "published" }),
      record({ id: "pkg-1", version: 1, status: "superseded" }),
    ]);
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(screen.getByText(/Version 2/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Version 2/).textContent).toContain("Primary");
    expect(screen.getByText(/Version 1/).textContent).toContain("Superseded");
  });

  it("rolls a previous version back after confirmation", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([
      record({ id: "pkg-2", version: 2, status: "published" }),
      record({
        id: "pkg-1",
        version: 1,
        status: "superseded",
        packageId: "pkg-punk6529-builder-mvp",
      }),
    ]);
    rollbackMock.mockResolvedValue(
      record({ id: "pkg-1", status: "published" })
    );
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => screen.getByText(/Version 1/));

    // Only the non-primary published/superseded version offers rollback.
    await user.click(screen.getByRole("button", { name: "Make primary" }));
    expect(
      screen.getByRole("alertdialog", { name: "Confirm rollback" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Roll back" }));

    await waitFor(() => {
      expect(rollbackMock).toHaveBeenCalledWith("pkg-1", {
        expected_current_package_id: "pkg-punk6529-builder-mvp",
        expected_current_package_hash: "sha256:aa",
      });
    });
  });

  it("cancels the rollback confirmation without calling the API", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([
      record({ id: "pkg-2", version: 2, status: "published" }),
      record({ id: "pkg-1", version: 1, status: "superseded" }),
    ]);
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => screen.getByText(/Version 1/));
    await user.click(screen.getByRole("button", { name: "Make primary" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("alertdialog", { name: "Confirm rollback" })
    ).not.toBeInTheDocument();
    expect(rollbackMock).not.toHaveBeenCalled();
  });

  it("shows an unavailable notice when the caller cannot use the builder API", () => {
    renderPanel({ canUseBuilderApi: false });
    expect(
      screen.getByText(
        "Connect as this profile owner to view published versions."
      )
    ).toBeInTheDocument();
  });

  it("refreshes when the publish refresh token increments", async () => {
    listMock.mockResolvedValue([record({ id: "pkg-1", version: 1 })]);
    const { rerender } = renderPanel({ refreshToken: 0 });
    expect(listMock).not.toHaveBeenCalled();

    rerender(
      <ProfileCmsVersionHistoryPanel
        builderApiEnabled
        canUseBuilderApi
        profileId="profile-1"
        refreshToken={1}
      />
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith("profile-1");
    });
  });
});

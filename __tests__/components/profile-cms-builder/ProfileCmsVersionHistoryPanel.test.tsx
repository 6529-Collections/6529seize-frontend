import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileCmsVersionHistoryPanel from "@/components/profile-cms-builder/ProfileCmsVersionHistoryPanel";
import {
  listProfileCmsPackagesForProfile,
  rollbackProfileCmsPackage,
  unpublishProfileCmsPackage,
  type ProfileCmsPackageRecord,
} from "@/lib/profile-cms/builder/api";

jest.mock("@/lib/profile-cms/builder/api", () => ({
  listProfileCmsPackagesForProfile: jest.fn(),
  rollbackProfileCmsPackage: jest.fn(),
  unpublishProfileCmsPackage: jest.fn(),
}));
const list = jest.mocked(listProfileCmsPackagesForProfile);
const rollback = jest.mocked(rollbackProfileCmsPackage);
const unpublish = jest.mocked(unpublishProfileCmsPackage);
const record: ProfileCmsPackageRecord = {
  id: "database-id-3",
  profileId: "profile",
  profileHandle: "punk6529",
  packageId: "logical-package",
  version: 3,
  status: "published",
  isPrimary: true,
  packageHash: "sha256:current",
  payloadHash: "sha256:payload",
  createdAt: "2026-09-10T00:00:00Z",
  updatedAt: "2026-09-10T00:00:00Z",
  publishedAt: "2026-09-10T00:00:00Z",
};
const old: ProfileCmsPackageRecord = {
  ...record,
  id: "database-id-1",
  version: 1,
  isPrimary: false,
  status: "superseded",
  recoveryReceipt: {
    provider: "arweave",
    uri: "ar://signed-manifest",
    content_hash: "sha256:manifest",
    canonical: false,
    recorded_at: "2026-09-10T00:00:00Z",
  },
};
const show = () => {
  const onLoad = jest.fn();
  const onChanged = jest.fn();
  render(
    <ProfileCmsVersionHistoryPanel
      profileId="profile"
      enabled
      refreshToken={0}
      locale="en-US"
      busy={false}
      onLoad={onLoad}
      onChanged={onChanged}
    />
  );
  return { onLoad, onChanged };
};
describe("CMS version history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    list.mockResolvedValue([record, old]);
    rollback.mockResolvedValue(old);
    unpublish.mockResolvedValue({ ...record, isPrimary: false });
  });
  it("uses the explicit primary database ID for restoration and exposes the signed manifest", async () => {
    const user = userEvent.setup();
    const { onChanged, onLoad } = show();
    const makePrimary = await screen.findByRole("button", {
      name: "Make primary",
    });
    expect(
      screen.getByRole("link", { name: "Signed publication" })
    ).toHaveAttribute("href", expect.stringContaining("signed-manifest"));
    const item = makePrimary.closest("li")!;
    await user.click(within(item).getByRole("button", { name: "Load" }));
    expect(onLoad).toHaveBeenCalledWith(old.id);
    await user.click(makePrimary);
    expect(rollback).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(rollback).toHaveBeenCalledWith(old.id, {
        expected_current_package_id: record.id,
        expected_current_package_hash: record.packageHash,
      })
    );
    expect(onChanged).toHaveBeenCalled();
  });
  it("unpublishes only after confirming the current publication", async () => {
    const user = userEvent.setup();
    show();
    await user.click(
      await screen.findByRole("button", { name: "Unpublish website" })
    );
    expect(unpublish).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(unpublish).toHaveBeenCalledWith(record.id, {
        expected_current_package_id: record.id,
        expected_current_package_hash: record.packageHash,
      })
    );
  });
  it("restores a publication after unpublishing with an explicit empty-primary guard", async () => {
    list.mockResolvedValue([old]);
    const user = userEvent.setup();
    show();
    await user.click(
      await screen.findByRole("button", { name: "Make primary" })
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(rollback).toHaveBeenCalledWith(old.id, {
        expected_current_package_id: null,
      })
    );
  });
});

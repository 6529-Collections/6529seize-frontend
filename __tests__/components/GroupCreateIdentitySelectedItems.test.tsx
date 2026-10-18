import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupCreateIdentitySelectedItems from "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

const identities = [
  { wallet: "1", handle: "alice", pfp: undefined },
  { wallet: "2", handle: "bob", pfp: "img" },
];

describe("GroupCreateIdentitySelectedItems", () => {
  it("renders and removes", async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    render(
      <GroupCreateIdentitySelectedItems
        selectedIdentities={identities as any}
        onRemove={onRemove}
      />
    );
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(onRemove).toHaveBeenCalledWith("1");
  });

  it("requests the AUTOx50 derivative of a CDN profile picture", () => {
    render(
      <GroupCreateIdentitySelectedItems
        selectedIdentities={
          [{ wallet: "2", handle: "bob", pfp: CDN_AVATAR_URL }] as any
        }
        onRemove={jest.fn()}
      />
    );
    expect(
      getRequestedImageSrc(screen.getByAltText("Profile picture for bob"))
    ).toContain(scaledAvatarPath(ImageScale.W_AUTO_H_50));
  });

  it("supports the Quick Tag handle prefix and accessible remove label", () => {
    render(
      <GroupCreateIdentitySelectedItems
        selectedIdentities={identities as any}
        onRemove={jest.fn()}
        handlePrefix="@"
        getRemoveLabel={(identity) => `Remove @${identity.handle}`}
      />
    );

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove @alice" })
    ).toBeInTheDocument();
  });

  it("supports read-only selected identities", () => {
    render(
      <GroupCreateIdentitySelectedItems
        selectedIdentities={identities as any}
        handlePrefix="@"
      />
    );

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

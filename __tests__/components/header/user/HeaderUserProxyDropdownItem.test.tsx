import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HeaderUserProxyDropdownItem from "@/components/header/user/HeaderUserProxyDropdownItem";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

const profile = {
  id: 1,
  created_by: { handle: "alice", pfp: "img.png" },
};

describe("HeaderUserProxyDropdownItem", () => {
  it("activates proxy when not active", async () => {
    const activate = jest.fn();
    render(
      <HeaderUserProxyDropdownItem
        profileProxy={profile as any}
        activeProfileProxy={null}
        onActivateProfileProxy={activate}
      />
    );
    const btn = screen.getByRole("button");
    await userEvent.click(btn);
    expect(activate).toHaveBeenCalledWith(profile);
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("requests the AUTOx50 derivative of a CDN profile picture", () => {
    const cdnProfile = {
      ...profile,
      created_by: { ...profile.created_by, pfp: CDN_AVATAR_URL },
    };
    render(
      <HeaderUserProxyDropdownItem
        profileProxy={cdnProfile as any}
        activeProfileProxy={null}
        onActivateProfileProxy={jest.fn()}
      />
    );
    expect(getRequestedImageSrc(screen.getByAltText("alice avatar"))).toContain(
      scaledAvatarPath(ImageScale.W_AUTO_H_50)
    );
  });

  it("deactivates proxy when active", async () => {
    const activate = jest.fn();
    render(
      <HeaderUserProxyDropdownItem
        profileProxy={profile as any}
        activeProfileProxy={profile as any}
        onActivateProfileProxy={activate}
      />
    );
    const btn = screen.getByRole("button");
    await userEvent.click(btn);
    expect(activate).toHaveBeenCalledWith(null);
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });
});

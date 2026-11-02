import { render, screen } from "@testing-library/react";
import ArtistPill from "@/components/home/now-minting/ArtistPill";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: null }),
}));

describe("ArtistPill", () => {
  it("requests the AUTOx50 derivative of a CDN profile picture", () => {
    render(<ArtistPill label="artist" pfp={CDN_AVATAR_URL} />);
    expect(getRequestedImageSrc(screen.getByAltText("artist"))).toContain(
      scaledAvatarPath(ImageScale.W_AUTO_H_50)
    );
  });

  it("shows a placeholder without a profile picture", () => {
    render(<ArtistPill label="artist" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("artist")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { ArtistPreviewModalHeader } from "@/components/waves/drops/ArtistPreviewModalHeader";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

const renderHeader = (pfp: string | null) =>
  render(
    <ArtistPreviewModalHeader
      user={{ handle: "artist", pfp } as ApiProfileMin}
      onClose={jest.fn()}
      currentContentType="active"
      submissionCount={2}
      trophyCount={0}
    />
  );

describe("ArtistPreviewModalHeader", () => {
  it("requests the AUTOx50 derivative of a CDN profile picture", () => {
    renderHeader(CDN_AVATAR_URL);
    expect(getRequestedImageSrc(screen.getByAltText("Profile"))).toContain(
      scaledAvatarPath(ImageScale.W_AUTO_H_50)
    );
  });

  it("omits the image when the artist has no profile picture", () => {
    renderHeader(null);
    expect(screen.queryByAltText("Profile")).not.toBeInTheDocument();
    expect(screen.getByText("artist's Submissions")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import HeaderSearchModalPfp from "@/components/header/header-search/HeaderSearchModalPfp";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

const mockResolved = { data: null as string | null };
jest.mock("@/hooks/useResolvedIpfsUrl", () => ({
  useResolvedIpfsUrl: () => mockResolved,
}));

describe("HeaderSearchModalPfp", () => {
  it("shows the level while the picture is unresolved", () => {
    mockResolved.data = null;
    render(<HeaderSearchModalPfp level={12} src={CDN_AVATAR_URL} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("requests the 200x200 derivative of a CDN profile picture", () => {
    mockResolved.data = CDN_AVATAR_URL;
    render(
      <HeaderSearchModalPfp level={12} src={CDN_AVATAR_URL} alt="alice" />
    );
    expect(getRequestedImageSrc(screen.getByAltText("alice"))).toContain(
      scaledAvatarPath(ImageScale.W_200_H_200)
    );
  });
});

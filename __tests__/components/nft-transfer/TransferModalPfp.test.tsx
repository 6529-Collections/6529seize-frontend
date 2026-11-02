import { render, screen, waitFor } from "@testing-library/react";

import TransferModalPfp from "@/components/nft-transfer/TransferModalPfp";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

const mockUseResolvedIpfsUrl = jest.fn();
jest.mock("@/hooks/useResolvedIpfsUrl", () => ({
  useResolvedIpfsUrl: (...args: unknown[]) => mockUseResolvedIpfsUrl(...args),
}));

const renderTransferModalPfp = (level: number, src: string | null) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TransferModalPfp level={level} src={src} alt="Profile" />
    </QueryClientProvider>
  );
};

describe("TransferModalPfp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a level badge while the image is loading", () => {
    mockUseResolvedIpfsUrl.mockReturnValue({ data: null });

    renderTransferModalPfp(82, null);

    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("loads and displays the resolved image", async () => {
    mockUseResolvedIpfsUrl.mockReturnValue({
      data: "https://cdn.test/pfp.png",
    });

    renderTransferModalPfp(45, "ipfs://hash");

    await waitFor(() =>
      expect(screen.getByAltText("Profile")).toBeInTheDocument()
    );
  });

  it("requests the 200x200 derivative of a CDN profile picture", () => {
    mockUseResolvedIpfsUrl.mockReturnValue({ data: CDN_AVATAR_URL });

    renderTransferModalPfp(45, CDN_AVATAR_URL);

    expect(getRequestedImageSrc(screen.getByAltText("Profile"))).toContain(
      scaledAvatarPath(ImageScale.W_200_H_200)
    );
  });
});

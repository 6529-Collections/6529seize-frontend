import { render, screen, waitFor } from "@testing-library/react";

import TransferModalPfp from "@/components/nft-transfer/TransferModalPfp";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
});

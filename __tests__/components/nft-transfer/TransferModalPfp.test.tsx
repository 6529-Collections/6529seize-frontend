import { render, screen, waitFor } from "@testing-library/react";

import TransferModalPfp from "@/components/nft-transfer/TransferModalPfp";

const mockResolveIpfsUrl = jest.fn();
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrl: (...args: unknown[]) => mockResolveIpfsUrl(...args),
}));

describe("TransferModalPfp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a level badge while the image is loading", () => {
    mockResolveIpfsUrl.mockResolvedValue(null);

    render(<TransferModalPfp level={82} src={null} />);

    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("loads and displays the resolved image", async () => {
    mockResolveIpfsUrl.mockResolvedValue("https://cdn.test/pfp.png");

    render(<TransferModalPfp level={45} src="ipfs://hash" alt="Profile" />);

    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Profile" })).toBeInTheDocument()
    );
  });
});

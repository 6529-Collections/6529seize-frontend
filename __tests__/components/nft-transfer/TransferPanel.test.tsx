import { fireEvent, render, screen } from "@testing-library/react";

import TransferPanel from "@/components/nft-transfer/TransferPanel";

jest.mock("@/components/nft-transfer/TransferState", () => ({
  useTransfer: jest.fn(),
}));
jest.mock("@/components/nft-transfer/TransferModal", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({ isConnected: true })),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt = "", src, ...rest }: any) => {
    const { fill, ...other } = rest;
    return <img src={src} alt={alt} {...other} />;
  },
}));

const mockUseTransfer = require("@/components/nft-transfer/TransferState")
  .useTransfer as jest.Mock;
const mockTransferModal = require("@/components/nft-transfer/TransferModal")
  .default as jest.Mock;

describe("TransferPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis.HTMLElement.prototype as any).scrollTo = jest.fn();
  });

  it("renders nothing when transfer is disabled", () => {
    mockUseTransfer.mockReturnValue({
      enabled: false,
      selected: new Map(),
      clear: jest.fn(),
      setEnabled: jest.fn(),
    });
    const { container } = render(<TransferPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows empty state and disables continue button without items", () => {
    const clear = jest.fn();
    const setEnabled = jest.fn();
    mockUseTransfer.mockReturnValue({
      enabled: true,
      selected: new Map(),
      count: 0,
      totalQty: 0,
      clear,
      setEnabled,
    });

    render(<TransferPanel />);

    expect(screen.getByText(/select some nfts to transfer/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /continue/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(setEnabled).toHaveBeenCalledWith(false);
    expect(clear).toHaveBeenCalled();
  });

  it("lists selected items and clears them when requested", () => {
    const clear = jest.fn();
    const setEnabled = jest.fn();
    const decQty = jest.fn();
    const incQty = jest.fn();
    const unselect = jest.fn();

    const selected = new Map([
      [
        "MEMES:1",
        {
          key: "MEMES:1",
          title: "Card 1",
          thumbUrl: "https://example.com/thumb.png",
          qty: 2,
          max: 3,
        },
      ],
    ]);

    mockUseTransfer.mockReturnValue({
      enabled: true,
      selected,
      count: 1,
      totalQty: 1,
      clear,
      setEnabled,
      incQty,
      decQty,
      unselect,
    });

    render(<TransferPanel />);

    const expandButton = screen.getByLabelText("Expand panel");
    fireEvent.click(expandButton);

    expect(screen.getByText("Card 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(unselect).toHaveBeenCalledWith("MEMES:1");

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(mockTransferModal).toHaveBeenCalled();
  });
});

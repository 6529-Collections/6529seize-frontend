import { fireEvent, render, screen } from "@testing-library/react";

import TransferToggle from "@/components/nft-transfer/TransferToggle";

jest.mock("@/components/nft-transfer/TransferState", () => ({
  useTransfer: jest.fn(),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isMobileDevice: false })),
}));

import useDeviceInfo from "@/hooks/useDeviceInfo";

const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;

const mockUseTransfer = require("@/components/nft-transfer/TransferState")
  .useTransfer as jest.Mock;
const mockUseSeize = require("@/components/auth/SeizeConnectContext")
  .useSeizeConnectContext as jest.Mock;

describe("TransferToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDeviceInfoMock.mockReturnValue({ isMobileDevice: false } as any);
  });

  test("returns null when rendered on mobile device", () => {
    useDeviceInfoMock.mockReturnValue({ isMobileDevice: true } as any);
    const transferState = {
      enabled: false,
      setEnabled: jest.fn(),
      clear: jest.fn(),
      toggle: jest.fn(),
    };
    const seizeState = {
      isConnected: false,
      seizeConnect: jest.fn(),
      seizeConnectOpen: false,
    };

    mockUseTransfer.mockImplementation(() => transferState);
    mockUseSeize.mockImplementation(() => seizeState);

    const { container } = render(<TransferToggle />);
    expect(container.firstChild).toBeNull();
  });

  it("requests connection before enabling transfer", () => {
    const transferState = {
      enabled: false,
      setEnabled: jest.fn(),
      clear: jest.fn(),
      toggle: jest.fn(),
    };
    const seizeState = {
      isConnected: false,
      seizeConnect: jest.fn(),
      seizeConnectOpen: false,
    };

    mockUseTransfer.mockImplementation(() => transferState);
    mockUseSeize.mockImplementation(() => seizeState);

    const { rerender } = render(<TransferToggle />);

    fireEvent.click(screen.getByRole("button", { name: /transfer/i }));
    expect(seizeState.seizeConnect).toHaveBeenCalled();
    expect(transferState.setEnabled).not.toHaveBeenCalledWith(true);

    seizeState.isConnected = true;
    rerender(<TransferToggle />);

    expect(transferState.setEnabled).toHaveBeenCalledWith(true);
  });

  it("disables transfer and clears selections when toggled off", () => {
    const transferState = {
      enabled: true,
      setEnabled: jest.fn(),
      clear: jest.fn(),
      toggle: jest.fn(),
    };

    mockUseTransfer.mockImplementation(() => transferState);
    mockUseSeize.mockImplementation(() => ({
      isConnected: true,
      seizeConnect: jest.fn(),
      seizeConnectOpen: false,
    }));

    render(<TransferToggle />);

    fireEvent.click(screen.getByRole("button", { name: /exit transfer/i }));
    expect(transferState.setEnabled).toHaveBeenCalledWith(false);
    expect(transferState.clear).toHaveBeenCalled();
  });
});

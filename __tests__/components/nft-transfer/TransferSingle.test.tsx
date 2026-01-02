import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/styles/Home.module.scss", () => ({ shadowBox: "shadowBox" }));

jest.mock("@/enums", () => ({
  ContractType: { ERC721: "ERC721", ERC1155: "ERC1155" },
}));

jest.mock("@/entities/IProfile", () => ({
  COLLECTED_COLLECTION_TYPE_TO_CONTRACT: {
    MEMES: "0xCONTRACT_MEMES",
    NEXTGEN: "0xCONTRACT_NEXTGEN",
  },
  COLLECTED_COLLECTION_TYPE_TO_CONTRACT_TYPE: {
    MEMES: "ERC721",
    NEXTGEN: "ERC1155",
  },
  CollectedCollectionType: {} as any,
}));

let mockSelected = new Map<string, { qty?: number | undefined; max?: number | undefined }>();
const mockFns = {
  select: jest.fn(),
  unselect: jest.fn(),
  incQty: jest.fn(),
  decQty: jest.fn(),
  setQty: jest.fn(),
  toggleSelect: jest.fn(),
  clear: jest.fn(),
  setEnabled: jest.fn(),
};

jest.mock("@/components/nft-transfer/TransferState", () => {
  return {
    __esModule: true,
    TransferProvider: ({ children }: any) => <>{children}</>,
    useTransfer: () => ({
      selected: mockSelected,
      select: mockFns.select,
      unselect: mockFns.unselect,
      incQty: mockFns.incQty,
      decQty: mockFns.decQty,
      setQty: mockFns.setQty,
      toggleSelect: mockFns.toggleSelect,
      clear: mockFns.clear,
      setEnabled: mockFns.setEnabled,
      totalQty: 1,
      count: 1,
    }),
    buildTransferKey: ({ collection, tokenId }: any) =>
      `${collection}:${tokenId}`,
  };
});

jest.mock("@/components/nft-transfer/TransferModal", () => ({
  __esModule: true,
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    <button
      type="button"
      data-testid="transfer-modal"
      data-open={open}
      aria-expanded={open}
      onClick={onClose}>
      {open ? "OPEN" : "CLOSED"}
    </button>
  ),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => {
  const state = { isConnected: true, seizeConnectOpen: false };
  const seizeConnect = jest.fn(() => {
    state.seizeConnectOpen = true;
  });
  return {
    __esModule: true,
    useSeizeConnectContext: () => ({
      isConnected: state.isConnected,
      seizeConnect,
      seizeConnectOpen: state.seizeConnectOpen,
    }),
    __state: state,
    __seizeConnect: seizeConnect,
  };
});

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isMobileDevice: false })),
}));

import TransferSingle from "@/components/nft-transfer/TransferSingle";
import { ContractType } from "@/enums";
import useDeviceInfo from "@/hooks/useDeviceInfo";

const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;

const resetAll = () => {
  mockFns.select.mockReset();
  mockFns.unselect.mockReset();
  mockFns.incQty.mockReset();
  mockFns.decQty.mockReset();
  mockFns.setQty.mockReset();
  mockFns.toggleSelect.mockReset();
  mockFns.clear.mockReset();
  mockFns.setEnabled.mockReset();
  mockSelected = new Map();
  const connectMod = require("@/components/auth/SeizeConnectContext");
  connectMod.__state.isConnected = true;
  connectMod.__state.seizeConnectOpen = false;
  connectMod.__seizeConnect.mockReset();
  useDeviceInfoMock.mockReturnValue({ isMobileDevice: false } as any);
};

const baseProps = {
  collectionType: "MEMES" as any,
  contractType: ContractType.ERC721,
  contract: "0xCONTRACT_MEMES",
  tokenId: 1,
  title: "The Memes #1",
  max: 1,
  thumbUrl: "https://example.com/img.jpg",
};

describe("TransferSingle", () => {
  beforeEach(resetAll);
  afterEach(cleanup);

  test("renders basic structure (ERC721) and button reads 'Transfer'", () => {
    render(<TransferSingle {...baseProps} />);
    expect(screen.getByTestId("transfer-single")).toBeInTheDocument();
    expect(screen.getByTestId("transfer-single-submit")).toHaveTextContent(
      "Transfer"
    );
  });

  test("returns null when rendered on mobile device", () => {
    useDeviceInfoMock.mockReturnValue({ isMobileDevice: true } as any);
    const { container } = render(<TransferSingle {...baseProps} />);
    expect(container.firstChild).toBeNull();
  });

  test("calls select on mount and unselect on unmount", () => {
    const { unmount } = render(<TransferSingle {...baseProps} />);
    const expectedKey = `${baseProps.collectionType}:${baseProps.tokenId}`;
    expect(mockFns.select).toHaveBeenCalledWith(
      expect.objectContaining({
        key: expectedKey,
        contract: "0xCONTRACT_MEMES",
        contractType: "ERC721",
      })
    );
    unmount();
    expect(mockFns.unselect).toHaveBeenCalledWith(expectedKey);
  });

  test("hides +/- controls when max = 1", () => {
    render(<TransferSingle {...baseProps} />);
    expect(
      screen.queryByTestId("transfer-single-minus")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("transfer-single-plus")
    ).not.toBeInTheDocument();
  });

  test("renders +/- controls when max > 1 and handles bounds", () => {
    const props = { ...baseProps, max: 5, contractType: ContractType.ERC1155 };
    const key = `${props.collectionType}:${props.tokenId}`;
    mockSelected = new Map([[key, { qty: 1, max: 5 }]]);
    render(<TransferSingle {...props} />);
    const minus = screen.getByTestId("transfer-single-minus");
    const plus = screen.getByTestId("transfer-single-plus");
    expect(minus).toBeDisabled();
    expect(plus).toBeEnabled();
    cleanup();
    resetAll();
    mockSelected = new Map([[key, { qty: 5, max: 5 }]]);
    render(<TransferSingle {...props} />);
    const minus2 = screen.getByTestId("transfer-single-minus");
    const plus2 = screen.getByTestId("transfer-single-plus");
    expect(minus2).toBeEnabled();
    expect(plus2).toBeDisabled();
  });

  test("clicking + and - triggers incQty and decQty", () => {
    const props = { ...baseProps, max: 3, contractType: ContractType.ERC1155 };
    const key = `${props.collectionType}:${props.tokenId}`;
    mockSelected = new Map([[key, { qty: 2, max: 3 }]]);
    render(<TransferSingle {...props} />);
    const minus = screen.getByTestId("transfer-single-minus");
    const plus = screen.getByTestId("transfer-single-plus");
    fireEvent.click(minus);
    fireEvent.click(plus);
    expect(mockFns.decQty).toHaveBeenCalledWith(key);
    expect(mockFns.incQty).toHaveBeenCalledWith(key);
  });

  test("button label for ERC1155 reflects selected qty (copies)", () => {
    const props = { ...baseProps, max: 10, contractType: ContractType.ERC1155 };
    const key = `${props.collectionType}:${props.tokenId}`;
    mockSelected = new Map([[key, { qty: 3, max: 10 }]]);
    render(<TransferSingle {...props} />);
    expect(screen.getByTestId("transfer-single-submit")).toHaveTextContent(
      "Transfer 3 copies"
    );
  });

  test("opens modal immediately when already connected", () => {
    const connectMod = require("@/components/auth/SeizeConnectContext");
    connectMod.__state.isConnected = true;
    render(<TransferSingle {...baseProps} />);
    const modal = screen.getByTestId("transfer-modal");
    expect(modal).toHaveAttribute("data-open", "false");
    fireEvent.click(screen.getByTestId("transfer-single-submit"));
    expect(screen.getByTestId("transfer-modal")).toHaveAttribute(
      "data-open",
      "true"
    );
  });

  test("connect-first flow: click triggers seizeConnect, modal opens after connection", () => {
    const connectMod = require("@/components/auth/SeizeConnectContext");
    connectMod.__state.isConnected = false;
    connectMod.__state.seizeConnectOpen = false;
    const { rerender } = render(<TransferSingle {...baseProps} />);
    const modal = screen.getByTestId("transfer-modal");
    expect(modal).toHaveAttribute("data-open", "false");
    fireEvent.click(screen.getByTestId("transfer-single-submit"));
    expect(connectMod.__seizeConnect).toHaveBeenCalled();
    expect(screen.getByTestId("transfer-modal")).toHaveAttribute(
      "data-open",
      "false"
    );
    connectMod.__state.isConnected = true;
    connectMod.__state.seizeConnectOpen = false;
    rerender(<TransferSingle {...baseProps} />);
    expect(screen.getByTestId("transfer-modal")).toHaveAttribute(
      "data-open",
      "true"
    );
  });

  test("rerender with new tokenId updates select key", () => {
    const { rerender } = render(<TransferSingle {...baseProps} />);
    const firstKey = `${baseProps.collectionType}:${baseProps.tokenId}`;
    expect(mockFns.select).toHaveBeenCalledWith(
      expect.objectContaining({ key: firstKey })
    );
    rerender(<TransferSingle {...baseProps} tokenId={99} />);
    expect(mockFns.select).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: `${baseProps.collectionType}:99` })
    );
  });
});

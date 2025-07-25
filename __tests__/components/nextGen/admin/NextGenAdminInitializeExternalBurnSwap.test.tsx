// @ts-nocheck
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NextGenAdminInitializeExternalBurnSwap from "../../../../components/nextGen/admin/NextGenAdminInitializeExternalBurnSwap";

jest.mock(
  "../../../../components/nextGen/NextGenContractWriteStatus",
  () => () => <div data-testid="write-status" />
);
jest.mock("../../../../components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("../../../../services/6529api", () => ({ postData: jest.fn() }));
jest.mock("../../../../components/nextGen/nextgen_helpers", () => ({
  useGlobalAdmin: jest.fn(),
  useFunctionAdmin: jest.fn(),
  useCollectionIndex: jest.fn(),
  useCollectionAdmin: jest.fn(),
  getCollectionIdsForAddress: jest.fn(),
  useMinterContractWrite: jest.fn(),
  useParsedCollectionIndex: jest.fn(),
}));
jest.mock("uuid", () => ({ v4: () => "uuid" }));
jest.mock("wagmi", () => ({ useSignMessage: jest.fn() }));

import { useSeizeConnectContext } from "../../../../components/auth/SeizeConnectContext";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  useMinterContractWrite,
  useParsedCollectionIndex,
} from "../../../../components/nextGen/nextgen_helpers";
import { useSignMessage } from "wagmi";

const signMessageState: any = {
  signMessage: jest.fn(),
  reset: jest.fn(),
  isError: false,
  isSuccess: false,
  data: undefined,
};
const contractWriteState: any = {
  writeContract: jest.fn(),
  reset: jest.fn(),
  params: {},
  isLoading: false,
  isSuccess: false,
  isError: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0x1" });
  (useGlobalAdmin as jest.Mock).mockReturnValue({ data: true });
  (useFunctionAdmin as jest.Mock).mockReturnValue({ data: true });
  (useCollectionIndex as jest.Mock).mockReturnValue({ data: 3 });
  (useParsedCollectionIndex as jest.Mock).mockReturnValue(3);
  (useCollectionAdmin as jest.Mock).mockReturnValue({ data: [] });
  (getCollectionIdsForAddress as jest.Mock).mockReturnValue(["1"]);
  (useSignMessage as jest.Mock).mockReturnValue(signMessageState);
  (useMinterContractWrite as jest.Mock).mockReturnValue(contractWriteState);
  process.env.API_ENDPOINT = "https://test.6529.io";
});

function renderComponent() {
  return render(<NextGenAdminInitializeExternalBurnSwap close={() => {}} />);
}

test("shows validation errors when missing fields", () => {
  renderComponent();
  fireEvent.click(screen.getByText("Submit"));
  expect(screen.getByText("ERC721 Collection is required")).toBeInTheDocument();
  expect(
    screen.getByText("Burn Collection ID is required")
  ).toBeInTheDocument();
});

test("calls signMessage when form valid", async () => {
  const user = userEvent.setup();
  renderComponent();
  const inputs = screen.getAllByRole("textbox");
  await user.type(inputs[0], "erc");
  await user.type(inputs[1], "1");
  const select = screen.getByRole("combobox");
  await user.selectOptions(select, "1");
  await user.type(screen.getAllByRole("textbox")[2], "1");
  await user.type(screen.getAllByRole("textbox")[3], "2");
  await user.type(screen.getAllByRole("textbox")[4], "addr");
  fireEvent.click(screen.getByText("Submit"));
  expect(signMessageState.signMessage).toHaveBeenCalledWith({
    message: "uuid",
  });
});

// @ts-nocheck
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NextGenAdminInitializeExternalBurnSwap from "@/components/nextGen/admin/NextGenAdminInitializeExternalBurnSwap";

jest.mock("@/components/nextGen/NextGenContractWriteStatus", () => () => (
  <div data-testid="write-status" />
));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/services/6529api", () => ({ postData: jest.fn() }));
jest.mock("@/components/nextGen/nextgen_helpers", () => ({
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

import { useSignMessage } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { postData } from "@/services/6529api";
import {
  getCollectionIdsForAddress,
  useCollectionAdmin,
  useCollectionIndex,
  useFunctionAdmin,
  useGlobalAdmin,
  useMinterContractWrite,
  useParsedCollectionIndex,
} from "@/components/nextGen/nextgen_helpers";

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
  signMessageState.isError = false;
  signMessageState.isSuccess = false;
  signMessageState.data = undefined;
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0x1" });
  (useGlobalAdmin as jest.Mock).mockReturnValue({ data: true });
  (useFunctionAdmin as jest.Mock).mockReturnValue({ data: true });
  (useCollectionIndex as jest.Mock).mockReturnValue({ data: 3 });
  (useParsedCollectionIndex as jest.Mock).mockReturnValue(3);
  (useCollectionAdmin as jest.Mock).mockReturnValue({ data: [] });
  (getCollectionIdsForAddress as jest.Mock).mockReturnValue(["1"]);
  (useSignMessage as jest.Mock).mockReturnValue(signMessageState);
  (useMinterContractWrite as jest.Mock).mockReturnValue(contractWriteState);
});

function renderComponent() {
  return render(<NextGenAdminInitializeExternalBurnSwap close={() => {}} />);
}

async function fillValidForm() {
  const user = userEvent.setup();
  const inputs = screen.getAllByRole("textbox");
  await user.type(inputs[0], "erc");
  await user.type(inputs[1], "1");
  await user.selectOptions(screen.getByRole("combobox"), "1");
  await user.type(screen.getAllByRole("textbox")[2], "1");
  await user.type(screen.getAllByRole("textbox")[3], "2");
  await user.type(screen.getAllByRole("textbox")[4], "addr");
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
  renderComponent();
  await fillValidForm();
  fireEvent.click(screen.getByText("Submit"));
  expect(signMessageState.signMessage).toHaveBeenCalledWith({
    message: expect.stringContaining("Nonce: uuid"),
  });
  const signedMessage = signMessageState.signMessage.mock.calls[0][0].message;
  expect(signedMessage).toEqual(expect.stringContaining("6529 Action"));
  expect(signedMessage).toEqual(
    expect.stringContaining("Action: nextgen_admin")
  );
  expect(signedMessage).toEqual(expect.stringContaining("Payload Hash:"));
  expect(signedMessage).toEqual(
    expect.stringContaining(
      "Purpose: Sign this message to perform a 6529 NextGen admin action."
    )
  );
});

test("submits the address that signed even if the active wallet changes", async () => {
  (postData as jest.Mock).mockResolvedValue({ status: 200, response: {} });
  const { rerender } = renderComponent();

  await fillValidForm();
  fireEvent.click(screen.getByText("Submit"));

  expect(signMessageState.signMessage).toHaveBeenCalled();

  (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0x2" });
  signMessageState.isSuccess = true;
  signMessageState.data = "signed-message";
  rerender(<NextGenAdminInitializeExternalBurnSwap close={() => {}} />);

  await waitFor(() => expect(postData).toHaveBeenCalled());
  expect((postData as jest.Mock).mock.calls[0][1]).toMatchObject({
    wallet: "0x1",
    signature: "signed-message",
  });
});

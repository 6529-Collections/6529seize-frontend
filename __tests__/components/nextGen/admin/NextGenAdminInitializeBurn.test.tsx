// @ts-nocheck
import NextGenAdminInitializeBurn from "@/components/nextGen/admin/NextGenAdminInitializeBurn";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  useParsedCollectionIndex: jest.fn(),
  getCollectionIdsForAddress: jest.fn(),
  useMinterContractWrite: jest.fn(),
}));

jest.mock("uuid", () => ({ v4: () => "test-uuid" }));

jest.mock("wagmi", () => ({
  useReadContract: jest.fn(),
  useSignTypedData: jest.fn(),
}));
jest.mock("@/services/signing/privileged-action-challenge", () => ({
  getPrivilegedActionChallenge: jest.fn(() =>
    Promise.resolve({
      nonce: "nonce",
      expiresAt: 123,
      serverSignature: "serverSig",
    })
  ),
}));

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  getCollectionIdsForAddress,
  useCollectionAdmin,
  useCollectionIndex,
  useFunctionAdmin,
  useGlobalAdmin,
  useMinterContractWrite,
  useParsedCollectionIndex,
} from "@/components/nextGen/nextgen_helpers";
import { postData } from "@/services/6529api";
import { useReadContract, useSignTypedData } from "wagmi";

const signMessageState: any = {
  signTypedDataAsync: jest.fn(() => Promise.resolve("sig")),
  reset: jest.fn(),
};

const contractWriteState: any = {
  writeContract: jest.fn(),
  reset: jest.fn(),
  params: {
    address: "0xabc",
    abi: [],
    chainId: 1,
    functionName: "initializeBurn",
  },
  isLoading: false,
  isSuccess: false,
  isError: false,
  data: undefined,
  error: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    address: "0x0000000000000000000000000000000000000001",
  });
  (useGlobalAdmin as jest.Mock).mockReturnValue({ data: true });
  (useFunctionAdmin as jest.Mock).mockReturnValue({ data: true });
  (useCollectionIndex as jest.Mock).mockReturnValue({ data: 3 });
  (useParsedCollectionIndex as jest.Mock).mockReturnValue(3);
  (useCollectionAdmin as jest.Mock).mockReturnValue({ data: [] });
  (getCollectionIdsForAddress as jest.Mock).mockReturnValue(["1", "2"]);
  (useSignTypedData as jest.Mock).mockImplementation(() => signMessageState);
  (useReadContract as jest.Mock).mockReturnValue({ data: false });
  (useMinterContractWrite as jest.Mock).mockReturnValue(contractWriteState);
});

function renderComponent() {
  return render(<NextGenAdminInitializeBurn close={() => {}} />);
}

test("shows validation errors when required fields missing", () => {
  renderComponent();
  fireEvent.click(screen.getByText("Submit"));
  expect(
    screen.getByText("Burn Collection id is required")
  ).toBeInTheDocument();
  expect(
    screen.getByText("Mint Collection id is required")
  ).toBeInTheDocument();
});

test("calls signMessage when form is valid", async () => {
  const user = userEvent.setup();
  renderComponent();
  const selects = screen.getAllByRole("combobox");
  await user.selectOptions(selects[0], "1");
  await user.selectOptions(selects[1], "2");
  const radios = screen.getAllByRole("radio");
  await user.click(radios[0]);
  await user.click(screen.getByText("Submit"));
  await waitFor(() =>
    expect(signMessageState.signTypedDataAsync).toHaveBeenCalled()
  );
});

test("writes contract after successful sign message and api call", async () => {
  (postData as jest.Mock).mockResolvedValue({ status: 200, response: {} });
  const user = userEvent.setup();
  renderComponent();
  const selects = screen.getAllByRole("combobox");
  await user.selectOptions(selects[0], "1");
  await user.selectOptions(selects[1], "2");
  const radios = screen.getAllByRole("radio");
  await user.click(radios[0]);
  await act(async () => {
    fireEvent.click(screen.getByText("Submit"));
  });
  await waitFor(() => expect(postData).toHaveBeenCalled());
  await waitFor(() =>
    expect(contractWriteState.writeContract).toHaveBeenCalledWith({
      ...contractWriteState.params,
      args: ["1", "2", true],
    })
  );
});

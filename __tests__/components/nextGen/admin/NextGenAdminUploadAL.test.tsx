import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import NextGenAdminUploadAL from "@/components/nextGen/admin/NextGenAdminUploadAL";
import { useSignMessage } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { postFormData } from "@/services/6529api";

jest.mock("wagmi", () => ({ useSignMessage: jest.fn() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  useGlobalAdmin: () => ({ data: true }),
  useFunctionAdmin: () => ({ data: true }),
  useCollectionIndex: () => ({}),
  useCollectionAdmin: () => ({ data: [] }),
  getCollectionIdsForAddress: () => ["1"],
  useParsedCollectionIndex: () => [],
}));
jest.mock("@/services/6529api", () => ({
  postFormData: jest.fn(() =>
    Promise.resolve({ status: 200, response: { merkle_root: "x" } })
  ),
}));

const signMessageState = {
  signMessage: jest.fn(),
  reset: jest.fn(),
  isError: false,
  isSuccess: false,
  data: undefined as string | undefined,
};

function fillValidUploadForm() {
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
  fireEvent.change(screen.getByPlaceholderText("...Phase name"), {
    target: { value: "p" },
  });
  const fileInput = document.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  fireEvent.change(fileInput, {
    target: { files: [new File(["a"], "a.csv", { type: "text/csv" })] },
  });
  fireEvent.change(screen.getAllByPlaceholderText("Unix epoch time")[0], {
    target: { value: "1" },
  });
  fireEvent.change(screen.getAllByPlaceholderText("Unix epoch time")[1], {
    target: { value: "2" },
  });
  fireEvent.change(screen.getByPlaceholderText("...0.06529"), {
    target: { value: "0.1" },
  });
}

describe("NextGenAdminUploadAL", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signMessageState.isError = false;
    signMessageState.isSuccess = false;
    signMessageState.data = undefined;
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0x1" });
    (useSignMessage as jest.Mock).mockReturnValue(signMessageState);
  });

  it("changes type when selecting radio", () => {
    render(<NextGenAdminUploadAL close={() => {}} />);
    const radios = screen.getAllByRole("radio");
    // The second radio button should be "No Allowlist" based on the order in the component
    const noAl = radios[1];
    fireEvent.click(noAl);
    expect((noAl as HTMLInputElement).checked).toBe(true);
  });

  it("upload button disabled when required fields missing", () => {
    render(<NextGenAdminUploadAL close={() => {}} />);
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
  });

  it("calls signMessage when uploading", () => {
    render(<NextGenAdminUploadAL close={() => {}} />);
    fillValidUploadForm();
    const button = screen.getByRole("button", { name: "Upload" });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(signMessageState.signMessage).toHaveBeenCalled();
  });

  it("submits the address that signed even if the active wallet changes", async () => {
    const { rerender } = render(<NextGenAdminUploadAL close={() => {}} />);
    fillValidUploadForm();
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(signMessageState.signMessage).toHaveBeenCalled();

    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0x2" });
    signMessageState.isSuccess = true;
    signMessageState.data = "signed-message";
    rerender(<NextGenAdminUploadAL close={() => {}} />);

    await waitFor(() => expect(postFormData).toHaveBeenCalled());
    const formData = (postFormData as jest.Mock).mock.calls[0][1] as FormData;
    expect(JSON.parse(formData.get("nextgen") as string)).toMatchObject({
      wallet: "0x1",
      signature: "signed-message",
    });
  });
});

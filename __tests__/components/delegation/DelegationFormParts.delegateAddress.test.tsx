import { DelegationFormDelegateAddressFormGroup } from "@/components/delegation/DelegationFormParts";
import { fireEvent, render, screen } from "@testing-library/react";

const RESOLVED = "0x5555555555555555555555555555555555555555";
const PASTED = "0x6666666666666666666666666666666666666666";

jest.mock("wagmi", () => ({
  useEnsName: () => ({ data: "reverse.eth" }),
  useEnsAddress: ({ name }: { name?: string | undefined }) => ({
    data: name === "named.eth" ? RESOLVED : undefined,
    isLoading: false,
  }),
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
}));

function renderAddressInput() {
  const setAddress = jest.fn();
  render(
    <DelegationFormDelegateAddressFormGroup
      setAddress={setAddress}
      title="Delegate Address"
      tooltip="Delegate to Address"
    />
  );
  const input = screen.getByRole("textbox", { name: "Delegate Address" });
  return {
    setAddress,
    enter: (value: string) => fireEvent.change(input, { target: { value } }),
  };
}

describe("delegate address input", () => {
  it("keeps a typed wallet address", () => {
    const { setAddress, enter } = renderAddressInput();
    enter(PASTED);
    expect(setAddress).toHaveBeenLastCalledWith(PASTED);
  });

  it("resolves an ENS name forward", () => {
    const { setAddress, enter } = renderAddressInput();
    enter("named.eth");
    expect(setAddress).toHaveBeenLastCalledWith(RESOLVED);
  });

  it("uses the ENS name, not a pasted wallet suffix", () => {
    const { setAddress, enter } = renderAddressInput();
    enter(`named.eth - ${PASTED}`);
    expect(setAddress).toHaveBeenLastCalledWith(RESOLVED);
    expect(setAddress).not.toHaveBeenCalledWith(PASTED);
  });

  it("does not trust a pasted label that is not an ENS name", () => {
    const { setAddress, enter } = renderAddressInput();
    enter(`My hot wallet - ${PASTED}`);
    expect(setAddress).toHaveBeenLastCalledWith("");
    expect(setAddress).not.toHaveBeenCalledWith(PASTED);
  });
});

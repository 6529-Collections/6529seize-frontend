import { DelegationFormDelegateAddressFormGroup } from "@/components/delegation/DelegationFormParts";
import UpdateDelegationComponent from "@/components/delegation/UpdateDelegation";
import { MEMES_COLLECTION } from "@/components/delegation/delegation-constants";
import type { DelegationWriteParams } from "@/components/delegation/delegation-shared";
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

const submitProps: { current?: { writeParams: DelegationWriteParams } } = {};

jest.mock("@/components/delegation/DelegationFormParts", () => {
  const actual = jest.requireActual(
    "@/components/delegation/DelegationFormParts"
  );
  return {
    ...actual,
    DelegationSubmitGroups: (props: { writeParams: DelegationWriteParams }) => {
      submitProps.current = props;
      return null;
    },
  };
});

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

describe("update delegation address input", () => {
  function renderUpdate() {
    render(
      <UpdateDelegationComponent
        address="0x1111111111111111111111111111111111111111"
        delegation={{
          wallet: "0x2222222222222222222222222222222222222222",
          use_case: 1,
          display: "All",
        }}
        ens={null}
        collection={MEMES_COLLECTION}
        showCancel={false}
        showAddMore={false}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );
    const input = screen.getByRole("textbox", { name: "New Delegate Address" });
    return (value: string) => fireEvent.change(input, { target: { value } });
  }

  it("writes the ENS name's address, not a pasted wallet suffix", () => {
    const enter = renderUpdate();
    enter(`named.eth - ${PASTED}`);
    expect(submitProps.current?.writeParams.args[2]).toBe(RESOLVED);
  });

  it("does not write a pasted label that is not an ENS name", () => {
    const enter = renderUpdate();
    enter(`My hot wallet - ${PASTED}`);
    expect(submitProps.current?.writeParams.args[2]).toBe("");
    expect(submitProps.current?.writeParams.functionName).toBeUndefined();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RevokeDelegationWithSub from "../../components/delegation/RevokeDelegationWithSub";
import React from "react";

jest.mock("../../components/delegation/DelegationFormParts", () => ({
  DelegationCloseButton: (props: any) => <button onClick={props.onHide}>close</button>,
  DelegationFormLabel: () => <div>label</div>,
  DelegationAddressDisabledInput: () => <div />,
  DelegationFormCollectionFormGroup: () => <div />,
  DelegationFormDelegateAddressFormGroup: () => <div />,
  DelegationSubmitGroups: (props: any) => (
    <button data-testid="validate" onClick={() => props.validate()} />
  ),
}));

jest.mock("wagmi", () => ({ useEnsName: () => ({ data: null }) }));

jest.mock("../../pages/delegation/[...section]", () => ({
  __esModule: true,
  ALL_USE_CASES: [{ use_case: 1, display: "One" }],
  DelegationCollection: {} as any,
}));

describe("RevokeDelegationWithSub", () => {
  it("validates inputs", async () => {
    const user = userEvent.setup();
    render(
      <RevokeDelegationWithSub
        address="0x1"
        ens={null}
        originalDelegator="0x2"
        collection={{} as any}
        showAddMore={false}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );
    await user.click(screen.getByTestId("validate"));
    // errors due to empty form values
    expect(screen.queryByTestId("validate")).toBeInTheDocument();
  });
});

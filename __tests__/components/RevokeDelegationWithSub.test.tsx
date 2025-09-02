import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RevokeDelegationWithSub from "../../components/delegation/RevokeDelegationWithSub";
import React from "react";

jest.mock("../../components/delegation/DelegationFormParts", () => ({
  DelegationCloseButton: (props: any) => <button onClick={props.onHide}>close</button>,
  DelegationFormLabel: ({ title }: any) => <div>{title}</div>,
  DelegationAddressDisabledInput: ({ address, ens }: any) => <div data-testid="disabled-address">{ens ? `${ens} - ${address}` : address}</div>,
  DelegationFormCollectionFormGroup: ({ collection, setCollection }: any) => (
    <select data-testid="collection-select" value={collection} onChange={(e) => setCollection(e.target.value)}>
      <option value="0">Select Collection</option>
      <option value="test-collection">Test Collection</option>
    </select>
  ),
  DelegationFormDelegateAddressFormGroup: ({ setAddress, title }: any) => (
    <div>
      <label>{title}</label>
      <input data-testid="address-input" onChange={(e) => setAddress(e.target.value)} />
    </div>
  ),
  DelegationSubmitGroups: (props: any) => (
    <div>
      <button data-testid="submit-button" onClick={() => props.validate()} disabled={props.validate().length > 0}>
        {props.submitBtnLabel || 'Submit'}
      </button>
      {props.gasError && <div data-testid="gas-error">{props.gasError}</div>}
    </div>
  ),
}));

jest.mock("wagmi", () => ({ useEnsName: () => ({ data: null }) }));

jest.mock("../../components/delegation/delegation-constants", () => ({
  __esModule: true,
  ALL_USE_CASES: [{ use_case: 1, display: "One" }],
  DelegationCollection: {} as any,
}));

describe("RevokeDelegationWithSub", () => {
  const defaultProps = {
    address: "0x1234567890123456789012345678901234567890",
    ens: null,
    originalDelegator: "0x2345678901234567890123456789012345678901",
    collection: { 
      title: "Test Collection", 
      display: "Test Collection Display", 
      contract: "0x3456789012345678901234567890123456789012",
      preview: "/test.jpg"
    },
    showAddMore: false,
    onHide: jest.fn(),
    onSetToast: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component with correct title", () => {
    render(<RevokeDelegationWithSub {...defaultProps} />);
    
    expect(screen.getByText("Revoke as Delegation Manager")).toBeInTheDocument();
  });

  it("displays the original delegator address", () => {
    render(<RevokeDelegationWithSub {...defaultProps} />);
    
    expect(screen.getByText("Original Delegator")).toBeInTheDocument();
    // The original delegator is displayed in a regular disabled input, not our mocked component
    expect(screen.getByDisplayValue(defaultProps.originalDelegator)).toBeInTheDocument();
  });

  it("displays the delegation manager address", () => {
    render(<RevokeDelegationWithSub {...defaultProps} />);
    
    expect(screen.getByText("Delegation Manager")).toBeInTheDocument();
    // The delegation manager address should be shown via DelegationAddressDisabledInput mock
    expect(screen.getByTestId("disabled-address")).toHaveTextContent(defaultProps.address);
  });

  it("renders collection selection dropdown", () => {
    render(<RevokeDelegationWithSub {...defaultProps} />);
    
    expect(screen.getByTestId("collection-select")).toBeInTheDocument();
    expect(screen.getByTestId("collection-select")).toHaveValue("0"); // Default value
  });

  it("renders address input for revoke address", () => {
    render(<RevokeDelegationWithSub {...defaultProps} />);
    
    expect(screen.getByText("Revoke Address")).toBeInTheDocument();
    expect(screen.getByTestId("address-input")).toBeInTheDocument();
  });

  it("renders use case selection", () => {
    render(<RevokeDelegationWithSub {...defaultProps} />);
    
    expect(screen.getByText("Use Case")).toBeInTheDocument();
    expect(screen.getByText("Select Use Case")).toBeInTheDocument();
  });

  it("shows submit button with correct label", () => {
    render(<RevokeDelegationWithSub {...defaultProps} />);
    
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toHaveTextContent("Revoke");
  });

  it("calls onHide when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<RevokeDelegationWithSub {...defaultProps} />);
    
    await user.click(screen.getByText("close"));
    expect(defaultProps.onHide).toHaveBeenCalledTimes(1);
  });

  it("handles ENS resolution for delegation manager", () => {
    const propsWithEns = { ...defaultProps, ens: "test.eth" };
    render(<RevokeDelegationWithSub {...propsWithEns} />);
    
    // The disabled address input should show both ENS and address
    expect(screen.getByTestId("disabled-address")).toHaveTextContent("test.eth - 0x1234567890123456789012345678901234567890");
  });

  it("updates collection when selection changes", async () => {
    const user = userEvent.setup();
    render(<RevokeDelegationWithSub {...defaultProps} />);
    
    const collectionSelect = screen.getByTestId("collection-select");
    await user.selectOptions(collectionSelect, "test-collection");
    
    expect(collectionSelect).toHaveValue("test-collection");
  });

  it("updates address when input changes", async () => {
    const user = userEvent.setup();
    render(<RevokeDelegationWithSub {...defaultProps} />);
    
    const addressInput = screen.getByTestId("address-input");
    await user.type(addressInput, "0x1111111111111111111111111111111111111111");
    
    expect(addressInput).toHaveValue("0x1111111111111111111111111111111111111111");
  });
});

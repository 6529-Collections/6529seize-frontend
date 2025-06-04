import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpdateDelegationComponent from "../../../components/delegation/UpdateDelegation";

jest.mock("wagmi", () => ({ useEnsName: () => ({ data: null }), useEnsAddress: () => ({ data: null }) }));

jest.mock("../../../components/delegation/DelegationFormParts", () => ({
  DelegationCloseButton: () => <div />,
  DelegationFormLabel: (p: any) => <label>{p.title}</label>,
  DelegationAddressDisabledInput: () => <div />,
  DelegationExpiryCalendar: () => <div data-testid="calendar" />,
  DelegationTokenSelection: () => <div data-testid="token-select" />,
  DelegationSubmitGroups: () => <div />,
}));

const baseProps = {
  address: "0x1",
  delegation: { wallet: "0x2", use_case: 1, display: "del" },
  ens: null,
  collection: { contract: "0x3", display: "COL", title: "COL", preview: "img" },
  showCancel: false,
  showAddMore: false,
  onHide: jest.fn(),
  onSetToast: jest.fn(),
};

test("toggles optional fields", async () => {
  const user = userEvent.setup();
  render(<UpdateDelegationComponent {...baseProps} />);
  expect(screen.queryByTestId("calendar")).toBeNull();
  expect(screen.queryByTestId("token-select")).toBeNull();
  const radios = screen.getAllByRole('radio');
  await user.click(radios[1]);
  expect(screen.getByTestId("calendar")).toBeInTheDocument();
  await user.click(radios[3]);
  expect(screen.getByTestId("token-select")).toBeInTheDocument();
});

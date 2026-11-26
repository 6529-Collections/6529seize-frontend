import { fireEvent, render, screen } from "@testing-library/react";
import WalletFunding from "@/components/drop-forge/automation/WalletFunding";
import type { ApiDropForgeSettings } from "@/generated/models/ApiDropForgeSettings";

const mockPrepare = jest.fn();
jest.mock("wagmi", () => ({
  useChainId: () => 1,
  useSwitchChain: () => ({ switchChain: jest.fn(), isPending: false }),
}));
jest.mock("@/components/drop-forge/automation/useWalletFunding", () => ({
  useWalletFunding: () => ({
    chain: { name: "Ethereum" },
    busy: false,
    review: null,
    prepare: mockPrepare,
  }),
}));

const settings: ApiDropForgeSettings = {
  revision: 0,
  automation_enabled: false,
  pay_artist_enabled: false,
  max_artist_payment_eth: null,
  updated_by: null,
  updated_at: 0,
  can_edit: true,
  can_top_up: true,
  chain_id: 1,
  contract: "0x" + "22".repeat(20),
  signer_address: "0x" + "33".repeat(20),
  ens_name: null,
  balance_wei: "0",
};

function show() {
  render(<WalletFunding settings={settings} onConfirmed={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Top Up ETH" }));
  return {
    input: screen.getByRole("textbox", { name: "Amount (ETH)" }),
    review: screen.getByRole("button", { name: "Review top-up" }),
  };
}

beforeEach(() => jest.clearAllMocks());

it("rejects letters, signs and extra decimal places without changing the amount", () => {
  const { input } = show();
  fireEvent.change(input, { target: { value: "aiurghh" } });
  expect(input).toHaveValue("");
  fireEvent.change(input, { target: { value: "0.123456789012345678" } });
  for (const value of [
    "0.1234567890123456789",
    "1.2.3",
    "1e2",
    "-1",
    "12 ETH",
  ]) {
    fireEvent.change(input, { target: { value } });
    expect(input).toHaveValue("0.123456789012345678");
  }
});

it("allows incomplete input but reviews only a completed positive amount", () => {
  const { input, review } = show();
  for (const value of ["", "0", "0.", "0.000", "1."]) {
    fireEvent.change(input, { target: { value } });
    expect(input).toHaveValue(value);
    expect(review).toBeDisabled();
    fireEvent.click(review);
  }
  expect(mockPrepare).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: "0.000000000000000001" } });
  expect(review).toBeEnabled();
  fireEvent.click(review);
  expect(mockPrepare).toHaveBeenCalledTimes(1);
});

it.each([".5", "0,5"])("normalizes decimal entry %s", (value) => {
  const { input, review } = show();
  fireEvent.change(input, { target: { value } });
  expect(input).toHaveValue("0.5");
  expect(review).toBeEnabled();
});

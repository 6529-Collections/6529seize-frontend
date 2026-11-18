import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import VerifiedEnsAddressInput from "@/components/utils/input/ens-address/VerifiedEnsAddressInput";
import AirdropConfig from "@/components/waves/memes/submission/components/AirdropConfig";
import PaymentConfig from "@/components/waves/memes/submission/components/PaymentConfig";
import type {
  AirdropEntry,
  PaymentInfo,
} from "@/components/waves/memes/submission/types/OperationalData";

const artist = "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed";
const artistChecksummed = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const pasted = "0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359";

const mockEnsAddress = jest.fn();

jest.mock("wagmi", () => ({
  useEnsName: () => ({ data: null, isLoading: false }),
  useEnsAddress: (parameters: { name?: string; chainId: number }) =>
    mockEnsAddress(parameters),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockEnsAddress.mockImplementation(({ name }: { name?: string }) =>
    name === "artist.eth"
      ? { data: artist, isLoading: false, isError: false }
      : { data: null, isLoading: false, isError: false }
  );
});

function Field({ onAddress }: { readonly onAddress: jest.Mock }) {
  return (
    <VerifiedEnsAddressInput ariaLabel="Payout" onAddressChange={onAddress} />
  );
}

function type(value: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "Payout" }), {
    target: { value },
  });
}

describe("VerifiedEnsAddressInput", () => {
  it("does not use the address embedded after a non-ENS label", () => {
    const onAddress = jest.fn();
    render(<Field onAddress={onAddress} />);

    type(`Artist Wallet - ${pasted}`);

    expect(onAddress).toHaveBeenLastCalledWith("");
    expect(screen.queryByText(new RegExp(pasted, "i"))).toBeNull();
    expect(screen.getByText(/No address is used yet/)).toBeInTheDocument();
  });

  it("resolves the ENS part forward and ignores a pasted address suffix", () => {
    const onAddress = jest.fn();
    render(<Field onAddress={onAddress} />);

    type(`artist.eth - ${pasted}`);

    expect(mockEnsAddress).toHaveBeenCalledWith({
      name: "artist.eth",
      chainId: 1,
    });
    expect(onAddress).toHaveBeenLastCalledWith(artist);
    expect(onAddress).not.toHaveBeenCalledWith(pasted);
    expect(
      screen.getByText(`Address used: ${artistChecksummed}`)
    ).toBeInTheDocument();
  });

  it("does not use any address when the name does not resolve", () => {
    const onAddress = jest.fn();
    render(<Field onAddress={onAddress} />);

    type(`unknown.eth - ${pasted}`);

    expect(onAddress).toHaveBeenLastCalledWith("");
    expect(screen.queryByText(/Address used/)).toBeNull();
  });

  it("still accepts a plain wallet address and shows it checksummed", () => {
    const onAddress = jest.fn();
    render(<Field onAddress={onAddress} />);

    type(artist);

    expect(onAddress).toHaveBeenLastCalledWith(artist);
    expect(
      screen.getByText(`Address used: ${artistChecksummed}`)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Payout" })
    ).toHaveAccessibleDescription(`Address used: ${artistChecksummed}`);
  });
});

describe("submission payout inputs", () => {
  function PaymentHarness() {
    const [info, setInfo] = useState<PaymentInfo>({
      payment_address: "",
      has_designated_payee: false,
      designated_payee_name: "",
    });
    return (
      <>
        <PaymentConfig paymentInfo={info} onPaymentInfoChange={setInfo} />
        <output aria-label="Saved payment address">
          {info.payment_address}
        </output>
      </>
    );
  }

  it("PaymentConfig saves only a verified address", () => {
    render(<PaymentHarness />);
    const input = screen.getByPlaceholderText("0x... or ENS");

    fireEvent.change(input, { target: { value: `Artist - ${pasted}` } });
    expect(screen.getByLabelText("Saved payment address")).toHaveTextContent(
      /^$/
    );

    fireEvent.change(input, { target: { value: "artist.eth" } });
    expect(screen.getByLabelText("Saved payment address")).toHaveTextContent(
      artist
    );
  });

  function AirdropHarness() {
    const [entries, setEntries] = useState<AirdropEntry[]>([
      { id: "a", address: "", count: 20 },
    ]);
    return (
      <>
        <AirdropConfig entries={entries} onEntriesChange={setEntries} />
        <output aria-label="Saved airdrop address">
          {entries[0]?.address}
        </output>
      </>
    );
  }

  it("AirdropConfig saves only a verified address", () => {
    render(<AirdropHarness />);
    const input = screen.getByPlaceholderText("0x... or ENS");

    fireEvent.change(input, { target: { value: `Collector - ${pasted}` } });
    expect(screen.getByLabelText("Saved airdrop address")).toHaveTextContent(
      /^$/
    );

    fireEvent.change(input, { target: { value: pasted } });
    expect(screen.getByLabelText("Saved airdrop address")).toHaveTextContent(
      pasted
    );
  });
});

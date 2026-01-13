import { render, screen, fireEvent } from "@testing-library/react";
import PaymentConfig from "@/components/waves/memes/submission/components/PaymentConfig";

let mockOnAddressChange: ((address: string) => void) | undefined;
let mockValue: string | undefined;

jest.mock(
  "@/components/utils/input/ens-address/EnsAddressInput",
  () =>
    function MockEnsAddressInput(props: {
      value?: string;
      placeholder?: string;
      onAddressChange: (address: string) => void;
      className?: string;
    }) {
      mockOnAddressChange = props.onAddressChange;
      mockValue = props.value;
      return (
        <input
          data-testid="ens-address-input"
          placeholder={props.placeholder}
          value={props.value ?? ""}
          onChange={(e) => props.onAddressChange(e.target.value)}
          className={props.className}
        />
      );
    }
);

describe("PaymentConfig", () => {
  const defaultProps = {
    paymentInfo: { payment_address: "" },
    onPaymentInfoChange: jest.fn(),
  };

  it("renders payment address field with label", () => {
    render(<PaymentConfig {...defaultProps} />);
    expect(screen.getByText(/Payment Address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/0x.*or ENS/i)).toBeInTheDocument();
  });

  it("displays helper text about minting proceeds", () => {
    render(<PaymentConfig {...defaultProps} />);
    expect(
      screen.getByText(/Address to receive split of minting proceeds/i)
    ).toBeInTheDocument();
  });

  it("calls onPaymentInfoChange when address is updated", () => {
    const onPaymentInfoChange = jest.fn();
    render(
      <PaymentConfig
        {...defaultProps}
        onPaymentInfoChange={onPaymentInfoChange}
      />
    );

    const input = screen.getByPlaceholderText(/0x.*or ENS/i);
    fireEvent.change(input, {
      target: { value: "0x1234567890123456789012345678901234567890" },
    });

    expect(onPaymentInfoChange).toHaveBeenCalledWith({
      payment_address: "0x1234567890123456789012345678901234567890",
    });
  });

  it("shows pre-populated value", () => {
    const address = "0x1234567890123456789012345678901234567890";
    render(
      <PaymentConfig
        paymentInfo={{ payment_address: address }}
        onPaymentInfoChange={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/0x.*or ENS/i);
    expect(input).toHaveValue(address);
  });
});

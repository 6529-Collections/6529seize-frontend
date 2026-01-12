import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaymentConfig from "@/components/waves/memes/submission/components/PaymentConfig";

describe("PaymentConfig", () => {
  const defaultProps = {
    paymentInfo: { payment_address: "" },
    onPaymentInfoChange: jest.fn(),
  };

  it("renders payment address field with label", () => {
    render(<PaymentConfig {...defaultProps} />);
    expect(screen.getByText(/Payment Address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0x...")).toBeInTheDocument();
  });

  it("displays helper text about minting proceeds", () => {
    render(<PaymentConfig {...defaultProps} />);
    expect(
      screen.getByText(/Address to receive split of minting proceeds/i)
    ).toBeInTheDocument();
  });

  it("calls onPaymentInfoChange when address is updated", async () => {
    const user = userEvent.setup();
    const onPaymentInfoChange = jest.fn();
    render(
      <PaymentConfig
        {...defaultProps}
        onPaymentInfoChange={onPaymentInfoChange}
      />
    );

    const input = screen.getByPlaceholderText("0x...");
    await user.type(input, "0x1234567890123456789012345678901234567890");

    expect(onPaymentInfoChange).toHaveBeenCalled();
  });

  it("shows pre-populated value", () => {
    const address = "0x1234567890123456789012345678901234567890";
    render(
      <PaymentConfig
        paymentInfo={{ payment_address: address }}
        onPaymentInfoChange={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText("0x...");
    expect(input).toHaveValue(address);
  });
});

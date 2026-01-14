import { render, screen, fireEvent } from "@testing-library/react";
import PaymentConfig from "@/components/waves/memes/submission/components/PaymentConfig";

jest.mock(
  "@/components/utils/input/ens-address/EnsAddressInput",
  () =>
    function MockEnsAddressInput(props: {
      value?: string;
      placeholder?: string;
      onAddressChange: (address: string) => void;
      className?: string;
    }) {
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
    paymentInfo: {
      payment_address: "",
      has_designated_payee: false,
      designated_payee_name: "",
    },
    onPaymentInfoChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it("renders designated payee checkbox", () => {
    render(<PaymentConfig {...defaultProps} />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByText("Designated Payee")).toBeInTheDocument();
  });

  it("checkbox is unchecked by default", () => {
    render(<PaymentConfig {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("does not show designated payee name field when checkbox is unchecked", () => {
    render(<PaymentConfig {...defaultProps} />);
    expect(
      screen.queryByPlaceholderText(/enter designated payee name/i)
    ).not.toBeInTheDocument();
  });

  it("shows designated payee name field when checkbox is checked", () => {
    render(
      <PaymentConfig
        paymentInfo={{
          ...defaultProps.paymentInfo,
          has_designated_payee: true,
        }}
        onPaymentInfoChange={jest.fn()}
      />
    );
    expect(screen.getByText("Designated Payee Name *")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter designated payee name/i)
    ).toBeInTheDocument();
  });

  it("calls onPaymentInfoChange when checkbox is toggled", () => {
    const onPaymentInfoChange = jest.fn();
    render(
      <PaymentConfig
        {...defaultProps}
        onPaymentInfoChange={onPaymentInfoChange}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onPaymentInfoChange).toHaveBeenCalledWith({
      payment_address: "",
      has_designated_payee: true,
      designated_payee_name: "",
    });
  });

  it("calls onPaymentInfoChange when designated payee name changes", () => {
    const onPaymentInfoChange = jest.fn();
    render(
      <PaymentConfig
        paymentInfo={{
          ...defaultProps.paymentInfo,
          has_designated_payee: true,
        }}
        onPaymentInfoChange={onPaymentInfoChange}
      />
    );

    const nameInput = screen.getByPlaceholderText(/enter designated payee name/i);
    fireEvent.change(nameInput, { target: { value: "Red Cross" } });

    expect(onPaymentInfoChange).toHaveBeenCalledWith({
      payment_address: "",
      has_designated_payee: true,
      designated_payee_name: "Red Cross",
    });
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
      has_designated_payee: false,
      designated_payee_name: "",
    });
  });

  it("shows pre-populated values", () => {
    const address = "0x1234567890123456789012345678901234567890";
    render(
      <PaymentConfig
        paymentInfo={{
          payment_address: address,
          has_designated_payee: true,
          designated_payee_name: "Red Cross",
        }}
        onPaymentInfoChange={jest.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/0x.*or ENS/i)).toHaveValue(address);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(screen.getByPlaceholderText(/enter designated payee name/i)).toHaveValue(
      "Red Cross"
    );
  });

  it("clears designated payee name when checkbox is unchecked", () => {
    const onPaymentInfoChange = jest.fn();
    render(
      <PaymentConfig
        paymentInfo={{
          payment_address: "",
          has_designated_payee: true,
          designated_payee_name: "Some Name",
        }}
        onPaymentInfoChange={onPaymentInfoChange}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onPaymentInfoChange).toHaveBeenCalledWith({
      payment_address: "",
      has_designated_payee: false,
      designated_payee_name: "",
    });
  });
});

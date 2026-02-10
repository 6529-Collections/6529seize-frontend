import { render, screen, fireEvent } from "@testing-library/react";
import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";

const mockHandleInputChange = jest.fn();
const mockSetInputValue = jest.fn();

jest.mock("react-bootstrap", () => ({
  Form: {
    Control: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
      <input data-testid="form-control" {...props} />
    ),
  },
}));

jest.mock("@/hooks/useEnsResolution", () => ({
  useEnsResolution: jest.fn(() => ({
    inputValue: "",
    address: "",
    handleInputChange: mockHandleInputChange,
    setInputValue: mockSetInputValue,
    ensNameQuery: { isLoading: false },
    ensAddressQuery: { isLoading: false, isError: false },
  })),
}));

import { useEnsResolution } from "@/hooks/useEnsResolution";

const mockUseEnsResolution = useEnsResolution as jest.Mock;

describe("EnsAddressInput", () => {
  const mockOnAddressChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEnsResolution.mockReturnValue({
      inputValue: "",
      address: "",
      handleInputChange: mockHandleInputChange,
      setInputValue: mockSetInputValue,
      ensNameQuery: { isLoading: false },
      ensAddressQuery: { isLoading: false, isError: false },
    });
  });

  it("renders input with placeholder", () => {
    render(<EnsAddressInput onAddressChange={mockOnAddressChange} />);

    expect(
      screen.getByPlaceholderText("0x... or ENS")
    ).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(
      <EnsAddressInput
        onAddressChange={mockOnAddressChange}
        placeholder="Enter wallet"
      />
    );

    expect(screen.getByPlaceholderText("Enter wallet")).toBeInTheDocument();
  });

  it("calls handleInputChange when user types", () => {
    render(<EnsAddressInput onAddressChange={mockOnAddressChange} />);

    const input = screen.getByPlaceholderText("0x... or ENS");
    fireEvent.change(input, { target: { value: "0x123" } });

    expect(mockHandleInputChange).toHaveBeenCalledWith("0x123");
  });

  it("calls onAddressChange when address changes", () => {
    const testAddress = "0x1234567890abcdef";
    mockUseEnsResolution.mockReturnValue({
      inputValue: testAddress,
      address: testAddress,
      handleInputChange: mockHandleInputChange,
      setInputValue: mockSetInputValue,
      ensNameQuery: { isLoading: false },
      ensAddressQuery: { isLoading: false, isError: false },
    });

    render(<EnsAddressInput onAddressChange={mockOnAddressChange} />);

    expect(mockOnAddressChange).toHaveBeenCalledWith(testAddress);
  });

  it("calls onLoadingChange when loading state changes", () => {
    const mockOnLoadingChange = jest.fn();
    mockUseEnsResolution.mockReturnValue({
      inputValue: "test.eth",
      address: "",
      handleInputChange: mockHandleInputChange,
      setInputValue: mockSetInputValue,
      ensNameQuery: { isLoading: false },
      ensAddressQuery: { isLoading: true, isError: false },
    });

    render(
      <EnsAddressInput
        onAddressChange={mockOnAddressChange}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    expect(mockOnLoadingChange).toHaveBeenCalledWith(true);
  });

  it("calls onError when ENS resolution fails for .eth input", () => {
    const mockOnError = jest.fn();
    mockUseEnsResolution.mockReturnValue({
      inputValue: "invalid.eth",
      address: "",
      handleInputChange: mockHandleInputChange,
      setInputValue: mockSetInputValue,
      ensNameQuery: { isLoading: false },
      ensAddressQuery: { isLoading: false, isError: true },
    });

    render(
      <EnsAddressInput
        onAddressChange={mockOnAddressChange}
        onError={mockOnError}
      />
    );

    expect(mockOnError).toHaveBeenCalledWith(true);
  });

  it("does not call onError for non-.eth input even if ensAddressQuery has error", () => {
    const mockOnError = jest.fn();
    mockUseEnsResolution.mockReturnValue({
      inputValue: "0x123",
      address: "0x123",
      handleInputChange: mockHandleInputChange,
      setInputValue: mockSetInputValue,
      ensNameQuery: { isLoading: false },
      ensAddressQuery: { isLoading: false, isError: true },
    });

    render(
      <EnsAddressInput
        onAddressChange={mockOnAddressChange}
        onError={mockOnError}
      />
    );

    expect(mockOnError).toHaveBeenCalledWith(false);
  });

  it("disables input when disabled prop is true", () => {
    render(
      <EnsAddressInput onAddressChange={mockOnAddressChange} disabled />
    );

    expect(screen.getByPlaceholderText("0x... or ENS")).toBeDisabled();
  });

  it("applies custom className", () => {
    render(
      <EnsAddressInput
        onAddressChange={mockOnAddressChange}
        className="custom-class"
      />
    );

    expect(screen.getByPlaceholderText("0x... or ENS")).toHaveClass(
      "custom-class"
    );
  });

  it("passes value prop as initialValue to useEnsResolution", () => {
    const { rerender } = render(
      <EnsAddressInput onAddressChange={mockOnAddressChange} value="initial" />
    );

    expect(mockUseEnsResolution).toHaveBeenCalledWith({
      initialValue: "initial",
      chainId: 1,
    });

    rerender(
      <EnsAddressInput onAddressChange={mockOnAddressChange} value="updated" />
    );

    expect(mockUseEnsResolution).toHaveBeenCalledWith({
      initialValue: "updated",
      chainId: 1,
    });
  });

  it("displays resolved ENS with address format", () => {
    mockUseEnsResolution.mockReturnValue({
      inputValue: "vitalik.eth - 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      handleInputChange: mockHandleInputChange,
      setInputValue: mockSetInputValue,
      ensNameQuery: { isLoading: false },
      ensAddressQuery: { isLoading: false, isError: false },
    });

    render(<EnsAddressInput onAddressChange={mockOnAddressChange} />);

    expect(screen.getByDisplayValue(/vitalik\.eth - 0x/)).toBeInTheDocument();
  });
});

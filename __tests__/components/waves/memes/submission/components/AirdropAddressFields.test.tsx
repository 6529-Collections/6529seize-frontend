import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AirdropAddressFields from "@/components/waves/memes/submission/components/AirdropAddressFields";

describe("AirdropAddressFields", () => {
  const defaultProps = {
    airdropArtistAddress: "",
    airdropArtistCount: 0,
    airdropChoiceAddress: "",
    airdropChoiceCount: 0,
    onArtistAddressChange: jest.fn(),
    onArtistCountChange: jest.fn(),
    onChoiceAddressChange: jest.fn(),
    onChoiceCountChange: jest.fn(),
  };

  it("renders all fields", () => {
    render(<AirdropAddressFields {...defaultProps} />);
    expect(screen.getByLabelText(/Artist Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Artist Count/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Choice Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Choice Count/i)).toBeInTheDocument();
  });

  it("calls change handlers on blur", async () => {
    const user = userEvent.setup();
    const onArtistAddressChange = jest.fn();
    const onArtistCountChange = jest.fn();

    render(
      <AirdropAddressFields
        {...defaultProps}
        onArtistAddressChange={onArtistAddressChange}
        onArtistCountChange={onArtistCountChange}
      />
    );

    const artistAddressInput = screen.getByLabelText(/Artist Address/i);
    const artistCountInput = screen.getByLabelText(/Artist Count/i);

    await user.type(artistAddressInput, "0x123");
    await user.tab();
    expect(onArtistAddressChange).toHaveBeenCalledWith("0x123");

    await user.clear(artistCountInput);
    await user.type(artistCountInput, "10");
    await user.tab();
    expect(onArtistCountChange).toHaveBeenCalledWith(10);
  });

  it("displays validation errors", () => {
    render(
      <AirdropAddressFields
        {...defaultProps}
        artistAddressError="Invalid address"
        artistCountError="Must be positive"
      />
    );
    expect(screen.getByText("Invalid address")).toBeInTheDocument();
    expect(screen.getByText("Must be positive")).toBeInTheDocument();
  });

  it("syncs with props", () => {
    const { rerender } = render(
      <AirdropAddressFields {...defaultProps} airdropArtistAddress="0x1" />
    );
    const input = screen.getByLabelText(/Artist Address/i) as HTMLInputElement;
    expect(input.value).toBe("0x1");

    rerender(<AirdropAddressFields {...defaultProps} airdropArtistAddress="0x2" />);
    expect(input.value).toBe("0x2");
  });
});

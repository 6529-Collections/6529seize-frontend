import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserAddressesSelectDropdownItem from "@/components/user/utils/addresses-select/UserAddressesSelectDropdownItem";

const mockCopy = jest.fn();

jest.mock("react-use", () => ({
  useCopyToClipboard: () => [null, mockCopy],
}));

describe("UserAddressesSelectDropdownItem", () => {
  beforeEach(() => {
    mockCopy.mockClear();
    (window as any).open = jest.fn();
  });

  it("copies display address and calls onCopy", async () => {
    const onCopy = jest.fn();
    render(
      <UserAddressesSelectDropdownItem
        wallet={{ wallet: "0xabc", display: "ens.eth" } as any}
        onCopy={onCopy}
      />
    );
    await userEvent.click(screen.getByLabelText("Copy address"));
    expect(mockCopy).toHaveBeenCalledWith("ens.eth");
    expect(onCopy).toHaveBeenCalled();
  });

  it("opens opensea with wallet when no display", async () => {
    render(
      <UserAddressesSelectDropdownItem
        wallet={{ wallet: "0x123" } as any}
      />
    );
    await userEvent.click(screen.getByLabelText("Open in OpenSea"));
    expect(window.open).toHaveBeenCalledWith(
      "https://opensea.io/0x123",
      "_blank"
    );
  });
});

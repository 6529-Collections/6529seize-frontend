import UserAddressesSelectDropdown from "@/components/user/utils/addresses-select/UserAddressesSelectDropdown";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock(
  "@/components/utils/select/dropdown/CommonDropdown",
  () => (props: any) =>
    (
      <div>
        <button data-testid="all" onClick={() => props.setSelected(null)}>
          all
        </button>
        {props.items.slice(1).map((i: any) => (
          <button
            key={i.key}
            data-testid={i.key}
            onClick={() => props.setSelected(i.value)}>
            {i.label}
          </button>
        ))}
        <span data-testid="active">{String(props.activeItem)}</span>
      </div>
    )
);

describe("UserAddressesSelectDropdown", () => {
  const push = jest.fn();
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push,
    });
    (usePathname as jest.Mock).mockReturnValue("/u");
    (useSearchParams as jest.Mock).mockReturnValue({ get: jest.fn() });
    push.mockClear();
  });

  it("updates router on selection", async () => {
    const wallets = [{ wallet: "0x1", display: "one" }];
    render(
      <UserAddressesSelectDropdown
        wallets={wallets as any}
        onActiveAddress={() => {}}
      />
    );
    await userEvent.click(screen.getByTestId("0x1"));
    expect(push).toHaveBeenLastCalledWith("/u?address=0x1", { scroll: false });
    await userEvent.click(screen.getByTestId("0x1"));
    expect(push).toHaveBeenLastCalledWith("/u", { scroll: false });
  });

  it("calls onActiveAddress when address changes", async () => {
    const wallets = [{ wallet: "0x1", display: "one" }];
    const cb = jest.fn();
    render(
      <UserAddressesSelectDropdown
        wallets={wallets as any}
        onActiveAddress={cb}
      />
    );
    await userEvent.click(screen.getByTestId("0x1"));
    expect(cb).toHaveBeenLastCalledWith("0x1");
  });
});

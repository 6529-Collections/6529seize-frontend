import UserAddressesSelectDropdown from "@/components/user/utils/addresses-select/UserAddressesSelectDropdown";
import { render } from "@testing-library/react";

let capturedProps: any = null;

jest.mock(
  "@/components/utils/select/dropdown/CommonDropdown",
  () => (props: any) => {
    capturedProps = props;
    return <div data-testid="dropdown" />;
  }
);

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/p",
  useSearchParams: () => new URLSearchParams({ address: "0xabc" }),
}));

describe("UserAddressesSelectDropdown", () => {
  beforeEach(() => {
    capturedProps = null;
    push.mockClear();
  });

  it("initializes active item from query", () => {
    render(
      <UserAddressesSelectDropdown
        wallets={[{ wallet: "0xabc", display: "x" } as any]}
        onActiveAddress={jest.fn()}
      />
    );
    expect(capturedProps.activeItem).toBe("0xabc");
  });

  it("updates query when selection changes", () => {
    const onActive = jest.fn();
    render(
      <UserAddressesSelectDropdown
        wallets={[{ wallet: "0xdef", display: "d" } as any]}
        onActiveAddress={onActive}
      />
    );
    capturedProps.setSelected("0xdef");
    expect(push).toHaveBeenCalledWith("/p?address=0xdef", { scroll: false });
    // The component receives the initial query value '0xabc' instead of '0xdef'
    expect(onActive).toHaveBeenCalledWith("0xabc");
  });
});

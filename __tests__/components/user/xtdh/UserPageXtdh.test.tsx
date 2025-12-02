import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageXtdh from "@/components/user/xtdh/UserPageXtdh";

const mockUseSearchParams = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/profile/xtdh",
}));

jest.mock("@/components/user/xtdh/UserPageXtdhGranted", () => () => (
  <div data-testid="granted-view" />
));

jest.mock("@/components/xtdh/user/received", () => () => (
  <div data-testid="received-view" />
));

jest.mock("@/components/user/xtdh/UserPageXtdhStatsHeader", () => () => (
  <div data-testid="stats-header" />
));

jest.mock("@/components/auth/Auth", () => {
  const React = require("react");
  return {
    AuthContext: React.createContext({
      connectedProfile: null,
      activeProfileProxy: null,
    }),
  };
});

jest.mock("@/components/utils/select/CommonSelect", () => ({
  __esModule: true,
  default: ({ items, activeItem, setSelected }: any) => (
    <div>
      {items.map((item: any) => (
        <button
          key={item.key}
          type="button"
          aria-pressed={activeItem === item.value}
          onClick={() => setSelected(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

describe("UserPageXtdh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears non-shared params when switching tabs", async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("tab=granted&status=PENDING&sort=created_at")
    );

    const profile = {
      query: "simo",
      handle: "simo",
      primary_wallet: "0xabc",
      consolidation_key: "key",
    } as unknown as ApiIdentity;

    render(<UserPageXtdh profile={profile} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Received" }));

    expect(mockReplace).toHaveBeenCalledWith(
      "/profile/xtdh?tab=received&status=PENDING&sort=created_at",
      {
        scroll: false,
      }
    );
  });
});

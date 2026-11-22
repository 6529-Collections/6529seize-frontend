import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageXtdh from "@/components/user/xtdh/UserPageXtdh";
import { AuthContext } from "@/components/auth/Auth";
import { setIdentityFreezeAt } from "@/__tests__/helpers/identityFreeze";

const mockUseSearchParams = jest.fn();
const mockReplace = jest.fn();
const mockGrantedProps = jest.fn();

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        NEXT_PUBLIC_IDENTITY_FREEZE_AT: (
          globalThis as { __identityFreezeAt?: string }
        ).__identityFreezeAt,
      };
    },
  };
});

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/profile/xtdh",
}));

jest.mock("@/components/user/xtdh/UserPageXtdhGranted", () => (props: any) => {
  mockGrantedProps(props);
  return <div data-testid="granted-view" />;
});

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

  it("does not schedule a second navigation when mounted without a tab", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    const profile = { handle: "alice", primary_wallet: "0xabc" } as ApiIdentity;
    render(<UserPageXtdh profile={profile} />);
    expect(screen.getByTestId("granted-view")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
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

  describe("during the identity freeze", () => {
    const own = {
      handle: "alice",
      primary_wallet: "0xabc",
      consolidation_key: "0xabc",
    } as ApiIdentity;

    const renderOwnPage = () =>
      render(
        <AuthContext.Provider
          value={{ connectedProfile: own, activeProfileProxy: null } as any}
        >
          <UserPageXtdh profile={own} />
        </AuthContext.Provider>
      );

    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams());
      jest.useFakeTimers();
      jest.setSystemTime(Date.UTC(2026, 10, 24, 6, 0, 0));
    });

    afterEach(() => {
      jest.useRealTimers();
      setIdentityFreezeAt(undefined);
    });

    it("lets the owner grant before the freeze", () => {
      setIdentityFreezeAt("2026-11-25T00:00:00Z");
      renderOwnPage();
      expect(mockGrantedProps).toHaveBeenLastCalledWith(
        expect.objectContaining({ canGrant: true, isSelf: true })
      );
      expect(screen.queryByTestId("xtdh-frozen-notice")).toBeNull();
    });

    it("hides grant creation and grant changes and says xTDH is frozen", () => {
      setIdentityFreezeAt("2026-11-24T00:00:00Z");
      renderOwnPage();
      expect(mockGrantedProps).toHaveBeenLastCalledWith(
        expect.objectContaining({ canGrant: false, isSelf: false })
      );
      expect(screen.getByTestId("xtdh-frozen-notice")).toHaveTextContent(
        "xTDH is frozen"
      );
    });
  });
});

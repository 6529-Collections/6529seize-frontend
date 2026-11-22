import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import UserPageRateWrapper from "@/components/user/utils/rate/UserPageRateWrapper";
import { RateMatter } from "@/types/enums";
import { render, screen } from "@testing-library/react";
import { setIdentityFreezeAt } from "@/__tests__/helpers/identityFreeze";

jest.mock("@/components/auth/SeizeConnectContext");
jest.mock("@/components/utils/CommonInfoBox", () => ({
  __esModule: true,
  default: (props: { message: string }) => (
    <div data-testid="infobox">{props.message}</div>
  ),
}));

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

const FREEZE = Date.UTC(2026, 10, 24, 0, 0, 0);
const profile = {
  query: "alice",
  handle: "alice",
  wallets: [{ wallet: "0xabc" }],
} as never;

const renderWrapper = (type: RateMatter) => {
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0xdef" });
  return render(
    <AuthContext.Provider
      value={
        { connectedProfile: { handle: "bob" }, activeProfileProxy: null } as never
      }
    >
      <UserPageRateWrapper profile={profile} type={type}>
        <div data-testid="child" />
      </UserPageRateWrapper>
    </AuthContext.Provider>
  );
};

beforeEach(() => {
  jest.useFakeTimers();
  setIdentityFreezeAt("2026-11-24T00:00:00Z");
});

afterEach(() => {
  jest.useRealTimers();
  setIdentityFreezeAt(undefined);
});

it.each([RateMatter.REP, RateMatter.NIC])(
  "keeps %s rating open before the freeze",
  (type) => {
    jest.setSystemTime(FREEZE - 1);
    renderWrapper(type);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  }
);

it.each([RateMatter.REP, RateMatter.NIC])(
  "pauses %s rating from the freeze",
  (type) => {
    jest.setSystemTime(FREEZE);
    renderWrapper(type);
    expect(screen.getByTestId("infobox")).toHaveTextContent(
      "Paused for the move to the 6529 Network."
    );
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  }
);

it("keeps wave REP open while frozen", () => {
  jest.setSystemTime(FREEZE);
  renderWrapper(RateMatter.WAVE_REP);
  expect(screen.getByTestId("child")).toBeInTheDocument();
});

import IdentityMoveNotice from "@/components/identity-move/IdentityMoveNotice";
import { act, render, screen } from "@testing-library/react";
import {
  setIdentityFreezeAt,
  setIdentitySwitchOnAt,
} from "@/__tests__/helpers/identityFreeze";

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
        NEXT_PUBLIC_IDENTITY_SWITCH_ON_AT: (
          globalThis as { __identitySwitchOnAt?: string }
        ).__identitySwitchOnAt,
      };
    },
  };
});

const FREEZE = Date.UTC(2026, 10, 24, 0, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

// The owner's wording for the notice, word for word.
const NOTICE =
  "Profiles, handles, ratings, consolidations and delegations move to the 6529 Network. From Tuesday 24 November 00:00 UTC you can't change them for about 24 hours. From Wednesday you change them on the 6529 Network, through this site.";
const FROZEN =
  "Profiles, handles, ratings, consolidations and delegations are moving to the 6529 Network. You can't change them until Wednesday 25 November 00:00 UTC. From then you change them on the 6529 Network, through this site.";
const MOVED =
  "Profiles, handles, ratings, consolidations and delegations moved to the 6529 Network on Wednesday 25 November. You can't change them on this site yet.";

beforeEach(() => {
  jest.useFakeTimers();
  setIdentityFreezeAt("2026-11-24T00:00:00Z");
});

afterEach(() => {
  jest.useRealTimers();
  setIdentityFreezeAt(undefined);
  setIdentitySwitchOnAt(undefined);
});

it("renders nothing without a freeze", () => {
  setIdentityFreezeAt(undefined);
  jest.setSystemTime(FREEZE - DAY);
  const { container } = render(<IdentityMoveNotice />);
  expect(container).toBeEmptyDOMElement();
});

it("gives the owner's notice before the freeze", () => {
  jest.setSystemTime(Date.UTC(2026, 10, 23, 8, 0, 0));
  render(<IdentityMoveNotice />);
  expect(
    screen.getByRole("region", { name: "Move to the 6529 Network" })
  ).toHaveTextContent(NOTICE);
});

it("says when editing comes back during the freeze", () => {
  jest.setSystemTime(FREEZE + 60_000);
  render(<IdentityMoveNotice />);
  expect(screen.getByTestId("identity-move-notice")).toHaveTextContent(FROZEN);
});

it("says the data moved after the switch-on", () => {
  jest.setSystemTime(FREEZE + DAY + 1);
  render(<IdentityMoveNotice />);
  expect(screen.getByTestId("identity-move-notice")).toHaveTextContent(MOVED);
});

it("follows the clock across the freeze and the switch-on", () => {
  jest.setSystemTime(FREEZE - 1_000);
  render(<IdentityMoveNotice />);
  expect(screen.getByTestId("identity-move-notice")).toHaveTextContent(NOTICE);

  act(() => {
    jest.advanceTimersByTime(2_000);
  });
  expect(screen.getByTestId("identity-move-notice")).toHaveTextContent(FROZEN);

  act(() => {
    jest.advanceTimersByTime(DAY);
  });
  expect(screen.getByTestId("identity-move-notice")).toHaveTextContent(MOVED);
});

describe("with a later switch-on", () => {
  const WED = Date.UTC(2026, 10, 25, 0, 0, 0);
  const FRI = Date.UTC(2026, 10, 27, 0, 0, 0);

  beforeEach(() => {
    setIdentityFreezeAt("2026-11-25T00:00:00Z");
    setIdentitySwitchOnAt("2026-11-27T00:00:00Z");
  });

  it("says how long the freeze lasts and when it ends, before the freeze", () => {
    jest.setSystemTime(WED - DAY);
    render(<IdentityMoveNotice />);
    expect(screen.getByTestId("identity-move-notice")).toHaveTextContent(
      "Profiles, handles, ratings, consolidations and delegations move to the 6529 Network. From Wednesday 25 November 00:00 UTC you can't change them for about 48 hours. From Friday you change them on the 6529 Network, through this site."
    );
  });

  it("stays frozen through Thursday and names Friday", () => {
    jest.setSystemTime(WED + DAY + 12 * 60 * 60 * 1000);
    render(<IdentityMoveNotice />);
    expect(screen.getByTestId("identity-move-notice")).toHaveTextContent(
      "Profiles, handles, ratings, consolidations and delegations are moving to the 6529 Network. You can't change them until Friday 27 November 00:00 UTC. From then you change them on the 6529 Network, through this site."
    );
  });

  it("has moved from Friday", () => {
    jest.setSystemTime(FRI);
    render(<IdentityMoveNotice />);
    expect(screen.getByTestId("identity-move-notice")).toHaveTextContent(
      "Profiles, handles, ratings, consolidations and delegations moved to the 6529 Network on Friday 27 November. You can't change them on this site yet."
    );
  });
});

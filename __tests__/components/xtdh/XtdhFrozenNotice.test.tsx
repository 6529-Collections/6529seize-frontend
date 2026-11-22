import XtdhFrozenNotice from "@/components/xtdh/XtdhFrozenNotice";
import { render, screen } from "@testing-library/react";
import { setIdentityFreezeAt } from "@/__tests__/helpers/identityFreeze";

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
const DAY = 24 * 60 * 60 * 1000;

const BODY =
  "xTDH stopped changing on 24 Nov 2026 at 00:00 UTC. Everyone keeps the xTDH they had then. New grants and changes to grants wait for one-time grants on the 6529 Network.";

beforeEach(() => {
  jest.useFakeTimers();
  setIdentityFreezeAt("2026-11-24T00:00:00Z");
});

afterEach(() => {
  jest.useRealTimers();
  setIdentityFreezeAt(undefined);
});

it("renders nothing without a freeze", () => {
  setIdentityFreezeAt(undefined);
  jest.setSystemTime(FREEZE + DAY);
  const { container } = render(<XtdhFrozenNotice />);
  expect(container).toBeEmptyDOMElement();
});

it("renders nothing before the freeze", () => {
  jest.setSystemTime(FREEZE - 60_000);
  const { container } = render(<XtdhFrozenNotice />);
  expect(container).toBeEmptyDOMElement();
});

it("says xTDH is frozen from the freeze on", () => {
  for (const now of [FREEZE + 60_000, FREEZE + 3 * DAY]) {
    jest.setSystemTime(now);
    const { unmount } = render(<XtdhFrozenNotice />);
    const notice = screen.getByRole("region", { name: "xTDH" });
    expect(notice).toHaveTextContent("xTDH is frozen");
    expect(notice).toHaveTextContent(BODY);
    unmount();
  }
});

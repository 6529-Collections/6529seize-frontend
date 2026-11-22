import XtdhRetiredNotice from "@/components/xtdh/XtdhRetiredNotice";
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

const CLOSING =
  "xTDH is being retired as identities move to the 6529 Network. Grants can't be created or changed.";
const RETIRED = "xTDH was retired when identities moved to the 6529 Network.";

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
  const { container } = render(<XtdhRetiredNotice />);
  expect(container).toBeEmptyDOMElement();
});

it("renders nothing before the freeze", () => {
  jest.setSystemTime(FREEZE - 60_000);
  const { container } = render(<XtdhRetiredNotice />);
  expect(container).toBeEmptyDOMElement();
});

it("says xTDH is being retired on the freeze day", () => {
  jest.setSystemTime(FREEZE + 60_000);
  render(<XtdhRetiredNotice />);
  const notice = screen.getByRole("region", { name: "xTDH" });
  expect(notice).toHaveTextContent(CLOSING);
});

it("says xTDH was retired from the switch-on", () => {
  for (const now of [FREEZE + DAY, FREEZE + 3 * DAY]) {
    jest.setSystemTime(now);
    const { unmount } = render(<XtdhRetiredNotice />);
    const notice = screen.getByRole("region", { name: "xTDH" });
    expect(notice).toHaveTextContent(RETIRED);
    expect(notice).not.toHaveTextContent("Grants");
    unmount();
  }
});

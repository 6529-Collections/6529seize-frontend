import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import ProfileActivityLogs, {
  type ActivityLogParams,
} from "@/components/profile-activity/ProfileActivityLogs";
import UserPageCombinedActivityLog from "@/components/user/rep/UserPageCombinedActivityLog";
import { ProfileActivityFilterTargetType, RateMatter } from "@/types/enums";

jest.mock("@/components/profile-activity/ProfileActivityLogs", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));
const logs = jest.mocked(ProfileActivityLogs);
const params: ActivityLogParams = {
  page: 1,
  pageSize: 10,
  logTypes: [],
  matter: null,
  targetType: ProfileActivityFilterTargetType.ALL,
  handleOrWallet: "alice",
  groupId: null,
};
let desktop = true;
const subscribers = new Set<() => void>();
const originalMatchMedia = globalThis.matchMedia;

function bothLayouts() {
  return (
    <>
      <UserPageCombinedActivityLog initialActivityLogParams={params} />
      <UserPageCombinedActivityLog
        initialActivityLogParams={params}
        layout="mobile"
        matter={RateMatter.REP}
      />
    </>
  );
}

beforeEach(() => {
  logs.mockClear();
  desktop = true;
  subscribers.clear();
  globalThis.matchMedia = jest.fn(() => ({
    get matches() {
      return desktop;
    },
    addEventListener: (_type: string, listener: () => void) =>
      subscribers.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      subscribers.delete(listener),
  })) as unknown as typeof matchMedia;
});
afterEach(() => {
  globalThis.matchMedia = originalMatchMedia;
});

it("enables neither layout during server rendering", () => {
  renderToString(bothLayouts());
  expect(logs.mock.calls.map(([props]) => props.enabled)).toEqual([
    false,
    false,
  ]);
});

it.each([true, false])(
  "enables only the current layout after hydration (desktop=%s)",
  (isDesktop) => {
    desktop = isDesktop;
    render(bothLayouts());
    const calls = logs.mock.calls.slice(-2).map(([props]) => props);
    expect(calls.map((props) => props.enabled)).toEqual([
      isDesktop,
      !isDesktop,
    ]);
  }
);

it("switches fetching without changing the initial filter/page object", () => {
  render(bothLayouts());
  const original = logs.mock.calls
    .slice(-2)
    .map(([props]) => props.initialParams);
  act(() => {
    desktop = false;
    subscribers.forEach((listener) => listener());
  });
  const updated = logs.mock.calls.slice(-2).map(([props]) => props);
  expect(updated.map((props) => props.enabled)).toEqual([false, true]);
  expect(updated[0]?.initialParams).toBe(original[0]);
  expect(updated[1]?.initialParams).toBe(original[1]);
});

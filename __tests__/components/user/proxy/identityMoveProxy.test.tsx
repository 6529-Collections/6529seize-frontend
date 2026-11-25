import ProxyList from "@/components/user/proxy/list/ProxyList";
import ProxyCreateActionSelectType from "@/components/user/proxy/proxy/create-action/select-type/ProxyCreateActionSelectType";
import { setIdentityFreezeAt } from "@/__tests__/helpers/identityFreeze";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { render, screen } from "@testing-library/react";

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
jest.mock(
  "@/components/user/proxy/proxy/create-action/select-type/ProxyCreateActionSelectTypeItem",
  () => (props: { actionType: string }) => (
    <div data-testid="action-type">{props.actionType}</div>
  )
);
jest.mock("@/components/user/proxy/list/filters/ProxyListFilters", () => ({
  __esModule: true,
  default: () => <div />,
}));
jest.mock("@/components/user/proxy/list/ProxyListItem", () => ({
  __esModule: true,
  default: (props: { profileProxy: { id: string } }) => (
    <div data-testid="proxy">{props.profileProxy.id}</div>
  ),
}));

const FREEZE = Date.UTC(2026, 10, 24, 0, 0, 0);

const renderList = () =>
  render(
    <ProxyList
      onModeChange={jest.fn()}
      receivedProfileProxies={[{ id: "r1" } as never]}
      grantedProfileProxies={[{ id: "g1" } as never]}
      isSelf={true}
      profile={{} as never}
      loading={false}
    />
  );

beforeEach(() => {
  jest.useFakeTimers();
  setIdentityFreezeAt("2026-11-24T00:00:00Z");
});

afterEach(() => {
  jest.useRealTimers();
  setIdentityFreezeAt(undefined);
});

it("offers REP and NIC proxy actions before the freeze", () => {
  jest.setSystemTime(FREEZE - 1);
  render(
    <ProxyCreateActionSelectType
      currentActions={[]}
      setSelectedActionType={jest.fn()}
    />
  );
  expect(
    screen.getAllByTestId("action-type").map((item) => item.textContent)
  ).toEqual([
    ApiProfileProxyActionType.AllocateRep,
    ApiProfileProxyActionType.AllocateCic,
  ]);
  renderList();
  expect(
    screen.getByRole("button", { name: /Assign Proxy/i })
  ).toBeInTheDocument();
});

it("stops new REP and NIC proxies from the freeze and keeps the list", () => {
  jest.setSystemTime(FREEZE);
  render(
    <ProxyCreateActionSelectType
      currentActions={[]}
      setSelectedActionType={jest.fn()}
    />
  );
  expect(screen.queryAllByTestId("action-type")).toHaveLength(0);
  renderList();
  expect(
    screen.queryByRole("button", { name: /Assign Proxy/i })
  ).not.toBeInTheDocument();
  expect(screen.getAllByTestId("proxy")).toHaveLength(2);
});

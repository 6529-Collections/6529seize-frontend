import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WavesList from "../../../../components/waves/list/WavesList";
import { AuthContext } from "../../../../components/auth/Auth";
import { ProfileConnectedStatus } from "../../../../entities/IProfile";
import { ApiWavesOverviewType } from "../../../../generated/models/ApiWavesOverviewType";
import { useRouter } from "next/router";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../../../components/waves/list/header/WavesListHeader", () => (props: any) => (
  <div>
    <button onClick={() => props.setIdentity("bob")} data-testid="set-id" />
    <button onClick={() => props.setIdentity(null)} data-testid="clear-id" />
  </div>
));

jest.mock("../../../../components/waves/list/WavesListWrapper", () => (props: any) => (
  <div data-testid={`wrapper-${props.overviewType}`}>
    <span data-testid={`showall-${props.overviewType}`}>{String(props.showAllType)}</span>
    <button
      onClick={() =>
        props.setShowAllType(
          props.showAllType === props.overviewType ? null : props.overviewType
        )
      }
      data-testid={`toggle-${props.overviewType}`}
    />
  </div>
));

jest.mock("../../../../components/waves/list/WavesListSearchResults", () => (props: any) => (
  <div data-testid="search-results">{props.identity ?? ""}</div>
));

const push = jest.fn((url: any, _as?: any, _opts?: any) => {
  router.pathname = url.pathname;
  router.query = url.query;
});
const router = { pathname: "/waves", query: {}, push } as any;
(useRouter as jest.Mock).mockReturnValue(router);

const baseAuth = {
  connectedProfile: { handle: "alice" },
  fetchingProfile: false,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  connectionStatus: ProfileConnectedStatus.HAVE_PROFILE,
  showWaves: true,
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
  setToast: jest.fn(),
  setActiveProfileProxy: jest.fn(),
  setTitle: jest.fn(),
  title: "",
};

function setup() {
  return render(
    <AuthContext.Provider value={baseAuth as any}>
      <WavesList
        showCreateNewButton
        onCreateNewWave={jest.fn()}
        onCreateNewDirectMessage={jest.fn()}
      />
    </AuthContext.Provider>
  );
}

it("updates router and shows search results when identity changes", async () => {
  const user = userEvent.setup();
  setup();
  expect(screen.queryByTestId("search-results")).not.toBeInTheDocument();
  await user.click(screen.getByTestId("set-id"));
  expect(screen.getByTestId("search-results")).toHaveTextContent("bob");
  expect(push).toHaveBeenLastCalledWith(
    { pathname: "/waves", query: { identity: "bob" } },
    undefined,
    { shallow: true }
  );
  await user.click(screen.getByTestId("clear-id"));
  expect(screen.queryByTestId("search-results")).not.toBeInTheDocument();
  expect(push).toHaveBeenLastCalledWith(
    { pathname: "/waves", query: {} },
    undefined,
    { shallow: true }
  );
});

it("toggles show all state", async () => {
  const user = userEvent.setup();
  setup();
  const type = Object.values(ApiWavesOverviewType)[0];
  const toggle = screen.getByTestId(`toggle-${type}`);
  const label = () => screen.getByTestId(`showall-${type}`);
  expect(label().textContent).toBe("null");
  await user.click(toggle);
  expect(label().textContent).toBe(type);
  await user.click(toggle);
  expect(label().textContent).toBe("null");
});

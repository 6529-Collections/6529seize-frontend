import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WavesList from "@/components/waves/list/WavesList";
import { AuthContext } from "@/components/auth/Auth";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { useRouter } from "next/navigation";

let currentParams = new URLSearchParams();

jest.mock("next/navigation", () => {
  return {
    useRouter: jest.fn(),
    usePathname: () => "/waves",
    useSearchParams: () => ({
      get: (key: string) => currentParams.get(key),
      toString: () => currentParams.toString(),
    }),
  };
});

jest.mock(
  "@/components/waves/list/header/WavesListHeader",
  () => (props: any) =>
    (
      <div>
        <button onClick={() => props.setIdentity("bob")} data-testid="set-id" />
        <button
          onClick={() => props.setIdentity(null)}
          data-testid="clear-id"
        />
      </div>
    )
);

jest.mock("@/components/waves/list/WavesListWrapper", () => (props: any) => (
  <div data-testid={`wrapper-${props.overviewType}`}>
    <span data-testid={`showall-${props.overviewType}`}>
      {String(props.showAllType)}
    </span>
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

jest.mock(
  "@/components/waves/list/WavesListSearchResults",
  () => (props: any) =>
    <div data-testid="search-results">{props.identity ?? ""}</div>
);

const push = jest.fn((url: string) => {
  const query = url.split("?")[1];
  currentParams = new URLSearchParams(query || "");
});

const router = { push } as any;
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

  // Initially, identity is null
  expect(screen.queryByTestId("search-results")).not.toBeInTheDocument();

  // Simulate setting identity to "bob"
  await user.click(screen.getByTestId("set-id"));

  // Component should update and show "bob"
  const result = await screen.findByTestId("search-results");
  expect(result).toHaveTextContent("bob");
  expect(push).toHaveBeenLastCalledWith("/waves?identity=bob");

  // Simulate clearing identity
  await user.click(screen.getByTestId("clear-id"));

  // Component should remove search results
  await waitFor(() =>
    expect(screen.queryByTestId("search-results")).not.toBeInTheDocument()
  );
  expect(push).toHaveBeenLastCalledWith("/waves");
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

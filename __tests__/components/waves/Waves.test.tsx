import { AuthContext } from "@/components/auth/Auth";
import Waves from "@/components/waves/Waves";
import { TitleProvider } from "@/contexts/TitleContext";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: () => "/waves",
}));

jest.mock("@/components/waves/create-wave/CreateWave", () => {
  return () => <div data-testid="create-wave">CreateWave</div>;
});

jest.mock("@/components/waves/create-dm/CreateDirectMessage", () => {
  return () => <div data-testid="create-dm">CreateDM</div>;
});

jest.mock("@/components/waves/list/WavesList", () => {
  return function MockWavesList(props: any) {
    return (
      <div>
        <button onClick={props.onCreateNewWave}>open-create-wave</button>
        <button onClick={props.onCreateNewDirectMessage}>open-create-dm</button>
      </div>
    );
  };
});

const { useSearchParams } = jest.requireMock("next/navigation");

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

function renderWaves(params: Map<string, string | null>) {
  (useSearchParams as jest.Mock).mockReturnValue({
    get: (key: string) => params.get(key) ?? null,
  });
  return render(
    <AuthContext.Provider value={baseAuth as any}>
      <TitleProvider>
        <Waves />
      </TitleProvider>
    </AuthContext.Provider>
  );
}

it("shows CreateWave when ?new is present", () => {
  renderWaves(new Map([["new", "1"]]));
  expect(screen.getByTestId("create-wave")).toBeInTheDocument();
});

it("shows CreateDM when ?new-dm is present", () => {
  renderWaves(new Map([["new-dm", "1"]]));
  expect(screen.getByTestId("create-dm")).toBeInTheDocument();
});

it("switches view modes on button clicks", async () => {
  const user = userEvent.setup();
  const { unmount } = renderWaves(new Map());
  await user.click(screen.getByText("open-create-wave"));
  expect(screen.getByTestId("create-wave")).toBeInTheDocument();
  unmount();

  renderWaves(new Map());
  await user.click(screen.getByText("open-create-dm"));
  expect(screen.getByTestId("create-dm")).toBeInTheDocument();
});

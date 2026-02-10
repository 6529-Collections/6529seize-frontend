import { AuthContext } from "@/components/auth/Auth";
import Waves from "@/components/waves/Waves";
import { TitleProvider } from "@/contexts/TitleContext";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: () => "/waves",
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
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
const { default: useDeviceInfo } = require("@/hooks/useDeviceInfo");
const deviceInfoMock = useDeviceInfo as jest.Mock;

const mockRouter = { push: jest.fn(), replace: jest.fn() };

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  deviceInfoMock.mockReturnValue({ isApp: false });
});

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
  const searchParamsInstance = new URLSearchParams();
  for (const [key, value] of params) {
    if (value !== null && value !== undefined) {
      searchParamsInstance.set(key, value);
    }
  }
  (useSearchParams as jest.Mock).mockReturnValue({
    get: (key: string) => params.get(key) ?? null,
    toString: () => searchParamsInstance.toString(),
  });
  return render(
    <AuthContext.Provider value={baseAuth as any}>
      <TitleProvider>
        <Waves />
      </TitleProvider>
    </AuthContext.Provider>
  );
}

it("shows CreateWave when ?create=wave is present", () => {
  deviceInfoMock.mockReturnValue({ isApp: true });
  renderWaves(new Map([["create", "wave"]]));
  expect(screen.getByTestId("create-wave")).toBeInTheDocument();
});

it("shows CreateDM when ?create=dm is present", () => {
  deviceInfoMock.mockReturnValue({ isApp: true });
  renderWaves(new Map([["create", "dm"]]));
  expect(screen.getByTestId("create-dm")).toBeInTheDocument();
});

it("navigates on button clicks", async () => {
  const user = userEvent.setup();
  const { unmount } = renderWaves(new Map());

  await user.click(screen.getByText("open-create-wave"));
  expect(mockRouter.replace).toHaveBeenCalledWith("/waves?create=wave", {
    scroll: false,
  });

  unmount();
  renderWaves(new Map());

  await user.click(screen.getByText("open-create-dm"));
  expect(mockRouter.replace).toHaveBeenCalledWith("/waves?create=dm", {
    scroll: false,
  });
});

it("navigates to app create routes when running in app", async () => {
  deviceInfoMock.mockReturnValue({ isApp: true });

  const user = userEvent.setup();
  renderWaves(new Map());

  await user.click(screen.getByText("open-create-wave"));
  expect(mockRouter.push).toHaveBeenCalledWith("/waves/create");
  expect(mockRouter.replace).not.toHaveBeenCalled();
  mockRouter.replace.mockReset();

  await user.click(screen.getByText("open-create-dm"));
  expect(mockRouter.push).toHaveBeenCalledWith("/messages/create");
  expect(mockRouter.replace).not.toHaveBeenCalled();

  deviceInfoMock.mockReturnValue({ isApp: false });
});

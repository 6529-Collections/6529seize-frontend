import {
  EULAConsentProvider,
  useEULAConsent,
} from "@/components/eula/EULAConsentContext";
import {
  CONSENT_EULA_COOKIE,
  CURRENT_EULA_VERSION,
  EULA_VALIDITY_MS,
} from "@/constants/constants";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React, { useEffect } from "react";

let mockPathname = "/";
const mockRouterReplace = jest.fn();
const mockRouter = { replace: mockRouterReplace };

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => mockRouter,
}));

jest.mock("js-cookie", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock("@/components/eula/EULAModal", () => ({
  __esModule: true,
  default: function MockEULAModal() {
    const {
      useEULAConsent: useConsent,
    } = require("@/components/eula/EULAConsentContext");
    const { consent, saveError, isSaving } = useConsent();
    return (
      <div role="dialog" aria-label="EULA" data-testid="modal">
        {saveError && <p role="alert">{saveError}</p>}
        <button type="button" onClick={() => void consent()}>
          {isSaving ? "Saving" : "Agree"}
        </button>
      </div>
    );
  },
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

let mockCapacitor = {
  isIos: true,
  isAndroid: false,
  isCapacitor: true,
  platform: "ios",
};

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => mockCapacitor,
}));

jest.mock("@capacitor/device", () => ({
  Device: { getId: jest.fn() },
}));

const { get, set } = require("js-cookie");
const { commonApiFetch, commonApiPost } = require("@/services/api/common-api");
const { Device } = require("@capacitor/device");

function renderProvider(children: React.ReactNode) {
  return render(
    <EULAConsentProvider
      initialIsIos={mockCapacitor.isIos}
      initialConsentVersion={get()}
    >
      {children}
    </EULAConsentProvider>
  );
}

function AppChild({ onMount = jest.fn() }: { readonly onMount?: () => void }) {
  useEffect(() => {
    onMount();
  }, [onMount]);
  return <div data-testid="app-child">Application</div>;
}

describe("EULAConsentContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/";
    mockCapacitor = {
      isIos: true,
      isAndroid: false,
      isCapacitor: true,
      platform: "ios",
    };
    get.mockReturnValue(undefined);
    Device.getId.mockResolvedValue({ identifier: "device-1" });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("useEULAConsent throws outside provider", () => {
    const Wrapper = () => {
      useEULAConsent();
      return null;
    };
    expect(() => render(<Wrapper />)).toThrow(
      "useEULAConsent must be used within a EULAConsentProvider"
    );
  });

  it("shows the mandatory EULA for a new iOS device with no consent", async () => {
    commonApiFetch.mockResolvedValue({});

    renderProvider(<AppChild />);

    expect(await screen.findByRole("dialog", { name: "EULA" })).toBeVisible();
    expect(screen.queryByTestId("app-child")).not.toBeInTheDocument();
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "policies/eula-consent/device-1",
      errorMode: "structured",
    });
  });

  it.each(["/access", "/restricted"])(
    "allows the staging access-control route %s to mount before EULA verification",
    (pathname) => {
      mockPathname = pathname;

      renderProvider(<AppChild />);

      expect(screen.getByTestId("app-child")).toBeVisible();
      expect(commonApiFetch).not.toHaveBeenCalled();
    }
  );

  it.each([
    { status: 401, route: "/access" },
    { status: 403, route: "/restricted" },
  ])(
    "routes a staging $status response to $route without unlocking the app",
    async ({ status, route }) => {
      commonApiFetch.mockRejectedValue({ status });

      renderProvider(<AppChild />);

      await waitFor(() =>
        expect(mockRouterReplace).toHaveBeenCalledWith(route)
      );
      expect(screen.queryByTestId("app-child")).not.toBeInTheDocument();
    }
  );

  it("accepts a valid current-version cookie without a backend check", async () => {
    get.mockReturnValue(CURRENT_EULA_VERSION);

    renderProvider(<AppChild />);

    expect(screen.getByTestId("app-child")).toBeVisible();
    expect(commonApiFetch).not.toHaveBeenCalled();
  });

  it("restores a current backend acceptance into the versioned cookie", async () => {
    const acceptedAt = Date.now() - 1_000;
    commonApiFetch.mockResolvedValue({
      accepted_at: acceptedAt,
      eula_version: CURRENT_EULA_VERSION,
    });

    renderProvider(<AppChild />);

    expect(await screen.findByTestId("app-child")).toBeVisible();
    expect(set).toHaveBeenCalledWith(
      CONSENT_EULA_COOKIE,
      CURRENT_EULA_VERSION,
      { expires: new Date(acceptedAt + EULA_VALIDITY_MS) }
    );
  });

  it.each([
    {
      name: "expired acceptance",
      getResponse: () => ({
        accepted_at: Date.now() - EULA_VALIDITY_MS - 1,
        eula_version: CURRENT_EULA_VERSION,
      }),
    },
    {
      name: "different EULA version",
      getResponse: () => ({
        accepted_at: Date.now() - 1_000,
        eula_version: "2025-01-01",
      }),
    },
    {
      name: "unversioned acceptance",
      getResponse: () => ({ accepted_at: Date.now() - 1_000 }),
    },
  ])("requires acceptance for a $name", async ({ getResponse }) => {
    commonApiFetch.mockResolvedValue(getResponse());

    renderProvider(<AppChild />);

    expect(await screen.findByRole("dialog", { name: "EULA" })).toBeVisible();
    expect(screen.queryByTestId("app-child")).not.toBeInTheDocument();
    expect(set).not.toHaveBeenCalled();
  });

  it("treats the legacy boolean cookie as stale", async () => {
    get.mockReturnValue("true");
    commonApiFetch.mockResolvedValue({});

    renderProvider(<AppChild />);

    expect(await screen.findByRole("dialog", { name: "EULA" })).toBeVisible();
    expect(commonApiFetch).toHaveBeenCalled();
  });

  it("fails closed with Retry when the consent check fails", async () => {
    commonApiFetch.mockRejectedValue(new Error("offline"));

    renderProvider(<AppChild />);

    expect(
      await screen.findByText("We couldn't verify your EULA acceptance")
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    expect(screen.queryByTestId("app-child")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "EULA" })
    ).not.toBeInTheDocument();
  });

  it("retries a failed consent check without unlocking early", async () => {
    commonApiFetch
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({});

    renderProvider(<AppChild />);
    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("dialog", { name: "EULA" })).toBeVisible();
    expect(screen.queryByTestId("app-child")).not.toBeInTheDocument();
    expect(commonApiFetch).toHaveBeenCalledTimes(2);
  });

  it("ignores a stale consent check after the platform state changes", async () => {
    let rejectCheck: (reason: Error) => void = () => undefined;
    commonApiFetch.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectCheck = reject;
      })
    );

    const result = renderProvider(<AppChild />);
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(1));

    mockCapacitor = {
      isIos: false,
      isAndroid: true,
      isCapacitor: true,
      platform: "android",
    };
    result.rerender(
      <EULAConsentProvider initialIsIos={false}>
        <AppChild />
      </EULAConsentProvider>
    );
    expect(await screen.findByTestId("app-child")).toBeVisible();

    await act(async () => rejectCheck(new Error("stale request")));
    expect(screen.getByTestId("app-child")).toBeVisible();
    expect(
      screen.queryByText("We couldn't verify your EULA acceptance")
    ).not.toBeInTheDocument();
  });

  it("keeps the EULA visible with a retryable error when saving fails", async () => {
    commonApiFetch.mockResolvedValue({});
    commonApiPost.mockRejectedValue(new Error("save failed"));

    renderProvider(<AppChild />);
    fireEvent.click(await screen.findByRole("button", { name: "Agree" }));

    expect(
      await screen.findByText(
        "We couldn't save your acceptance. Please try again."
      )
    ).toBeVisible();
    expect(screen.getByRole("dialog", { name: "EULA" })).toBeVisible();
    expect(screen.queryByTestId("app-child")).not.toBeInTheDocument();
    expect(set).not.toHaveBeenCalled();
  });

  it("unlocks the app only after successful versioned acceptance", async () => {
    const onMount = jest.fn();
    commonApiFetch.mockResolvedValue({});
    commonApiPost.mockResolvedValue({});

    renderProvider(<AppChild onMount={onMount} />);
    expect(onMount).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Agree" }));

    await waitFor(() => expect(onMount).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-child")).toBeVisible();
    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "policies/eula-consent",
      body: {
        device_id: "device-1",
        platform: "ios",
        eula_version: CURRENT_EULA_VERSION,
      },
      errorMode: "structured",
    });
    expect(set).toHaveBeenCalledWith(
      CONSENT_EULA_COOKIE,
      CURRENT_EULA_VERSION,
      { expires: 365 }
    );
  });

  it("routes an expired staging credential during acceptance back to the access screen", async () => {
    commonApiFetch.mockResolvedValue({});
    commonApiPost.mockRejectedValue({ status: 401 });

    renderProvider(<AppChild />);
    fireEvent.click(await screen.findByRole("button", { name: "Agree" }));

    await waitFor(() =>
      expect(mockRouterReplace).toHaveBeenCalledWith("/access")
    );
    expect(screen.getByRole("dialog", { name: "EULA" })).toBeVisible();
    expect(screen.queryByTestId("app-child")).not.toBeInTheDocument();
    expect(set).not.toHaveBeenCalled();
  });

  it("does not mount app children while the iOS check is pending", async () => {
    const onMount = jest.fn();
    let resolveCheck: (value: object) => void = () => undefined;
    commonApiFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve;
      })
    );

    renderProvider(<AppChild onMount={onMount} />);

    const status = screen.getByRole("status");
    const checkingScreen = status.closest("main");
    const logo = checkingScreen?.querySelector('span[aria-hidden="true"]');
    expect(status).toHaveTextContent("Checking EULA acceptance");
    expect(status).toHaveClass("tw-sr-only");
    expect(checkingScreen).toHaveAttribute("aria-busy", "true");
    expect(logo).toHaveClass("tw-opacity-0");
    await waitFor(() => expect(logo).toHaveClass("tw-opacity-80"));
    expect(onMount).not.toHaveBeenCalled();
    expect(screen.queryByTestId("app-child")).not.toBeInTheDocument();

    await act(async () => resolveCheck({}));
    expect(await screen.findByRole("dialog", { name: "EULA" })).toBeVisible();
    expect(onMount).not.toHaveBeenCalled();
  });

  it.each([
    { name: "Android", platform: "android", isIos: false, isAndroid: true },
    { name: "web", platform: "web", isIos: false, isAndroid: false },
  ])("leaves $name behavior unaffected", ({ platform, isIos, isAndroid }) => {
    mockCapacitor = {
      isIos,
      isAndroid,
      isCapacitor: platform !== "web",
      platform,
    };

    renderProvider(<AppChild />);

    expect(screen.getByTestId("app-child")).toBeVisible();
    expect(commonApiFetch).not.toHaveBeenCalled();
    expect(Device.getId).not.toHaveBeenCalled();
  });
});

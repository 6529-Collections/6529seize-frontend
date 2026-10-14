import { CURRENT_EULA_VERSION } from "@/constants/constants";
import { render, screen } from "@testing-library/react";

// Shared registry on purpose: whether the EULA chunk has been fetched is the
// behavior under test, so the order below is meaningful.
let mockEulaModalLoads = 0;
let mockDynamicOptions: { loading?: () => React.ReactNode } | undefined;

jest.mock("next/dynamic", () => {
  const actualDynamic = jest.requireActual("next/dynamic");
  const dynamic = actualDynamic.default ?? actualDynamic;
  return (loader: unknown, options: { loading?: () => React.ReactNode }) => {
    mockDynamicOptions = options;
    return dynamic(loader, options);
  };
});

jest.mock("@/components/eula/EULAModal", () => {
  mockEulaModalLoads += 1;
  return {
    __esModule: true,
    default: () => <div role="dialog" aria-label="EULA" />,
  };
});

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("js-cookie", () => ({ get: jest.fn(), set: jest.fn() }));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn().mockResolvedValue({}),
  commonApiPost: jest.fn(),
}));

let mockIsIos = false;
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: mockIsIos }),
}));

jest.mock("@capacitor/device", () => ({
  Device: { getId: jest.fn().mockResolvedValue({ identifier: "device-1" }) },
}));

// Required after the mock state above so next/dynamic can record its options
// while the provider module evaluates.
const { EULAConsentProvider } = require("@/components/eula/EULAConsentContext");

describe("EULA modal chunk", () => {
  it("is never fetched on devices that do not need the agreement", () => {
    mockIsIos = false;
    render(
      <EULAConsentProvider initialIsIos={false}>
        <div data-testid="app-child" />
      </EULAConsentProvider>
    );

    expect(screen.getByTestId("app-child")).toBeInTheDocument();
    expect(mockEulaModalLoads).toBe(0);
  });

  it("is not fetched for iOS devices that already accepted the current version", () => {
    mockIsIos = true;
    render(
      <EULAConsentProvider
        initialIsIos
        initialConsentVersion={CURRENT_EULA_VERSION}
      >
        <div data-testid="app-child" />
      </EULAConsentProvider>
    );

    expect(screen.getByTestId("app-child")).toBeInTheDocument();
    expect(mockEulaModalLoads).toBe(0);
  });

  it("loads for an iOS device that must accept, keeping the app gated", async () => {
    mockIsIos = true;
    render(
      <EULAConsentProvider initialIsIos>
        <div data-testid="app-child" />
      </EULAConsentProvider>
    );

    expect(await screen.findByRole("dialog", { name: "EULA" })).toBeVisible();
    expect(mockEulaModalLoads).toBe(1);
    expect(screen.queryByTestId("app-child")).toBeNull();
  });

  it("holds the same full-screen checking state while the chunk loads", () => {
    const loading = mockDynamicOptions?.loading;
    expect(loading).toBeDefined();

    const { container } = render(<>{loading?.()}</>);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking EULA acceptance"
    );
    expect(container.querySelector("main[aria-busy='true']")).not.toBeNull();
    // The logo is already visible, so the checking screen does not blink
    // when it hands over to the loading state.
    expect(container.querySelector("main > span[aria-hidden]")).toHaveClass(
      "tw-opacity-80"
    );
  });
});

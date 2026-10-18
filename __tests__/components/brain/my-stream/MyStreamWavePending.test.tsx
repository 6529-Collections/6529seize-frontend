import { fireEvent, render, screen } from "@testing-library/react";
import MyStreamWavePending from "@/components/brain/my-stream/MyStreamWavePending";
import type { SupportedLocale } from "@/i18n/locales";

const mockSetActive = jest.fn();
let mockIsApp = false;
let mockPathname = "/waves/next";
let mockLocale: SupportedLocale = "en-US";
const preview = {
  id: "next",
  name: "Next Wave",
  picture: null,
  contributors: [],
};

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null, activeProfileProxy: null }),
}));

jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    activeWave: { id: "previous", set: mockSetActive },
    waves: { list: [preview] },
    directMessages: {
      list: [{ ...preview, id: "dm", name: "A direct message" }],
    },
  }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: mockIsApp }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => mockLocale,
}));
jest.mock("@/components/waves/WavePicture", () => ({
  __esModule: true,
  default: () => <span data-testid="wave-picture" />,
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ waveViewStyle: { height: "726px" } }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockIsApp = false;
  mockPathname = "/waves/next";
  mockLocale = "en-US";
});

it.each<SupportedLocale>(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"])(
  "shows the requested identity immediately in %s",
  (locale) => {
    mockLocale = locale;
    render(<MyStreamWavePending waveId="next" />);
    expect(screen.getByRole("heading")).toHaveTextContent("Next Wave");
    expect(screen.getByRole("status")).toHaveTextContent("Loading Next Wave…");
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByRole("heading")).toHaveAccessibleName("Next Wave");
    expect(
      screen.queryByRole("button", { name: "Next Wave" })
    ).not.toBeInTheDocument();
  }
);

it("uses a generic loading state for a deep link absent from the list", () => {
  render(<MyStreamWavePending waveId="unknown" />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading wave…");
  expect(screen.queryByText("Next Wave")).not.toBeInTheDocument();
});

it("updates the pending identity on rapid switches", () => {
  const { rerender } = render(<MyStreamWavePending waveId="next" />);
  rerender(<MyStreamWavePending waveId="dm" />);
  expect(screen.getByRole("heading")).toHaveTextContent("A direct message");
  expect(screen.queryByText("Next Wave")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Back to messages" }));
  expect(mockSetActive).toHaveBeenCalledWith(null, { isDirectMessage: true });
});

it("keeps native identity in the existing app header", () => {
  mockIsApp = true;
  render(<MyStreamWavePending waveId="next" />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading Next Wave…");
  expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  expect(screen.getByTestId("wave-pending").style.height).toBe("726px");
});

it("offers recovery after a failed metadata request", () => {
  const retry = jest.fn();
  render(<MyStreamWavePending waveId="next" isError onRetry={retry} />);
  expect(screen.getByRole("heading")).toHaveTextContent("Next Wave");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "This wave could not be loaded."
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledTimes(1);
});

it("preserves a competition's own recovery state", () => {
  render(
    <MyStreamWavePending waveId="next">
      <div role="alert">Competition unavailable</div>
    </MyStreamWavePending>
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Competition unavailable"
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("keeps cold DM deep links in Messages even without a list preview", () => {
  mockPathname = "/messages/unknown";
  render(<MyStreamWavePending waveId="unknown" />);
  expect(screen.getByRole("heading")).toHaveTextContent("Loading wave…");
  fireEvent.click(screen.getByRole("button", { name: "Back to messages" }));
  expect(mockSetActive).toHaveBeenCalledWith(null, { isDirectMessage: true });
});

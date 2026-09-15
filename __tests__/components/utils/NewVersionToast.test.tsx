import { fireEvent, render, screen } from "@testing-library/react";
import NewVersionToast from "@/components/utils/NewVersionToast";
import { useVersionStatus } from "@/contexts/VersionStatusContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { refreshAppVersion } from "@/helpers/version-refresh.helpers";

jest.mock("@/contexts/VersionStatusContext", () => ({
  useVersionStatus: jest.fn(),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/helpers/version-refresh.helpers", () => ({
  refreshAppVersion: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useVersionStatus).mockReturnValue(true);
  jest.mocked(useDeviceInfo).mockReturnValue({
    isApp: false,
    isMobileDevice: true,
    isAppleMobile: false,
    hasTouchScreen: true,
  });
  Object.defineProperty(navigator, "languages", {
    configurable: true,
    value: ["en-US"],
  });
});

it("retains the full mobile-browser toast and uses the shared updating flow", () => {
  render(<NewVersionToast />);
  expect(screen.getByText("A new version is available")).toBeInTheDocument();
  expect(screen.getByText("Yes, again!")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Refresh page" }));
  expect(refreshAppVersion).toHaveBeenCalledTimes(1);
});

it("leaves native app updates to the dock", () => {
  jest.mocked(useDeviceInfo).mockReturnValue({
    isApp: true,
    isMobileDevice: true,
    isAppleMobile: true,
    hasTouchScreen: true,
  });
  const { container } = render(<NewVersionToast />);
  expect(container).toBeEmptyDOMElement();
});

it("hides the toast when no update is available", () => {
  jest.mocked(useVersionStatus).mockReturnValue(false);
  const { container } = render(<NewVersionToast />);
  expect(container).toBeEmptyDOMElement();
});

it("preserves localized toast labels", () => {
  Object.defineProperty(navigator, "languages", {
    configurable: true,
    value: ["fr-FR"],
  });
  render(<NewVersionToast />);
  expect(
    screen.getByText("Une nouvelle version est disponible")
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Actualiser la page" })
  ).toBeInTheDocument();
});

it("leaves desktop updates to the sidebar", () => {
  jest.mocked(useDeviceInfo).mockReturnValue({
    isApp: false,
    isMobileDevice: false,
    isAppleMobile: false,
    hasTouchScreen: false,
  });
  const { container } = render(<NewVersionToast />);
  expect(container).toBeEmptyDOMElement();
});

it("retains the toast on an iPad using desktop browsing with a pointer", () => {
  jest.mocked(useDeviceInfo).mockReturnValue({
    isApp: false,
    isMobileDevice: false,
    isAppleMobile: true,
    hasTouchScreen: false,
  });
  render(<NewVersionToast />);
  expect(
    screen.getByRole("button", { name: "Refresh page" })
  ).toBeInTheDocument();
});

import { fireEvent, render, screen } from "@testing-library/react";
import NewVersionToast from "@/components/utils/NewVersionToast";
import { useVersionStatus } from "@/contexts/VersionStatusContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { refreshAppVersion } from "@/helpers/version-refresh.helpers";

jest.mock("@/contexts/VersionStatusContext", () => ({
  useVersionStatus: jest.fn(),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: jest.fn() }));
jest.mock("@/helpers/version-refresh.helpers", () => ({
  refreshAppVersion: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useVersionStatus).mockReturnValue(true);
  jest
    .mocked(useDeviceInfo)
    .mockReturnValue({ isApp: false } as ReturnType<typeof useDeviceInfo>);
  jest.mocked(useMediaQuery).mockReturnValue(false);
  Object.defineProperty(navigator, "languages", {
    configurable: true,
    value: ["en-US"],
  });
});

it("retains the desktop prompt and update action", () => {
  render(<NewVersionToast />);
  expect(screen.getByText("A new version is available")).toBeInTheDocument();
  expect(screen.getByText("Yes, again!")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Refresh page" }));
  expect(refreshAppVersion).toHaveBeenCalledTimes(1);
});

it.each([
  [true, false],
  [false, true],
  [true, true],
])("leaves mobile updates to the dock (app=%s, phone=%s)", (isApp, isPhone) => {
  jest
    .mocked(useDeviceInfo)
    .mockReturnValue({ isApp } as ReturnType<typeof useDeviceInfo>);
  jest.mocked(useMediaQuery).mockReturnValue(isPhone);
  const { container } = render(<NewVersionToast />);
  expect(container).toBeEmptyDOMElement();
});

it("hides the desktop prompt when no update is available", () => {
  jest.mocked(useVersionStatus).mockReturnValue(false);
  const { container } = render(<NewVersionToast />);
  expect(container).toBeEmptyDOMElement();
});

it("preserves localized desktop labels", () => {
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

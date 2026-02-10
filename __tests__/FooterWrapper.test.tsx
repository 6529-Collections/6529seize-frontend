import FooterWrapper from "@/components/footer/FooterWrapper";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isMobileDevice: false,
    hasTouchScreen: false,
    isApp: false,
  })),
}));
jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));
jest.mock("@/components/footer/Footer", () => ({
  __esModule: true,
  default: () => <div data-testid="footer" />,
}));

const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;
const usePathnameMock = usePathname as jest.Mock;

describe("FooterWrapper", () => {
  beforeEach(() => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    usePathnameMock.mockReturnValue("/");
  });

  it("hides footer when running in app", () => {
    useDeviceInfoMock.mockReturnValue({ isApp: true } as any);
    const { container } = render(<FooterWrapper />);
    expect(container.firstChild).toBeNull();
  });

  it("hides footer on specific routes", () => {
    usePathnameMock.mockReturnValue("/waves/123");
    const { container } = render(<FooterWrapper />);
    expect(container.firstChild).toBeNull();
  });

  it("renders footer otherwise", () => {
    usePathnameMock.mockReturnValue("/other");
    render(<FooterWrapper />);
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });
});

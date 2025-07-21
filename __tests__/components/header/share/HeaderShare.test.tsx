import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HeaderShare from "@/components/header/share/HeaderShare";
import useCapacitor from "@/hooks/useCapacitor";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { SeizeConnectProvider } from "@/components/auth/SeizeConnectContext";
import WagmiSetup from "@/components/providers/WagmiSetup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mocks
jest.mock("@/hooks/useCapacitor");
jest.mock("@/hooks/isMobileDevice");

// next/navigation mocks
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => "/mock-path",
  useSearchParams: () => {
    return new URLSearchParams("something=value");
  },
}));

const queryClient = new QueryClient();

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <WagmiSetup>
        <SeizeConnectProvider>{component}</SeizeConnectProvider>
      </WagmiSetup>
    </QueryClientProvider>
  );
};

// Image mock (should live in jest.setup.ts ideally)
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img alt="" {...props} />,
}));

// QRCode mock
jest.mock("qrcode", () => ({
  toDataURL: jest.fn(() => Promise.resolve("data:image/png;base64,FAKE")),
}));

const mockUseCapacitor = useCapacitor as jest.MockedFunction<
  typeof useCapacitor
>;
const mockIsMobile = useIsMobileDevice as jest.MockedFunction<
  typeof useIsMobileDevice
>;

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe("HeaderShare", () => {
  afterEach(() => {
    jest.clearAllMocks();
    (navigator.clipboard.writeText as jest.Mock).mockReset?.();
  });

  it("renders nothing when running in Capacitor", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: true } as any);
    mockIsMobile.mockReturnValue(false);
    const { container } = render(<HeaderShare />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing on mobile devices", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(true);
    const { container } = render(<HeaderShare />);
    expect(container.firstChild).toBeNull();
  });

  it("shows QR button and opens modal on click", async () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    renderWithProviders(<HeaderShare />);

    const btn = screen.getByRole("button", { name: "QR Code" });
    await userEvent.click(btn);

    expect(await screen.findByTestId("header-share-modal")).toBeInTheDocument();
    expect(screen.getByText("Current URL")).toBeInTheDocument();
  });

  it("copies url to clipboard", async () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);

    renderWithProviders(<HeaderShare />);

    const btn = screen.getByRole("button", { name: "QR Code" });
    await userEvent.click(btn);

    const modal = await screen.findByTestId("header-share-modal");
    const copyIcon = modal.querySelector('[data-icon="copy"]') as HTMLElement;

    expect(copyIcon).toBeInTheDocument();
    await userEvent.click(copyIcon);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it("generates QR codes when modal opens", async () => {
    const qrcode = require("qrcode");
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);

    renderWithProviders(<HeaderShare />);

    const btn = screen.getByRole("button", { name: "QR Code" });
    await userEvent.click(btn);

    await screen.findByTestId("header-share-modal");
    expect(qrcode.toDataURL).toHaveBeenCalled();
  });
});

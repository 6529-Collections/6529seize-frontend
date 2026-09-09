import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import PushNotificationSettings from "@/components/header/PushNotificationSettings";

let mockRestricted = true;
jest.mock("@/hooks/useNftPurchasingVisibility", () => ({
  useNftPurchasingVisibility: () => ({ hideNftPurchasing: mockRestricted }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: jest.fn() }),
}));
jest.mock("@/components/notifications/stable-device-id", () => ({
  getStableDeviceId: async () => "test-device",
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: async () => ({
    identity_subscribed: true,
    subscription_coverage: true,
  }),
  commonApiPut: jest.fn(),
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

it.each([true, false])(
  "preserves social settings and hides coverage only when restricted=%s",
  async (restricted) => {
    mockRestricted = restricted;
    render(<PushNotificationSettings isOpen onClose={jest.fn()} />);
    expect(await screen.findByText("New Follows")).toBeInTheDocument();
    expect(screen.queryByText("Subscription Coverage") !== null).toBe(
      !restricted
    );
  }
);

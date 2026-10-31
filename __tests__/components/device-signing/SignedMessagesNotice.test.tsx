import SignedMessagesNotice from "@/components/device-signing/SignedMessagesNotice";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const NOW = Date.UTC(2026, 9, 12, 12, 0);
const DAY = 86_400_000;
const ADDRESS = "0x1111111111111111111111111111111111111111";
const OWN_KEY = `0x${"aa".repeat(32)}`;

let mockEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockEnabled,
}));

const mockRequestGrant = jest.fn();
const mockSetToast = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    requestSignedMessagesGrant: mockRequestGrant,
    setToast: mockSetToast,
  }),
}));

let mockAccount: string | null = ADDRESS;
jest.mock("@/hooks/device-signing/useSignedMessagesAccount", () => ({
  useSignedMessagesAccount: () => mockAccount,
}));

jest.mock("@/hooks/device-signing/useMinuteClock", () => ({
  useMinuteClock: () => NOW,
}));

let mockLocal: {
  loaded: boolean;
  grant: ApiDeviceGrant | null;
  publicKeys: string[];
};
jest.mock("@/hooks/device-signing/useLocalDeviceKeys", () => ({
  useLocalDeviceKeys: () => mockLocal,
}));

let mockGrants: ApiDeviceGrant[] | undefined;
const mockRevoke = jest.fn();
jest.mock("@/hooks/device-signing/useDeviceGrants", () => ({
  useDeviceGrants: () => ({ data: mockGrants }),
  useRevokeDeviceGrant: () => ({ revoke: mockRevoke, isRevoking: false }),
}));

const grant = (overrides: Partial<ApiDeviceGrant> = {}): ApiDeviceGrant =>
  ({
    id: `0x${"1".repeat(64)}`,
    wallet: ADDRESS,
    key_type: "ed25519",
    device_key: OWN_KEY,
    scopes: ["post", "edit", "delete", "react"],
    device_label: "Chrome on macOS",
    domain: "6529.io",
    issued_at: NOW - DAY,
    expires_at: NOW + 100 * DAY,
    created_at: NOW - DAY,
    revoked_at: null,
    last_used_at: null,
    ...overrides,
  }) as ApiDeviceGrant;

const otherDevice = grant({
  id: `0x${"2".repeat(64)}`,
  device_key: `0x${"bb".repeat(32)}`,
  device_label: "Firefox on Windows",
});

describe("SignedMessagesNotice", () => {
  beforeEach(() => {
    localStorage.clear();
    mockEnabled = true;
    mockAccount = ADDRESS;
    mockLocal = { loaded: true, grant: null, publicKeys: [OWN_KEY] };
    mockGrants = [];
    mockRequestGrant.mockReset().mockResolvedValue({ success: true });
    mockRevoke.mockReset();
    mockSetToast.mockReset();
  });

  it("offers to turn on signed messages with one signature while the composer is empty", async () => {
    render(<SignedMessagesNotice composerEmpty />);

    expect(
      screen.getByRole("region", {
        name: "Turn on signed messages (one signature)",
      })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Turn on" }));

    expect(mockRequestGrant).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(mockSetToast).toHaveBeenCalledWith({
        message: "Signed messages are on in this browser.",
        type: "success",
      })
    );
  });

  it("stays out of the way while the user is typing", () => {
    render(<SignedMessagesNotice composerEmpty={false} />);
    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();
  });

  it("remembers a dismissal for this wallet", () => {
    const { rerender } = render(<SignedMessagesNotice composerEmpty />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();
    rerender(<SignedMessagesNotice composerEmpty />);
    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();
    expect(localStorage.getItem("6529-signed-messages-notice")).toContain(
      ADDRESS
    );
  });

  it("shows nothing while this browser holds an active grant", () => {
    mockLocal = { ...mockLocal, grant: grant() };
    render(<SignedMessagesNotice composerEmpty />);
    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();
  });

  it("reminds in the grant's last 14 days and after it expires", () => {
    mockLocal = { ...mockLocal, grant: grant({ expires_at: NOW + 5 * DAY }) };
    const { rerender } = render(<SignedMessagesNotice composerEmpty />);
    expect(screen.getByText(/^Signed messages end on/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Renew" })).toBeVisible();

    mockLocal = { ...mockLocal, grant: grant({ expires_at: NOW - DAY }) };
    rerender(<SignedMessagesNotice composerEmpty />);
    expect(
      screen.getByText("Signed messages have ended in this browser")
    ).toBeVisible();
  });

  it("renders nothing without an eligible account or with the flag off", () => {
    mockAccount = null;
    const { rerender } = render(<SignedMessagesNotice composerEmpty />);
    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();

    mockAccount = ADDRESS;
    mockEnabled = false;
    rerender(<SignedMessagesNotice composerEmpty />);
    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();
  });

  describe("new-device alert", () => {
    beforeEach(() => {
      mockLocal = { ...mockLocal, grant: grant() };
    });

    it("treats the first list as a baseline and alerts only for later grants", () => {
      mockGrants = [grant(), otherDevice];
      const { rerender } = render(
        <SignedMessagesNotice composerEmpty={false} />
      );
      expect(screen.queryByTestId("signed-messages-notice")).toBeNull();

      const newDevice = grant({
        id: `0x${"3".repeat(64)}`,
        device_key: `0x${"cc".repeat(32)}`,
        device_label: "Safari on iPhone",
      });
      mockGrants = [newDevice, grant(), otherDevice];
      rerender(<SignedMessagesNotice composerEmpty={false} />);

      expect(
        screen.getByText("Safari on iPhone can now post as you. Not you?")
      ).toBeVisible();
      expect(screen.getByRole("button", { name: "Revoke" })).toBeVisible();
    });

    it("never alerts for this browser's own keys, revoked or expired grants", () => {
      mockGrants = [];
      const { rerender } = render(<SignedMessagesNotice composerEmpty />);
      mockGrants = [
        grant({ id: `0x${"4".repeat(64)}` }),
        { ...otherDevice, revoked_at: NOW - 1 },
        grant({
          id: `0x${"5".repeat(64)}`,
          device_key: `0x${"dd".repeat(32)}`,
          expires_at: NOW - 1,
        }),
      ];
      rerender(<SignedMessagesNotice composerEmpty />);
      expect(screen.queryByText(/can now post as you/)).toBeNull();
    });

    it("revokes the new device and confirms it", async () => {
      mockGrants = [];
      const { rerender } = render(<SignedMessagesNotice composerEmpty />);
      mockGrants = [otherDevice];
      rerender(<SignedMessagesNotice composerEmpty />);
      mockRevoke.mockResolvedValue(true);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
      });

      expect(mockRevoke).toHaveBeenCalledWith(otherDevice);
      expect(screen.queryByText(/can now post as you/)).toBeNull();
    });

    it("keeps the alert when revoking fails and can be dismissed", async () => {
      mockGrants = [];
      const { rerender } = render(<SignedMessagesNotice composerEmpty />);
      mockGrants = [otherDevice];
      rerender(<SignedMessagesNotice composerEmpty />);
      mockRevoke.mockResolvedValue(false);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
      });
      expect(screen.getByText(/can now post as you/)).toBeVisible();

      fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
      expect(screen.queryByText(/can now post as you/)).toBeNull();
    });
  });
});

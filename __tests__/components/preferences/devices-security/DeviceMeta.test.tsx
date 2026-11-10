import { render, screen } from "@testing-library/react";
import type { SecurityDevice } from "@/components/preferences/devices-security/classifyDevices";
import { DeviceMeta } from "@/components/preferences/devices-security/DeviceParts";

const DAY = 86_400_000;
const NOW = Date.now();

const thisBrowser = (
  status: "active" | "expired" | "revoked"
): SecurityDevice => ({
  id: "0xgrant",
  label: "Brave on Windows",
  platform: "web",
  isThisDevice: true,
  signedPosts: {
    status,
    expiresAt: status === "expired" ? NOW - DAY : NOW + 90 * DAY,
    endedAt: status === "active" ? null : NOW - DAY,
  },
  encryptedDms: null,
  grant: null,
  encryptedDevice: null,
  createdAt: NOW - 200 * DAY,
  lastActiveAt: NOW - 2 * DAY,
  expiresAt: status === "active" ? NOW + 90 * DAY : null,
  endedAt: status === "active" ? null : NOW - DAY,
  wallet: null,
  unverified: false,
});

describe("DeviceMeta", () => {
  it("says Active now for this browser while a permission is in force", () => {
    render(<DeviceMeta locale="en-US" device={thisBrowser("active")} />);
    expect(screen.getByText("Active now")).toBeInTheDocument();
  });

  it.each(["expired", "revoked"] as const)(
    "shows the last active time for this browser once %s",
    (status) => {
      render(<DeviceMeta locale="en-US" device={thisBrowser(status)} />);
      expect(screen.queryByText("Active now")).not.toBeInTheDocument();
      expect(screen.getByText(/^Last active /u)).toBeInTheDocument();
    }
  );
});

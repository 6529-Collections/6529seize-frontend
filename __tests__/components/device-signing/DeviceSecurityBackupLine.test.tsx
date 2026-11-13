import { render, screen } from "@testing-library/react";
import {
  DeviceSecurityDetails,
  getBackupLineState,
} from "@/components/device-signing/DeviceSecurityStatus";

const details = {
  proof: "on" as const,
  encrypted: "on" as const,
  proofRenewal: null,
  encryptionRenewal: null,
};

describe("security status backup line", () => {
  it("says when encrypted backup is off", () => {
    render(<DeviceSecurityDetails {...details} backup="off" />);
    expect(screen.getByText(/^Encrypted backup:/)).toHaveTextContent(
      "Encrypted backup: off"
    );
  });

  it("says when it is on", () => {
    render(<DeviceSecurityDetails {...details} backup="on" />);
    expect(screen.getByText(/^Encrypted backup:/)).toHaveTextContent(
      "Encrypted backup: on"
    );
  });

  it("says when a backup exists but this browser isn't in it", () => {
    render(<DeviceSecurityDetails {...details} backup="elsewhere" />);
    expect(screen.getByText(/^Encrypted backup:/)).toHaveTextContent(
      "Encrypted backup: not restored here"
    );
  });

  it("leaves it out while unknown or without encrypted DMs", () => {
    render(<DeviceSecurityDetails {...details} backup={null} />);
    expect(screen.queryByText(/Encrypted backup/)).toBeNull();
  });
});

describe("getBackupLineState", () => {
  it.each([
    ["on", "on", "on"],
    ["on", "off", "off"],
    ["on", "available", "elsewhere"],
    ["on", "loading", null],
    ["on", "error", null],
    ["on", undefined, null],
    ["off", "off", null],
    ["expired", "on", null],
  ] as const)(
    "encrypted DMs %s, backup %s → %s",
    (encrypted, phase, expected) => {
      expect(getBackupLineState(encrypted, phase)).toBe(expected);
    }
  );
});

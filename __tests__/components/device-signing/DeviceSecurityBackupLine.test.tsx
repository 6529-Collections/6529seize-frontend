import { render, screen } from "@testing-library/react";
import { DeviceSecurityDetails } from "@/components/device-signing/DeviceSecurityStatus";

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

  it("leaves it out while unknown or without encrypted DMs", () => {
    render(<DeviceSecurityDetails {...details} backup={null} />);
    expect(screen.queryByText(/Encrypted backup/)).toBeNull();
  });
});

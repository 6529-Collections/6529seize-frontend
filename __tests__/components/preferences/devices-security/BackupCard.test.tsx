import { fireEvent, render, screen } from "@testing-library/react";
import { BackupCard } from "@/components/preferences/devices-security/BackupCard";

let mockE2ee: Record<string, unknown>;
jest.mock("@/hooks/e2ee/useE2ee", () => ({ useE2ee: () => mockE2ee }));
jest.mock("@/components/e2ee/backup/E2eeBackupPanel", () => ({
  E2eeBackupPanel: () => <div>Backup panel</div>,
}));

const base = () => ({
  status: "ready",
  thisDevice: { deviceKey: "0xthis" },
  restart: jest.fn(),
  takeOverHere: jest.fn(),
});

describe("BackupCard", () => {
  beforeEach(() => {
    mockE2ee = base();
  });

  it("shows the backup once encrypted messages run here", () => {
    render(<BackupCard />);
    expect(screen.getByText("Backup panel")).toBeInTheDocument();
  });

  it("keeps loading until the running engine has named this device", () => {
    // Backup can't act for a device the engine hasn't listed yet.
    mockE2ee = { ...base(), thisDevice: null };
    render(<BackupCard />);
    expect(screen.queryByText("Backup panel")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Checking your backup…");
  });

  it.each(["disabled", "proxy"])("renders nothing when %s", (status) => {
    mockE2ee = { ...base(), status };
    const { container } = render(<BackupCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps its place while loading", () => {
    mockE2ee = { ...base(), status: "loading" };
    render(<BackupCard />);
    expect(screen.getByRole("status")).toHaveTextContent("Checking your backup…");
  });

  it("offers Use here while another tab holds encrypted messages", () => {
    mockE2ee = { ...base(), status: "elsewhere" };
    render(<BackupCard />);
    expect(screen.getByText("Unknown")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Use here" }));
    expect(mockE2ee["takeOverHere"]).toHaveBeenCalled();
  });

  it("offers Try again after a failure", () => {
    mockE2ee = { ...base(), status: "load-failed" };
    render(<BackupCard />);
    expect(
      screen.getByText(/Your messages on this device aren’t affected/)
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mockE2ee["restart"]).toHaveBeenCalled();
  });

  it("says to turn on encrypted DMs first, leaving the one button to This device", () => {
    mockE2ee = { ...base(), status: "needs-enrollment" };
    render(<BackupCard />);
    expect(
      screen.getByText(
        "Backup covers encrypted DMs. Turn them on in this browser first."
      )
    ).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Not available")).not.toBeInTheDocument();
  });

  it("says when this browser can't use encrypted messages", () => {
    mockE2ee = { ...base(), status: "unsupported" };
    render(<BackupCard />);
    expect(
      screen.getByText("This browser can’t use encrypted messages")
    ).toBeVisible();
  });
});

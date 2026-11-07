import DiagnosticsPanel from "@/components/diagnostics/DiagnosticsPanel";
import { getFlightSnapshot } from "@/services/diagnostics/flightRecorder";
import {
  captureScreenshot,
  isScreenshotSupported,
} from "@/services/diagnostics/screenshot";
import { sendDiagnostics } from "@/services/diagnostics/sendDiagnostics";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/services/diagnostics/flightRecorder", () => ({
  getFlightSnapshot: jest.fn(),
}));
jest.mock("@/services/diagnostics/screenshot", () => ({
  captureScreenshot: jest.fn(),
  isScreenshotSupported: jest.fn(),
}));
jest.mock("@/services/diagnostics/sendDiagnostics", () => ({
  sendDiagnostics: jest.fn(),
}));

const snapshot = {
  v: 1 as const,
  captured_at: Date.UTC(2026, 10, 6, 10, 0, 0),
  app_version: "4.99.0",
  platform: "web",
  device: "desktop",
  browser: "chrome 142",
  flags: ["NEXT_PUBLIC_FEATURE_DIAGNOSTICS"],
  route: "/waves/[wave]",
  entries: [
    {
      at: Date.UTC(2026, 10, 6, 9, 59, 0),
      k: "nav" as const,
      route: "/waves/[wave]",
    },
    {
      at: Date.UTC(2026, 10, 6, 9, 59, 30),
      k: "api" as const,
      method: "GET",
      endpoint: "/drops/[id]",
      status: 502,
      ms: 812,
      request_id: "a1b2c3d4e5",
    },
    {
      at: Date.UTC(2026, 10, 6, 9, 59, 40),
      k: "error" as const,
      kind: "boundary" as const,
      name: "TypeError",
      message: "Cannot read properties of undefined",
    },
  ],
  previous: {
    saved_at: Date.UTC(2026, 10, 6, 9, 50, 0),
    entries: [
      { at: Date.UTC(2026, 10, 6, 9, 49, 0), k: "nav" as const, route: "/" },
    ],
  },
};

const mockSnapshot = jest.mocked(getFlightSnapshot);
const mockSupported = jest.mocked(isScreenshotSupported);
const mockCapture = jest.mocked(captureScreenshot);
const mockSend = jest.mocked(sendDiagnostics);

beforeEach(() => {
  mockSnapshot.mockReset().mockReturnValue(snapshot);
  mockSupported.mockReset().mockReturnValue(false);
  mockCapture.mockReset();
  mockSend.mockReset();
});

describe("DiagnosticsPanel", () => {
  it("shows a readable preview and sends nothing until Send", async () => {
    render(<DiagnosticsPanel />);
    expect(
      await screen.findByRole("heading", { name: "What will be sent" })
    ).toBeInTheDocument();
    expect(screen.getByText("4.99.0")).toBeInTheDocument();
    expect(screen.getByText("Opened /waves/[wave]")).toBeInTheDocument();
    expect(
      screen.getByText("GET /drops/[id]: status 502, 812 ms")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Before the last reload" })
    ).toBeInTheDocument();
    expect(screen.getByText("Show the exact data")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Error (page crash): TypeError Cannot read properties of undefined"
      )
    ).toBeInTheDocument();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends exactly the previewed snapshot and shows the code", async () => {
    mockSend.mockResolvedValue({
      ok: true,
      code: "D-7K3Q-9XW2",
      expiresAt: "2026-11-20T10:00:00Z",
    });
    const user = userEvent.setup();
    render(<DiagnosticsPanel />);
    await user.click(
      await screen.findByRole("button", { name: "Send diagnostics" })
    );
    expect(mockSend).toHaveBeenCalledWith(snapshot);
    expect(await screen.findByText("D-7K3Q-9XW2")).toBeInTheDocument();
    const heading = screen.getByRole("heading", { name: "Report sent" });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it("copies the code and announces it", async () => {
    mockSend.mockResolvedValue({
      ok: true,
      code: "D-7K3Q-9XW2",
      expiresAt: "",
    });
    // user-event installs its own clipboard stub; spy on it after setup.
    const user = userEvent.setup();
    const writeText = jest.spyOn(navigator.clipboard, "writeText");
    render(<DiagnosticsPanel />);
    await user.click(
      await screen.findByRole("button", { name: "Send diagnostics" })
    );
    await user.click(await screen.findByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith("D-7K3Q-9XW2");
    expect(screen.getByRole("status")).toHaveTextContent("Code copied");
  });

  it("announces a failed copy and leaves the code selected", async () => {
    mockSend.mockResolvedValue({
      ok: true,
      code: "D-7K3Q-9XW2",
      expiresAt: "",
    });
    const user = userEvent.setup();
    jest
      .spyOn(navigator.clipboard, "writeText")
      .mockRejectedValue(new Error("denied"));
    render(<DiagnosticsPanel />);
    await user.click(
      await screen.findByRole("button", { name: "Send diagnostics" })
    );
    await user.click(await screen.findByRole("button", { name: "Copy code" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Copying didn’t work. The code is selected, so you can copy it yourself."
    );
    expect(globalThis.getSelection()?.toString()).toBe("D-7K3Q-9XW2");
  });

  it.each([
    [
      "too_large",
      "The report is too large to send. Remove the screenshot and try again.",
    ],
    [
      "rate_limited",
      "Too many reports were sent from this connection. Try again in an hour.",
    ],
    ["offline", "You seem to be offline. Check your connection and try again."],
  ] as const)(
    "shows an alert when sending fails: %p",
    async (reason, message) => {
      mockSend.mockResolvedValue({ ok: false, reason });
      const user = userEvent.setup();
      render(<DiagnosticsPanel />);
      await user.click(
        await screen.findByRole("button", { name: "Send diagnostics" })
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(
        screen.getByRole("button", { name: "Send diagnostics" })
      ).toBeEnabled();
    }
  );

  it("hides the screenshot option where capture is unsupported", async () => {
    render(<DiagnosticsPanel />);
    await screen.findByRole("heading", { name: "What will be sent" });
    expect(
      screen.queryByRole("checkbox", { name: "Attach a screenshot" })
    ).not.toBeInTheDocument();
  });

  it("keeps the screenshot off by default and attaches it only when chosen", async () => {
    mockSupported.mockReturnValue(true);
    mockCapture.mockResolvedValue("data:image/jpeg;base64,AAAA");
    mockSend.mockResolvedValue({
      ok: true,
      code: "D-AAAA-BBBB",
      expiresAt: "",
    });
    const user = userEvent.setup();
    render(<DiagnosticsPanel />);
    const checkbox = await screen.findByRole("checkbox", {
      name: "Attach a screenshot",
    });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAccessibleDescription(
      expect.stringContaining("Off unless you turn it on")
    );
    expect(mockCapture).not.toHaveBeenCalled();

    await user.click(checkbox);
    await user.click(
      screen.getByRole("button", { name: "Choose what to capture" })
    );
    expect(
      await screen.findByRole("img", {
        name: "Screenshot that will be attached to the report",
      })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send diagnostics" }));
    expect(mockSend).toHaveBeenCalledWith({
      ...snapshot,
      screenshot: "data:image/jpeg;base64,AAAA",
    });
  });

  it("refreshes the preview on request", async () => {
    render(<DiagnosticsPanel />);
    await screen.findByText("Opened /waves/[wave]");
    mockSnapshot.mockReturnValue({ ...snapshot, entries: [], previous: null });
    await act(async () => {
      screen.getByRole("button", { name: "Update preview" }).click();
    });
    expect(
      screen.getByText("Nothing was recorded in the last 5 minutes.")
    ).toBeInTheDocument();
  });
});

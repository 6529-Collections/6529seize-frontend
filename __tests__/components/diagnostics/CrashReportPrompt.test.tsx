import CrashReportPrompt from "@/components/diagnostics/CrashReportPrompt";
import { publicEnv } from "@/config/env";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPanel = jest.fn();

jest.mock("@/config/env", () => ({ publicEnv: {} }));
jest.mock("next/dynamic", () => () => (props: { headingLevel?: number }) => {
  mockPanel(props);
  return <div data-testid="diagnostics-panel" />;
});

const mockEnv = publicEnv as Record<string, string | undefined>;

beforeEach(() => {
  mockPanel.mockClear();
  mockEnv["NEXT_PUBLIC_FEATURE_DIAGNOSTICS"] = "true";
});

describe("CrashReportPrompt", () => {
  it("renders nothing with the diagnostics flag off", () => {
    mockEnv["NEXT_PUBLIC_FEATURE_DIAGNOSTICS"] = undefined;
    const { container } = render(<CrashReportPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers a report without loading or sending anything", () => {
    render(<CrashReportPrompt />);
    expect(
      screen.getByRole("heading", { name: "Send the team a report?" })
    ).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Review the report" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("diagnostics-panel")).not.toBeInTheDocument();
    expect(mockPanel).not.toHaveBeenCalled();
  });

  it("opens the same preview-and-send panel on request", async () => {
    const user = userEvent.setup();
    render(<CrashReportPrompt />);
    await user.click(screen.getByRole("button", { name: "Review the report" }));
    expect(screen.getByTestId("diagnostics-panel")).toBeInTheDocument();
    expect(mockPanel).toHaveBeenCalledWith({ headingLevel: 3 });
    const toggle = screen.getByRole("button", { name: "Hide the report" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(screen.queryByTestId("diagnostics-panel")).not.toBeInTheDocument();
  });
});

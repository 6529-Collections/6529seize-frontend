import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DisplayTimeZoneSwitch, {
  useDisplayTimeZoneMenuItem,
} from "@/components/display-time-zone/DisplayTimeZoneSwitch";
import {
  getDisplayTimeZoneSnapshot,
  resetDisplayTimeZoneSnapshotForTests,
  setDisplayTimeZoneOverride,
  setDisplayTimeZonePreference,
} from "@/lib/display-time-zone/displayTimeZoneStore";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  resetDisplayTimeZoneSnapshotForTests();
});

describe("DisplayTimeZoneSwitch", () => {
  it("offers UTC for this tab next to the saved setting", async () => {
    const user = userEvent.setup();
    render(<DisplayTimeZoneSwitch />);

    await user.click(
      screen.getByRole("button", { name: "Time display: local time" })
    );

    expect(screen.getByRole("radio", { name: /^Local time/ })).toBeChecked();
    expect(
      screen.getByText(/Lasts until you close this tab/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Always use a time zone/ })
    ).toHaveAttribute("href", "/preferences?tab=time-zone");

    await user.click(screen.getByRole("radio", { name: /^UTC/ }));

    expect(getDisplayTimeZoneSnapshot().override).toBe("UTC");
    expect(getDisplayTimeZoneSnapshot().preference).toBe("local");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Times now shown in UTC"
    );
  });

  it("shows a chip with an undo button while the switch is on", async () => {
    const user = userEvent.setup();
    act(() => setDisplayTimeZoneOverride("UTC"));
    render(<DisplayTimeZoneSwitch />);

    expect(screen.getByText("Times in UTC")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Show times in local time again" })
    );

    expect(getDisplayTimeZoneSnapshot().override).toBeNull();
    expect(screen.queryByText("Times in UTC")).not.toBeInTheDocument();
  });

  it("names a saved city zone and offers UTC", async () => {
    const user = userEvent.setup();
    act(() => setDisplayTimeZonePreference("Europe/Berlin"));
    render(<DisplayTimeZoneSwitch />);

    await user.click(
      screen.getByRole("button", { name: "Time display: Berlin" })
    );

    expect(
      screen.getByRole("radio", { name: /Berlin · your setting/ })
    ).toBeChecked();
    expect(screen.getByRole("radio", { name: /^UTC/ })).not.toBeChecked();
  });

  it("offers local time when the setting already is UTC", async () => {
    const user = userEvent.setup();
    act(() => setDisplayTimeZonePreference("UTC"));
    render(<DisplayTimeZoneSwitch />);

    await user.click(screen.getByRole("button", { name: "Time display: UTC" }));

    expect(screen.getByRole("radio", { name: /^UTC/ })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /^Local time/ })
    ).not.toBeChecked();
  });

  it("renders only the chip on compact headers", () => {
    const { rerender } = render(<DisplayTimeZoneSwitch variant="compact" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    act(() => setDisplayTimeZoneOverride("UTC"));
    rerender(<DisplayTimeZoneSwitch variant="compact" />);
    expect(
      screen.getByRole("button", { name: "Time display: UTC" })
    ).toHaveTextContent("UTC");
  });
});

describe("useDisplayTimeZoneMenuItem", () => {
  it("switches to UTC and back from overflow menus", () => {
    const { result } = renderHook(() => useDisplayTimeZoneMenuItem());
    expect(result.current).toMatchObject({
      id: "display-time-zone",
      label: "Show times in UTC for now",
    });

    act(() => {
      if (result.current.kind !== "section") result.current.onSelect?.();
    });
    expect(getDisplayTimeZoneSnapshot().override).toBe("UTC");
    expect(result.current.label).toBe("Show times in local time again");

    act(() => {
      if (result.current.kind !== "section") result.current.onSelect?.();
    });
    expect(getDisplayTimeZoneSnapshot().override).toBeNull();
  });
});

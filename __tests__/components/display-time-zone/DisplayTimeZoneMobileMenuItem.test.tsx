import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DisplayTimeZoneMobileMenuItem from "@/components/display-time-zone/DisplayTimeZoneMobileMenuItem";
import {
  getDisplayTimeZoneSnapshot,
  resetDisplayTimeZoneSnapshotForTests,
} from "@/lib/display-time-zone/displayTimeZoneStore";

beforeEach(() => {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  resetDisplayTimeZoneSnapshotForTests();
});

describe("DisplayTimeZoneMobileMenuItem", () => {
  it("switches this tab to UTC and back, closing the menu each time", async () => {
    const user = userEvent.setup();
    const onSelected = jest.fn();
    render(<DisplayTimeZoneMobileMenuItem onSelected={onSelected} />);

    await user.click(
      screen.getByRole("button", { name: "Show times in UTC for now" })
    );
    expect(getDisplayTimeZoneSnapshot().override).toBe("UTC");
    expect(onSelected).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole("button", { name: "Show times in local time again" })
    );
    expect(getDisplayTimeZoneSnapshot().override).toBeNull();
    expect(onSelected).toHaveBeenCalledTimes(2);
  });
});

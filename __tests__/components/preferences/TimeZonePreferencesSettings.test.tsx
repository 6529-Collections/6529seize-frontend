import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimeZonePreferencesSettings from "@/components/preferences/TimeZonePreferencesSettings";
import {
  DISPLAY_TIME_ZONE_STORAGE_KEY,
  resetDisplayTimeZoneSnapshotForTests,
  setDisplayTimeZoneOverride,
} from "@/lib/display-time-zone/displayTimeZoneStore";

beforeEach(() => {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  resetDisplayTimeZoneSnapshotForTests();
});

describe("TimeZonePreferencesSettings", () => {
  it("starts on local time and explains what screenshots reveal", () => {
    render(<TimeZonePreferencesSettings />);

    expect(
      screen.getByRole("heading", { name: "Show times in" })
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Local time" })).toBeChecked();
    expect(
      screen.getByText(/Screenshots show these times/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Saved on this device only, not with your profile/)
    ).toBeInTheDocument();
  });

  it("saves UTC on this device and clears the wave switch", async () => {
    const user = userEvent.setup();
    setDisplayTimeZoneOverride("UTC");
    render(<TimeZonePreferencesSettings />);

    await user.click(screen.getByRole("radio", { name: "UTC" }));

    expect(globalThis.localStorage.getItem(DISPLAY_TIME_ZONE_STORAGE_KEY)).toBe(
      "UTC"
    );
    expect(globalThis.sessionStorage.length).toBe(0);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Times now shown in UTC"
    );
  });

  it("searches and saves another time zone", async () => {
    const user = userEvent.setup();
    render(<TimeZonePreferencesSettings />);

    await user.click(screen.getByRole("radio", { name: "Another time zone" }));
    expect(
      globalThis.localStorage.getItem(DISPLAY_TIME_ZONE_STORAGE_KEY)
    ).toBeNull();

    await user.type(screen.getByLabelText("Search time zones"), "Berl");
    await user.click(await screen.findByRole("option", { name: /Berlin/ }));

    expect(globalThis.localStorage.getItem(DISPLAY_TIME_ZONE_STORAGE_KEY)).toBe(
      "Europe/Berlin"
    );
    expect(
      screen.getByRole("radio", { name: "Another time zone" })
    ).toBeChecked();
    expect(screen.getByText(/Berlin \(Europe\/Berlin\)/)).toBeInTheDocument();
  });

  it("says when no zone matches", async () => {
    const user = userEvent.setup();
    render(<TimeZonePreferencesSettings />);

    await user.click(screen.getByRole("radio", { name: "Another time zone" }));
    await user.type(screen.getByLabelText("Search time zones"), "xyzzy");

    expect(
      await screen.findByText(/No time zones match “xyzzy”/)
    ).toBeInTheDocument();
  });
});

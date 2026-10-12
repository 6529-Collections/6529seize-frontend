/**
 * @jest-environment jsdom
 */

import { act, fireEvent, render, screen, within } from "@testing-library/react";

import WorldTimeZonesPage, { metadata } from "@/app/tools/time-zones/page";
import { publicEnv } from "@/config/env";

const domain = new URL(publicEnv.BASE_ENDPOINT).hostname;

async function renderLoadedPage() {
  // The map data is a dynamic import; let it resolve inside act.
  await act(async () => {
    render(<WorldTimeZonesPage />);
  });
  const map = await screen.findByRole("listbox", { name: "Time zone map" });
  return { map };
}

describe("World Time Zones page", () => {
  it("exposes app metadata", () => {
    expect(metadata.title).toBe("World Time Zones | Tools");
    expect(metadata.description).toBe(
      `Live world map of every time zone with its current local time and UTC offset. | ${domain}`
    );
  });

  it("renders the heading, a keyboard-operable map and the zone table", async () => {
    const { map } = await renderLoadedPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "World Time Zones" })
    ).toBeInTheDocument();
    const options = within(map).getAllByRole("option");
    expect(options.length).toBeGreaterThan(60);
    // One roving tab stop for the whole map.
    expect(
      options.filter((option) => option.getAttribute("tabindex") === "0")
    ).toHaveLength(1);

    const firstOption = options[0];
    if (!firstOption) {
      throw new Error("Expected map options");
    }
    fireEvent.focus(firstOption);
    expect(firstOption).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(map, { key: "ArrowRight" });
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("tabindex", "0");
    expect(
      screen.getByRole("region", { name: "Selected zone" })
    ).toHaveTextContent(/UTC/);

    const table = screen.getByRole("table");
    // A short first page, expandable in place to every zone.
    expect(within(table).getAllByRole("row")).toHaveLength(41);
    expect(
      screen.getByText(/^Showing 40 of \d+ time zones$/)
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /^Show all \d+ time zones$/ })
    );
    expect(within(table).getAllByRole("row").length).toBeGreaterThan(300);
    expect(
      screen.getByRole("button", { name: "Show fewer time zones" })
    ).toBeInTheDocument();
  });

  it("filters and sorts the table", async () => {
    await renderLoadedPage();

    fireEvent.change(screen.getByLabelText("Search time zones"), {
      target: { value: "kolkata" },
    });
    const table = screen.getByRole("table");
    const kolkataRow = await within(table).findByRole("row", {
      name: /Kolkata/,
    });
    expect(kolkataRow).toHaveTextContent("UTC+05:30");
    expect(within(table).getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("1 time zone")).toBeInTheDocument();

    const zoneHeader = within(table).getByRole("columnheader", {
      name: "Zone",
    });
    expect(zoneHeader).not.toHaveAttribute("aria-sort");
    fireEvent.click(within(zoneHeader).getByRole("button", { name: "Zone" }));
    expect(zoneHeader).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(within(zoneHeader).getByRole("button", { name: "Zone" }));
    expect(zoneHeader).toHaveAttribute("aria-sort", "descending");

    fireEvent.change(screen.getByLabelText("Search time zones"), {
      target: { value: "no such place" },
    });
    expect(
      await screen.findByText("No time zones match “no such place”.")
    ).toBeInTheDocument();
  });

  it("credits the open data sources", async () => {
    await renderLoadedPage();
    const sources = screen.getByRole("region", { name: "Data sources" });
    for (const name of [
      "timezone-boundary-builder",
      "OpenStreetMap",
      "Open Database License (ODbL)",
      "IANA Time Zone Database",
    ]) {
      expect(within(sources).getByRole("link", { name })).toHaveAttribute(
        "rel",
        "noopener noreferrer"
      );
    }
    expect(sources).toHaveTextContent("© OpenStreetMap contributors");
  });
});

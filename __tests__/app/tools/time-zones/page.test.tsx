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

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

describe("World Time Zones page", () => {
  it("exposes app metadata", () => {
    expect(metadata.title).toBe("World Time Zones | Tools");
    expect(metadata.description).toBe(
      `Live world map of time zones with the current local time and UTC offset in every IANA time zone. | ${domain}`
    );
  });

  it("renders the heading, a keyboard-operable map and the zone table", async () => {
    const { map } = await renderLoadedPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "World Time Zones" })
    ).toBeInTheDocument();
    const options = within(map).getAllByRole("option");
    // One dot per zone in tzdata's zone1970.tab.
    expect(options.length).toBeGreaterThan(300);
    expect(options[0]).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/^.+, .+, UTC/)
    );
    // APG listbox: the listbox is the single tab stop and points at the
    // selected option with aria-activedescendant; options never take focus.
    expect(map).toHaveAttribute("tabindex", "0");
    expect(options.some((option) => option.hasAttribute("tabindex"))).toBe(
      false
    );

    const [firstOption, secondOption, thirdOption] = options;
    if (!firstOption || !secondOption || !thirdOption) {
      throw new Error("Expected map options");
    }
    fireEvent.click(firstOption);
    fireEvent.focus(map);
    expect(firstOption).toHaveAttribute("aria-selected", "true");
    expect(map).toHaveAttribute("aria-activedescendant", firstOption.id);

    fireEvent.keyDown(map, { key: "ArrowLeft" });
    expect(firstOption).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(map, { key: "ArrowRight" });
    expect(secondOption).toHaveAttribute("aria-selected", "true");
    expect(firstOption).toHaveAttribute("aria-selected", "false");
    expect(map).toHaveAttribute("aria-activedescendant", secondOption.id);
    fireEvent.keyDown(map, { key: "End" });
    expect(options.at(-1)).toHaveAttribute("aria-selected", "true");
    fireEvent.click(thirdOption);
    expect(map).toHaveAttribute("aria-activedescendant", thirdOption.id);
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

  it("moves from the focused option, not a hovered one, and announces keyboard moves", async () => {
    const { map } = await renderLoadedPage();
    const [zoneA, zoneB, zoneC, zoneD] = within(map).getAllByRole("option");
    if (!zoneA || !zoneB || !zoneC || !zoneD) {
      throw new Error("Expected map options");
    }

    // Focus zone A with the keyboard.
    fireEvent.focus(map);
    fireEvent.keyDown(map, { key: "Home" });
    expect(map).toHaveAttribute("aria-activedescendant", zoneA.id);

    // Hovering zone C previews it but leaves the focused option on A.
    fireEvent.pointerOver(zoneC, { pointerType: "mouse" });
    fireEvent.keyDown(map, { key: "ArrowRight" });
    expect(map).toHaveAttribute("aria-activedescendant", zoneB.id);

    // Clicking zone C moves focus there, so the next key starts from C.
    fireEvent.click(zoneC);
    expect(map).toHaveAttribute("aria-activedescendant", zoneC.id);
    fireEvent.keyDown(map, { key: "ArrowRight" });
    expect(map).toHaveAttribute("aria-activedescendant", zoneD.id);
    expect(zoneD).toHaveAttribute("aria-selected", "true");

    // Keyboard moves are announced once, after the keys pause, with the time.
    const city = zoneD.getAttribute("aria-label")?.split(", ")[0] ?? "";
    expect(
      await screen.findByText(
        new RegExp(String.raw`^${escapeRegExp(city)} \(.+\): .+ local time$`)
      )
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

  it("credits the public-domain data sources in new tabs", async () => {
    await renderLoadedPage();
    const sources = screen.getByRole("region", { name: "Data sources" });
    for (const name of ["Natural Earth", "IANA Time Zone Database"]) {
      const link = within(sources).getByRole("link", {
        name: `${name} (opens in a new tab)`,
      });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(sources).toHaveTextContent(
      /^Data sourcesLand outline: Natural Earth.*\(public domain\)\. Zone locations: IANA Time Zone Database.*\(public domain\)\./
    );
  });
});

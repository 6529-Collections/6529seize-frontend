/**
 * @jest-environment jsdom
 */

import { act, fireEvent, render, screen, within } from "@testing-library/react";

import WorldTimeZonesPage from "@/app/tools/time-zones/page";

let mockMapDataFails = true;

// A failing factory is not cached, so the retry imports the module again.
jest.mock(
  "@/components/tools/time-zones/data/world-time-zones.generated.json",
  () => {
    if (mockMapDataFails) {
      throw new Error("Simulated map chunk load failure");
    }
    return jest.requireActual(
      "@/components/tools/time-zones/data/world-time-zones.generated.json"
    );
  }
);

describe("World Time Zones page when the map data fails to load", () => {
  it("keeps the table working from the browser's zone list and retries the map", async () => {
    const supportedValuesOf = jest.spyOn(Intl, "supportedValuesOf");
    await act(async () => {
      render(<WorldTimeZonesPage />);
    });

    expect(
      await screen.findByText(
        "The map could not load. The list of time zones below still works."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(supportedValuesOf).toHaveBeenCalledWith("timeZone");

    fireEvent.change(screen.getByLabelText("Search time zones"), {
      target: { value: "tokyo" },
    });
    const table = screen.getByRole("table");
    expect(
      await within(table).findByRole("row", { name: /Tokyo/ })
    ).toHaveTextContent("UTC+09:00");

    mockMapDataFails = false;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    });
    expect(
      await screen.findByRole("listbox", { name: "Time zone map" })
    ).toBeInTheDocument();
    supportedValuesOf.mockRestore();
  });
});

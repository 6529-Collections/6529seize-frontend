import SanctionsListBrowser from "@/components/sanctions/SanctionsListBrowser";
import { browserLabels } from "@/components/sanctions/sanctions-browser-groups";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

describe("SanctionsListBrowser hydration", () => {
  it("tolerates attributes a harness adds to the search input before hydration", async () => {
    const element = (
      <SanctionsListBrowser
        groups={[]}
        labels={browserLabels(DEFAULT_LOCALE)}
      />
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(element);
    container
      .querySelector("input")
      ?.setAttribute("style", "caret-color: transparent");
    document.body.appendChild(container);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    try {
      await act(async () => {
        hydrateRoot(container, element);
      });
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
      container.remove();
    }
  });
});

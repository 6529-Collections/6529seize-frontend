import TDHExample from "@/app/network/tdh/TDHExample";
import TDHProfile from "@/app/network/tdh/TDHProfile";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

function withQueryClient(element: ReactElement): ReactElement {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {element}
    </QueryClientProvider>
  );
}

describe("TDH page inputs", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it.each([
    ["the example checkbox", () => <TDHExample locale="en-US" />],
    ["the profile input", () => withQueryClient(<TDHProfile locale="en-US" />)],
  ])(
    "hydrates %s without a console error when it was modified before hydration",
    async (_name, render) => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      container.innerHTML = renderToString(render());
      const input = container.querySelector("input");
      // Something outside of React (a test harness or a browser extension)
      // adds an inline style to the server-rendered input before hydration.
      input?.style.setProperty("caret-color", "transparent");
      const errorSpy = jest.spyOn(console, "error").mockImplementation();

      await act(async () => {
        hydrateRoot(container, render());
      });

      expect(errorSpy).not.toHaveBeenCalled();
      expect(container.querySelector("input")).toBe(input);
    }
  );
});

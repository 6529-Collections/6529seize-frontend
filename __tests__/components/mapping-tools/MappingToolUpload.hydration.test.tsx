import { MappingToolUpload } from "@/components/mapping-tools/MappingToolControls";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

describe("MappingToolUpload hydration", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("hydrates without a console error when the file input was modified before hydration", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(
      <MappingToolUpload onFileSelected={jest.fn()} />
    );
    const input = container.querySelector("input");
    // Something outside of React (a test harness or a browser extension) adds
    // an inline style to the server-rendered input before React hydrates it.
    input?.style.setProperty("caret-color", "transparent");
    const errorSpy = jest.spyOn(console, "error").mockImplementation();

    await act(async () => {
      hydrateRoot(container, <MappingToolUpload onFileSelected={jest.fn()} />);
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(container.querySelector("input")).toBe(input);
    expect(container.querySelector("input")).toHaveAttribute("type", "file");
  });
});

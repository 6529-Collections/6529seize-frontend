import { fireEvent, render, screen, within } from "@testing-library/react";

import AiModelsPage from "@/components/ai-page/models/AiModelsPage";

function shownCount(): number {
  const text = screen.getByText(/of 227 models$/).textContent ?? "";
  return Number(/^(\d+) of 227 models$/.exec(text)?.[1]);
}

describe("the /ai/models filter", () => {
  it("narrows the models to what the app runs, reads and makes", () => {
    render(<AiModelsPage version="0.1.0-rc.1" />);
    expect(shownCount()).toBe(227);

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Runs in the app today" })
    );
    expect(shownCount()).toBe(139);
    expect(document.getElementById("model-qwen3-4b-mlx-4bit")).toBeNull();

    fireEvent.change(screen.getByLabelText("Reads"), {
      target: { value: "audio" },
    });
    expect(shownCount()).toBeGreaterThan(0);
    expect(shownCount()).toBeLessThan(139);
    expect(
      document.getElementById("model-whisper-large-v3-turbo")
    ).not.toBeNull();
    // A section with no model left goes, heading and all.
    expect(document.getElementById("image-generation")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(shownCount()).toBe(227);
  });

  it("finds a model by its name, publisher or family", () => {
    render(<AiModelsPage version="0.1.0-rc.1" />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search models" }), {
      target: { value: "qwen 8b" },
    });
    expect(shownCount()).toBeGreaterThan(0);
    for (const name of screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent ?? "")) {
      expect(name.toLowerCase()).toMatch(/qwen/);
      expect(name.toLowerCase()).toMatch(/8b/);
    }
  });

  it("says so when nothing matches, with a way back", () => {
    render(<AiModelsPage version="0.1.0-rc.1" />);
    fireEvent.change(screen.getByLabelText("Reads"), {
      target: { value: "audio" },
    });
    fireEvent.change(screen.getByLabelText("Makes"), {
      target: { value: "image" },
    });
    expect(shownCount()).toBe(0);
    expect(
      screen.getByText("No model matches these filters.")
    ).toBeInTheDocument();
  });

  it("orders by name, and shows a table whose rows open their cards", () => {
    render(<AiModelsPage version="0.1.0-rc.1" />);
    fireEvent.change(screen.getByLabelText("Order"), {
      target: { value: "name" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Table/ }));
    expect(document.querySelectorAll("article")).toHaveLength(0);
    const refusals = document.getElementById("uncensored")!.closest("section")!;
    const table = within(refusals).getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: "LiveCodeBench v6" })
    ).toBeInTheDocument();
    const names = within(table)
      .getAllByRole("button", { name: /^Show the card: / })
      .map((button) => button.textContent ?? "");
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

    fireEvent.click(
      within(table).getByRole("button", {
        name: "Show the card: gemma-4-31B-it-uncensored-heretic",
      })
    );
    expect(document.getElementById("model-gemma-4-31b-heretic")).not.toBeNull();
  });
});

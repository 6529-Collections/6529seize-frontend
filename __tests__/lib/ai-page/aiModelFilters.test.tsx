import { fireEvent, render, screen } from "@testing-library/react";

import AiModelsPage from "@/components/ai-page/models/AiModelsPage";

describe("the /ai/models filter", () => {
  it("narrows the models to what the app runs, reads and makes", () => {
    render(<AiModelsPage />);
    expect(screen.getByText("227 of 227 models")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Runs in the app today" })
    );
    expect(screen.getByText("139 of 227 models")).toBeInTheDocument();
    expect(
      document.getElementById("model-qwen3-4b-mlx-4bit")?.closest("li")
    ).not.toBeVisible();

    fireEvent.change(screen.getByLabelText("Reads"), {
      target: { value: "audio" },
    });
    const shown = Number(
      /^(\d+) of 227 models$/.exec(
        screen.getByText(/of 227 models$/).textContent ?? ""
      )?.[1]
    );
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(139);
    expect(
      document.getElementById("model-whisper-large-v3-turbo")?.closest("li")
    ).toBeVisible();
    // A section with no model left hides, heading and all.
    expect(document.getElementById("image-generation")).not.toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("227 of 227 models")).toBeInTheDocument();
  });

  it("says so when nothing matches, with a way back", () => {
    render(<AiModelsPage />);
    fireEvent.change(screen.getByLabelText("Reads"), {
      target: { value: "audio" },
    });
    fireEvent.change(screen.getByLabelText("Makes"), {
      target: { value: "image" },
    });
    expect(screen.getByText("0 of 227 models")).toBeInTheDocument();
    expect(
      screen.getByText("No model matches these filters.")
    ).toBeInTheDocument();
  });
});

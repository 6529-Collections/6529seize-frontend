import LazyEditDropLexical from "@/components/waves/drops/LazyEditDropLexical";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

// These tests share one module registry on purpose: the first one must run
// while the editor chunk is still unloaded. The order below is meaningful.
let mockEditorMounts = 0;

jest.mock("@/components/waves/drops/EditDropLexical", () => {
  const { useEffect } = require("react");

  // Like the real editor, once mounted it owns Escape itself.
  function MockEditDropLexical({ onCancel }: { onCancel: () => void }) {
    useEffect(() => {
      mockEditorMounts += 1;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") onCancel();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [onCancel]);
    return <div role="textbox" aria-label="Edit drop" />;
  }

  return { __esModule: true, default: MockEditDropLexical };
});

const baseProps = {
  initialContent: "hello",
  initialMentions: [],
  initialGroupMentions: [],
  initialWaveMentions: [],
  canMentionAll: false,
  waveId: "wave-1",
  isSaving: false,
  onSave: jest.fn(),
};

// Mirrors WaveDropPartContentMarkdown: cancelling leaves edit mode.
function EditHost({ onCancel }: { readonly onCancel: () => void }) {
  const [isEditing, setIsEditing] = useState(true);
  if (!isEditing) return <div data-testid="drop-view" />;
  return (
    <LazyEditDropLexical
      {...baseProps}
      onCancel={() => {
        onCancel();
        setIsEditing(false);
      }}
    />
  );
}

describe("LazyEditDropLexical Escape while the editor chunk is loading", () => {
  it("cancels the edit, so the editor never appears afterwards", async () => {
    const onCancel = jest.fn();
    render(<EditHost onCancel={onCancel} />);
    // No awaiting before Escape: the chunk cannot have arrived.
    expect(screen.getByRole("status")).toHaveTextContent("Loading editor");

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId("drop-view")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(mockEditorMounts).toBe(0);
  });

  it("leaves Escape to the editor once it has loaded", async () => {
    const onCancel = jest.fn();
    render(<EditHost onCancel={onCancel} />);
    await screen.findByRole("textbox", { name: "Edit drop" });

    fireEvent.keyDown(window, { key: "Escape" });

    // Exactly once: the loading placeholder no longer listens.
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

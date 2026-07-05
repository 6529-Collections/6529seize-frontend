import {
  EditingDropProvider,
  useEditingDrop,
} from "@/contexts/EditingDropContext";
import { fireEvent, render, screen } from "@testing-library/react";

function EditingDropHarness() {
  const { editingDropId, setEditingDropId } = useEditingDrop();
  return (
    <div>
      <div data-testid="editing-drop-id">{editingDropId ?? "none"}</div>
      <button type="button" onClick={() => setEditingDropId("drop-1")}>
        edit
      </button>
      <button type="button" onClick={() => setEditingDropId(null)}>
        stop
      </button>
    </div>
  );
}

describe("EditingDropContext", () => {
  it("starts with no editing drop", () => {
    render(
      <EditingDropProvider>
        <EditingDropHarness />
      </EditingDropProvider>
    );

    expect(screen.getByTestId("editing-drop-id")).toHaveTextContent("none");
  });

  it("sets and clears the editing drop id", () => {
    render(
      <EditingDropProvider>
        <EditingDropHarness />
      </EditingDropProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    expect(screen.getByTestId("editing-drop-id")).toHaveTextContent("drop-1");

    fireEvent.click(screen.getByRole("button", { name: "stop" }));
    expect(screen.getByTestId("editing-drop-id")).toHaveTextContent("none");
  });

  it("throws when used outside the provider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<EditingDropHarness />)).toThrow(
      "useEditingDrop must be used within an EditingDropProvider"
    );

    consoleError.mockRestore();
  });
});

import {
  ActiveGroupProvider,
  useActiveGroup,
} from "@/contexts/ActiveGroupContext";
import { fireEvent, render, screen } from "@testing-library/react";

function ActiveGroupHarness() {
  const { activeGroupId, setActiveGroupId } = useActiveGroup();
  return (
    <div>
      <div data-testid="active-group-id">{activeGroupId ?? "none"}</div>
      <button type="button" onClick={() => setActiveGroupId("group-1")}>
        select
      </button>
      <button type="button" onClick={() => setActiveGroupId(null)}>
        clear
      </button>
    </div>
  );
}

describe("ActiveGroupContext", () => {
  it("starts with no active group", () => {
    render(
      <ActiveGroupProvider>
        <ActiveGroupHarness />
      </ActiveGroupProvider>
    );

    expect(screen.getByTestId("active-group-id")).toHaveTextContent("none");
  });

  it("sets and clears the active group id", () => {
    render(
      <ActiveGroupProvider>
        <ActiveGroupHarness />
      </ActiveGroupProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "select" }));
    expect(screen.getByTestId("active-group-id")).toHaveTextContent("group-1");

    fireEvent.click(screen.getByRole("button", { name: "clear" }));
    expect(screen.getByTestId("active-group-id")).toHaveTextContent("none");
  });

  it("throws when used outside the provider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<ActiveGroupHarness />)).toThrow(
      "useActiveGroup must be used within an ActiveGroupProvider"
    );

    consoleError.mockRestore();
  });
});

import { render, screen } from "@testing-library/react";
import { AuthContext } from "@/components/auth/Auth";
import WaveDropActionsEdit from "@/components/waves/drops/WaveDropActionsEdit";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

const makeDrop = (editableUntil: number | null | undefined): ExtendedDrop =>
  ({
    id: "drop-1",
    author: { handle: "author" },
    editable_until: editableUntil,
  }) as unknown as ExtendedDrop;

const renderAction = (
  drop: ExtendedDrop,
  connectedHandle: string | null = "author"
) =>
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: connectedHandle
            ? { handle: connectedHandle }
            : null,
        } as any
      }
    >
      <WaveDropActionsEdit drop={drop} onEdit={jest.fn()} />
    </AuthContext.Provider>
  );

describe("WaveDropActionsEdit", () => {
  it("shows the edit action while the edit window is open", () => {
    renderAction(makeDrop(Date.now() + 60_000));
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("shows the edit action when the API predates editable_until", () => {
    renderAction(makeDrop(undefined));
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("hides the edit action once the edit window has passed", () => {
    renderAction(makeDrop(Date.now() - 1_000));
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });

  it("hides the edit action when the API reports editing disabled", () => {
    renderAction(makeDrop(null));
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });

  it("never shows the edit action to non-authors regardless of window", () => {
    renderAction(makeDrop(Date.now() + 60_000), "someone-else");
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });

  it("hides the action live when the deadline passes while mounted", async () => {
    jest.useFakeTimers();
    try {
      renderAction(makeDrop(Date.now() + 1_000));
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
      await (
        await import("react")
      ).act(async () => {
        jest.advanceTimersByTime(1_100);
      });
      expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps a far-future deadline visible past the setTimeout 32-bit cap", async () => {
    // setTimeout treats delays over 2^31 - 1 ms as 0; a naive timer would
    // fire immediately and hide an edit action that is valid for weeks.
    jest.useFakeTimers();
    try {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      renderAction(makeDrop(Date.now() + thirtyDaysMs));
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
      await (
        await import("react")
      ).act(async () => {
        // Past the 32-bit cap (~24.8 days) but before the deadline: the
        // chunked timer re-arms and the action must remain visible.
        jest.advanceTimersByTime(2 ** 31 - 1);
      });
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
      await (
        await import("react")
      ).act(async () => {
        jest.advanceTimersByTime(thirtyDaysMs - (2 ** 31 - 1) + 1_000);
      });
      expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});

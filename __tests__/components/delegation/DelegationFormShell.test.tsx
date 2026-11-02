import { act, fireEvent, render, screen } from "@testing-library/react";
import { DelegationFormShell } from "@/components/delegation/DelegationFormParts";

jest.mock("wagmi", () => ({}));

describe("Delegation form close control", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it.each(["hover", "focus"])(
    "shows the standard portal tooltip on %s and can close",
    (interaction) => {
      const onHide = jest.fn();
      render(
        <DelegationFormShell title="Consolidation" onHide={onHide}>
          Form content
        </DelegationFormShell>
      );
      const close = screen.getByRole("button", {
        name: "Cancel Consolidation",
      });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      if (interaction === "hover") fireEvent.mouseEnter(close);
      else fireEvent.focus(close);
      act(() => jest.advanceTimersByTime(700));
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent("Cancel Consolidation");
      expect(tooltip.parentElement).toBe(document.body);
      // The shared Jest setup stubs getComputedStyle, so inspect the inline
      // portal positioning rather than its mocked computed style.
      expect(tooltip.style.position).toBe("fixed");
      expect(close).toHaveAttribute("aria-describedby", tooltip.id);
      fireEvent.click(close);
      expect(onHide).toHaveBeenCalledTimes(1);
    }
  );
});

import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import { CUSTOM_TOOLTIP_CLOSE_ALL_EVENT } from "@/helpers/tooltip.helpers";

const hoverCardAriaLabel = "Test hover card";

describe("HoverCard", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("preserves the child's ref and still opens the card", async () => {
    const buttonRef = React.createRef<HTMLButtonElement>();

    render(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
      >
        <button ref={buttonRef} type="button">
          Trigger
        </button>
      </HoverCard>
    );

    expect(buttonRef.current).toBe(screen.getByText("Trigger"));

    fireEvent.mouseEnter(buttonRef.current!);

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: hoverCardAriaLabel })
      ).toBeInTheDocument();
    });
  });

  it("shows on hover after the configured delay", async () => {
    render(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    fireEvent.mouseEnter(screen.getByText("Trigger"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });
    expect(screen.getByText("Card content")).toHaveClass(
      "tw-overflow-hidden",
      "tw-rounded-xl"
    );
  });

  it("opens when the trigger child is a link-like element", async () => {
    render(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
      >
        <a href="/test">Trigger Link</a>
      </HoverCard>
    );

    fireEvent.mouseEnter(screen.getByText("Trigger Link"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("does not open when disabled", async () => {
    render(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
        disabled
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    fireEvent.mouseEnter(screen.getByText("Trigger"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("stays open while the pointer moves from the trigger into the card", async () => {
    render(
      <HoverCard
        content={<button type="button">Inside Action</button>}
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
        delayHide={0}
        hoverTransitionDelay={0}
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    const trigger = screen.getByText("Trigger");
    fireEvent.mouseEnter(trigger);

    const dialog = await screen.findByRole("dialog");
    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(dialog);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Inside Action")).toBeInTheDocument();
    });
  });

  it("stays open when focus moves from the trigger into the card", async () => {
    render(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    const trigger = screen.getByText("Trigger");
    fireEvent.focus(trigger);

    const dialog = await screen.findByRole("dialog");
    fireEvent.focus(dialog);
    fireEvent.blur(trigger, { relatedTarget: dialog });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("focuses the card when opened with ArrowDown", async () => {
    render(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    const trigger = screen.getByText("Trigger");
    fireEvent.focus(trigger);
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const dialog = await screen.findByRole("dialog", {
      name: hoverCardAriaLabel,
    });

    expect(dialog).toHaveFocus();
  });

  it("closes on outside pointer interaction", async () => {
    render(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    fireEvent.mouseEnter(screen.getByText("Trigger"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it.each(["Enter", " "])(
    "focuses click-opened details with %s and restores focus on Escape",
    async (key) => {
      render(
        <HoverCard
          content={<a href="/rules">View rules</a>}
          ariaLabel={hoverCardAriaLabel}
          delayShow={0}
          openOnClick
          focusOnKeyboardActivation
        >
          <button type="button">Trigger</button>
        </HoverCard>
      );
      const trigger = screen.getByRole("button", { name: "Trigger" });
      act(() => trigger.focus());
      // Keyboard activation must also work after focus has already opened it.
      await screen.findByRole("dialog");

      fireEvent.keyDown(trigger, { key });

      expect(screen.getByRole("dialog")).toHaveFocus();
      act(() => screen.getByRole("link", { name: "View rules" }).focus());
      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    }
  );

  it.each([true, false])(
    "preserves link Enter activation with openOnClick=%s",
    (openOnClick) => {
      render(
        <HoverCard
          content="Details"
          ariaLabel={hoverCardAriaLabel}
          openOnClick={openOnClick}
        >
          <a href="/destination">Trigger</a>
        </HoverCard>
      );
      expect(
        fireEvent.keyDown(screen.getByRole("link"), { key: "Enter" })
      ).toBe(true);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    }
  );

  describe("portal keyboard boundaries", () => {
    beforeEach(() => {
      // JSDOM has no layout; the real browser regression checks visibility too.
      jest
        .spyOn(HTMLElement.prototype, "getClientRects")
        .mockReturnValue([
          { width: 20, height: 20 } as DOMRect,
        ] as unknown as DOMRectList);
    });
    afterEach(() => jest.restoreAllMocks());

    it("returns to the trigger backwards and continues after it forwards", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <HoverCard
            content={
              <>
                <a href="/group">Inspect group</a>
                <a href="/rules">View rules</a>
              </>
            }
            ariaLabel={hoverCardAriaLabel}
            openOnClick
            focusOnKeyboardActivation
          >
            <button type="button">Trigger</button>
          </HoverCard>
          <button type="button" hidden>
            Hidden
          </button>
          <button type="button" disabled>
            Disabled
          </button>
          <div inert>
            <button type="button">Inert</button>
          </div>
          <button type="button">After</button>
          <button type="button">End of page</button>
        </>
      );
      const trigger = screen.getByRole("button", { name: "Trigger" });
      act(() => trigger.focus());
      await user.keyboard("{Enter}");
      const card = screen.getByRole("dialog");
      expect(card.parentElement).toBe(document.body);
      await user.tab({ shift: true });
      expect(trigger).toHaveFocus();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      await user.keyboard("{Enter}");
      await user.tab();
      expect(screen.getByRole("link", { name: "Inspect group" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(trigger).toHaveFocus();
      await user.keyboard("{Enter}");
      await user.tab();
      await user.tab();
      expect(screen.getByRole("link", { name: "View rules" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("returns a card with no links to the next control after its trigger", async () => {
      const user = userEvent.setup();
      render(
        <>
          <HoverCard
            content="Details"
            ariaLabel={hoverCardAriaLabel}
            openOnClick
            focusOnKeyboardActivation
          >
            <button type="button">Trigger</button>
          </HoverCard>
          <button type="button">After</button>
        </>
      );
      act(() => screen.getByRole("button", { name: "Trigger" }).focus());
      await user.keyboard("{Enter}");
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("continues from the portal to a native summary after its trigger", async () => {
      const user = userEvent.setup();
      render(
        <>
          <HoverCard
            content={<a href="/rules">View rules</a>}
            ariaLabel={hoverCardAriaLabel}
            openOnClick
            focusOnKeyboardActivation
          >
            <button type="button">Trigger</button>
          </HoverCard>
          <details>
            <summary>More details</summary>Extra content
          </details>
          <button type="button">After details</button>
        </>
      );
      act(() => screen.getByRole("button", { name: "Trigger" }).focus());
      await user.keyboard("{Enter}");
      await user.tab();
      expect(screen.getByRole("link", { name: "View rules" })).toHaveFocus();
      await user.tab();
      expect(screen.getByText("More details")).toHaveFocus();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("can stop click propagation and close when the card is clicked", async () => {
    const handleParentClick = jest.fn();

    render(
      <div onClick={handleParentClick}>
        <HoverCard
          content="Card content"
          ariaLabel={hoverCardAriaLabel}
          openOnClick
          closeOnContentClick
          stopClickPropagation
        >
          <button type="button">Trigger</button>
        </HoverCard>
      </div>
    );

    fireEvent.click(screen.getByText("Trigger"));

    expect(handleParentClick).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("dialog"));

    expect(handleParentClick).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes on escape", async () => {
    render(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    fireEvent.mouseEnter(screen.getByText("Trigger"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes an open card when it becomes disabled", async () => {
    const { rerender } = render(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    fireEvent.mouseEnter(screen.getByText("Trigger"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    rerender(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
        disabled
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("requires a new interaction after disabling a pending open", () => {
    jest.useFakeTimers();

    const { rerender } = render(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={100}
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    const trigger = screen.getByText("Trigger");
    fireEvent.mouseEnter(trigger);

    rerender(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={100}
        disabled
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={100}
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByText("Trigger"));

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes when the global close-all event is dispatched", async () => {
    render(
      <HoverCard
        content="Card content"
        ariaLabel={hoverCardAriaLabel}
        delayShow={0}
      >
        <button type="button">Trigger</button>
      </HoverCard>
    );

    fireEvent.mouseEnter(screen.getByText("Trigger"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    document.dispatchEvent(new Event(CUSTOM_TOOLTIP_CLOSE_ALL_EVENT));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

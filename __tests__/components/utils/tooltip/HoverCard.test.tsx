import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import { CUSTOM_TOOLTIP_CLOSE_ALL_EVENT } from "@/helpers/tooltip.helpers";

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (children: React.ReactNode) => children,
}));

describe("HoverCard", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("preserves the child's ref and still opens the card", async () => {
    const buttonRef = React.createRef<HTMLButtonElement>();

    render(
      <HoverCard content="Card content" delayShow={0}>
        <button ref={buttonRef} type="button">
          Trigger
        </button>
      </HoverCard>
    );

    expect(buttonRef.current).toBe(screen.getByText("Trigger"));

    fireEvent.mouseEnter(buttonRef.current!);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("shows on hover after the configured delay", async () => {
    render(
      <HoverCard content="Card content" delayShow={0}>
        <button type="button">Trigger</button>
      </HoverCard>
    );

    fireEvent.mouseEnter(screen.getByText("Trigger"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });
  });

  it("opens when the trigger child is a link-like element", async () => {
    render(
      <HoverCard content="Card content" delayShow={0}>
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
      <HoverCard content="Card content" delayShow={0} disabled>
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
      <HoverCard content="Card content" delayShow={0}>
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
      <HoverCard content="Card content" delayShow={0}>
        <button type="button">Trigger</button>
      </HoverCard>
    );

    const trigger = screen.getByText("Trigger");
    fireEvent.focus(trigger);
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const dialog = await screen.findByRole("dialog");

    expect(dialog).toHaveFocus();
  });

  it("closes on outside pointer interaction", async () => {
    render(
      <HoverCard content="Card content" delayShow={0}>
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

  it("closes on escape", async () => {
    render(
      <HoverCard content="Card content" delayShow={0}>
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
      <HoverCard content="Card content" delayShow={0}>
        <button type="button">Trigger</button>
      </HoverCard>
    );

    fireEvent.mouseEnter(screen.getByText("Trigger"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    rerender(
      <HoverCard content="Card content" delayShow={0} disabled>
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
      <HoverCard content="Card content" delayShow={100}>
        <button type="button">Trigger</button>
      </HoverCard>
    );

    const trigger = screen.getByText("Trigger");
    fireEvent.mouseEnter(trigger);

    rerender(
      <HoverCard content="Card content" delayShow={100} disabled>
        <button type="button">Trigger</button>
      </HoverCard>
    );

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <HoverCard content="Card content" delayShow={100}>
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
      <HoverCard content="Card content" delayShow={0}>
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

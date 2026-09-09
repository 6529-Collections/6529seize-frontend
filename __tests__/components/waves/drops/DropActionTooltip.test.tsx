import { createRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DropActionTooltip from "@/components/waves/drops/DropActionTooltip";

function dispatchPointer(
  element: Element,
  type: "pointerover" | "pointerout" | "pointerdown",
  pointerType = "mouse"
) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  fireEvent(element, event);
}

function setFocusVisible(element: HTMLElement) {
  const matches = element.matches.bind(element);
  jest
    .spyOn(element, "matches")
    .mockImplementation((selector) =>
      selector === ":focus-visible" ? true : matches(selector)
    );
}

it("portals to the body and associates only the hovered copy of a repeated action", async () => {
  const { container } = render(
    <div style={{ overflow: "hidden", willChange: "transform" }}>
      <span id="existing-description">Existing description</span>
      <DropActionTooltip content="Copy link">
        <button aria-describedby="existing-description">Same drop</button>
      </DropActionTooltip>
      <DropActionTooltip content="Copy link">
        <button>Same drop</button>
      </DropActionTooltip>
    </div>
  );
  const [firstButton, secondButton] = screen.getAllByRole("button");
  dispatchPointer(firstButton!, "pointerover");

  const firstTooltip = await screen.findByRole("tooltip");
  expect(firstTooltip.parentElement).toBe(document.body);
  expect(container).not.toContainElement(firstTooltip);
  expect(firstTooltip.style.pointerEvents).toBe("none");
  await waitFor(() =>
    expect(firstButton).toHaveAttribute(
      "aria-describedby",
      `existing-description ${firstTooltip.id}`
    )
  );
  expect(secondButton).not.toHaveAttribute("aria-describedby");

  dispatchPointer(firstButton!, "pointerout");
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  expect(firstButton).toHaveAttribute(
    "aria-describedby",
    "existing-description"
  );
  dispatchPointer(secondButton!, "pointerover");
  const secondTooltip = await screen.findByRole("tooltip");
  expect(secondTooltip.id).not.toBe(firstTooltip.id);
  await waitFor(() =>
    expect(secondButton).toHaveAttribute("aria-describedby", secondTooltip.id)
  );
});

it.each(["scroll", "Escape", "resize", "pointerdown"] as const)(
  "dismisses on %s without waiting for pointer movement",
  async (event) => {
    const { container } = render(
      <div>
        <DropActionTooltip content="Reply">
          <button>Reply to drop</button>
        </DropActionTooltip>
      </div>
    );
    dispatchPointer(screen.getByRole("button"), "pointerover");
    await screen.findByRole("tooltip");

    if (event === "scroll") {
      // Scroll does not bubble; the capture listener must still dismiss it.
      fireEvent.scroll(container);
    } else if (event === "Escape") {
      expect(fireEvent.keyDown(document, { key: "Escape" })).toBe(true);
    } else if (event === "resize") {
      fireEvent.resize(window);
    } else {
      dispatchPointer(document.body, "pointerdown", "touch");
    }

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  }
);

it("shows only the latest tooltip when switching between keyboard and pointer input", async () => {
  render(
    <>
      <DropActionTooltip content="Reply">
        <button>Reply to drop</button>
      </DropActionTooltip>
      <DropActionTooltip content="Boost">
        <button>Boost drop</button>
      </DropActionTooltip>
    </>
  );
  const reply = screen.getByRole("button", { name: "Reply to drop" });
  const boost = screen.getByRole("button", { name: "Boost drop" });
  setFocusVisible(reply);
  fireEvent.focus(reply);
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Reply");

  // Hovering another action does not blur the keyboard-focused button.
  dispatchPointer(boost, "pointerover");
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Boost");
  expect(screen.getAllByRole("tooltip")).toHaveLength(1);
  expect(reply).not.toHaveAttribute("aria-describedby");

  fireEvent.blur(reply);
  fireEvent.focus(reply);
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Reply");
  expect(screen.getAllByRole("tooltip")).toHaveLength(1);
  expect(boost).not.toHaveAttribute("aria-describedby");
});

it("dismisses for a synthesized click without interfering with the action", async () => {
  const onClick = jest.fn();
  render(
    <DropActionTooltip content="Reply">
      <button onClick={onClick}>Reply to drop</button>
    </DropActionTooltip>
  );
  const button = screen.getByRole("button");
  setFocusVisible(button);
  fireEvent.focus(button);
  await screen.findByRole("tooltip");

  // Assistive technology can activate without preceding pointer/key events.
  expect(fireEvent.click(button)).toBe(true);
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

it("shows for keyboard focus and preserves the button ref, label, and keyboard action", async () => {
  const buttonRef = createRef<HTMLButtonElement>();
  const onKeyDown = jest.fn();
  const onClick = jest.fn();
  render(
    <DropActionTooltip content="Reply">
      <button
        ref={buttonRef}
        aria-label="Reply to drop"
        onKeyDown={onKeyDown}
        onClick={onClick}
      >
        Reply
      </button>
    </DropActionTooltip>
  );
  const button = screen.getByRole("button", { name: "Reply to drop" });
  expect(buttonRef.current).toBe(button);
  setFocusVisible(button);
  fireEvent.focus(button);
  await screen.findByRole("tooltip");

  expect(fireEvent.keyDown(button, { key: "Enter" })).toBe(true);
  expect(onKeyDown).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
  fireEvent.blur(button);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

it("does not reopen after a keyboard action temporarily disables the tooltip", async () => {
  const content = (disabled: boolean) => (
    <DropActionTooltip content="More" disabled={disabled}>
      <button>More actions</button>
    </DropActionTooltip>
  );
  const { rerender } = render(content(false));
  const button = screen.getByRole("button");
  setFocusVisible(button);
  fireEvent.focus(button);
  await screen.findByRole("tooltip");

  fireEvent.keyDown(button, { key: "Enter" });
  rerender(content(true));
  fireEvent.keyDown(button, { key: "Escape" });
  rerender(content(false));

  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

it("does not open from touch or the focus caused by tapping an action", async () => {
  render(
    <DropActionTooltip content="More">
      <button>More actions</button>
    </DropActionTooltip>
  );
  const button = screen.getByRole("button");
  setFocusVisible(button);
  dispatchPointer(button, "pointerover", "touch");
  dispatchPointer(button, "pointerdown", "touch");
  fireEvent.focus(button);
  fireEvent.mouseOver(button);
  fireEvent.click(button);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

  fireEvent.blur(button);
  fireEvent.focus(button);
  await screen.findByRole("tooltip");
});

it("does not open when disabled", () => {
  render(
    <DropActionTooltip content="Reply" disabled>
      <button>Reply to drop</button>
    </DropActionTooltip>
  );
  const button = screen.getByRole("button");
  setFocusVisible(button);
  dispatchPointer(button, "pointerover");
  fireEvent.focus(button);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

import { trapTabFocus } from "@/components/utils/modal/focusTrap";

const createTabEvent = (shiftKey = false): KeyboardEvent =>
  new KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey,
    bubbles: true,
    cancelable: true,
  });

const renderFocusableContainer = () => {
  const outsideButton = document.createElement("button");
  outsideButton.textContent = "Outside";

  const container = document.createElement("div");
  container.tabIndex = -1;

  const firstButton = document.createElement("button");
  firstButton.textContent = "First";

  const disabledButton = document.createElement("button");
  disabledButton.disabled = true;

  const hiddenInput = document.createElement("input");
  hiddenInput.type = "hidden";

  const lastButton = document.createElement("button");
  lastButton.textContent = "Last";

  container.append(firstButton, lastButton, disabledButton, hiddenInput);
  document.body.append(outsideButton, container);

  return {
    container,
    firstButton,
    lastButton,
    outsideButton,
  };
};

describe("trapTabFocus", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("focuses the container when it has no focusable children", () => {
    const container = document.createElement("div");
    container.tabIndex = -1;
    document.body.appendChild(container);

    const event = createTabEvent();
    trapTabFocus(event, container);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(container);
  });

  it("wraps Tab from the last focusable element to the first", () => {
    const { container, firstButton, lastButton } = renderFocusableContainer();
    lastButton.focus();

    const event = createTabEvent();
    trapTabFocus(event, container);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(firstButton);
  });

  it("wraps Shift+Tab from the first focusable element to the last", () => {
    const { container, firstButton, lastButton } = renderFocusableContainer();
    firstButton.focus();

    const event = createTabEvent(true);
    trapTabFocus(event, container);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(lastButton);
  });

  it("moves outside focus into the container based on tab direction", () => {
    const { container, firstButton, lastButton, outsideButton } =
      renderFocusableContainer();

    outsideButton.focus();
    const tabEvent = createTabEvent();
    trapTabFocus(tabEvent, container);
    expect(tabEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(firstButton);

    outsideButton.focus();
    const shiftTabEvent = createTabEvent(true);
    trapTabFocus(shiftTabEvent, container);
    expect(shiftTabEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(lastButton);
  });
});

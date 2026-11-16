import IconButton from "@/components/utils/button/IconButton";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";

describe("IconButton", () => {
  it("forwards its button ref, accessible state and pointer handlers", () => {
    const ref = createRef<HTMLButtonElement>();
    const onPointerDown = jest.fn();
    render(
      <IconButton
        ref={ref}
        aria-label="Copy statement"
        aria-pressed
        data-tooltip-id="copy-tooltip"
        onPointerDown={onPointerDown}
      >
        <svg aria-hidden="true" />
      </IconButton>
    );

    const button = screen.getByRole("button", { name: "Copy statement" });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAttribute("data-tooltip-id", "copy-tooltip");
    fireEvent.pointerDown(button);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });

  it("keeps native keyboard activation without submitting the surrounding form", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const onSubmit = jest.fn();
    render(
      <form onSubmit={onSubmit}>
        <IconButton aria-label="Search" onClick={onClick}>
          <svg aria-hidden="true" />
        </IconButton>
      </form>
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "Search" })).toHaveFocus();
    await user.keyboard("{Enter} ");
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps a disabled pending action inert and exposes the caller's busy state", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <IconButton
        aria-label="Share page"
        aria-busy="true"
        disabled
        pending
        onClick={onClick}
      >
        <svg aria-hidden="true" />
      </IconButton>
    );

    const button = screen.getByRole("button", { name: "Share page" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await user.click(button);
    await user.tab();
    expect(button).not.toHaveFocus();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps the inset sheet surface inside one keyboard-operable button", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <IconButton
        aria-label="Close"
        variant="subtle"
        size={40}
        surfaceSize={36}
        onClick={onClick}
      >
        <svg aria-hidden="true" />
      </IconButton>
    );

    expect(screen.getAllByRole("button")).toHaveLength(1);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps an aria-disabled pending action focusable and leaves its click guard to the caller", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <IconButton
        aria-label="Refresh link"
        aria-disabled="true"
        aria-busy="true"
        pending
        onClick={onClick}
      >
        <svg aria-hidden="true" />
      </IconButton>
    );

    const button = screen.getByRole("button", { name: "Refresh link" });
    expect(button).toBeEnabled();
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

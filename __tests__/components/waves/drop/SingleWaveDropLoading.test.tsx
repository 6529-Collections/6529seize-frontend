import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SingleWaveDropLoading from "@/components/waves/drop/SingleWaveDropLoading";

it("focuses Close and restores the opener after dismissal", async () => {
  const opener = document.createElement("button");
  document.body.append(opener);
  opener.focus();
  const onClose = jest.fn();
  const { unmount } = render(<SingleWaveDropLoading onClose={onClose} />);
  const close = screen.getByRole("button", { name: "Close panel" });
  expect(close).toHaveFocus();
  fireEvent.keyDown(close, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
  unmount();
  await waitFor(() => expect(opener).toHaveFocus());
  opener.remove();
});

it("does not close for Escape outside the panel or inside another dialog", () => {
  const onClose = jest.fn();
  render(<SingleWaveDropLoading onClose={onClose} />);
  fireEvent.keyDown(document.body, { key: "Escape" });
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  screen.getByTestId("single-drop-loading").append(dialog);
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(onClose).not.toHaveBeenCalled();
});

it("hands focus to the loaded panel when the covered opener remains inert", async () => {
  const covered = document.createElement("div");
  const opener = document.createElement("button");
  covered.append(opener);
  document.body.append(covered);
  opener.focus();
  covered.inert = true;
  covered.setAttribute("inert", "");
  const { rerender } = render(
    <div>
      <SingleWaveDropLoading onClose={jest.fn()} />
    </div>
  );
  rerender(
    <div>
      <button type="button">Loaded close</button>
    </div>
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Loaded close" })).toHaveFocus()
  );
  covered.remove();
});

it("keeps error recovery and Close keyboard accessible", () => {
  const onRetry = jest.fn();
  const onClose = jest.fn();
  render(<SingleWaveDropLoading onClose={onClose} isError onRetry={onRetry} />);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "This content could not be loaded."
  );
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(screen.getByRole("button", { name: "Try again" }), {
    key: "Escape",
  });
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("keeps focus inside the panel when a retry replaces its button with loading", () => {
  const onRetry = jest.fn();
  const onClose = jest.fn();
  const { rerender } = render(
    <SingleWaveDropLoading onClose={onClose} isError onRetry={onRetry} />
  );
  const retry = screen.getByRole("button", { name: "Try again" });
  retry.focus();
  fireEvent.click(retry);
  expect(onRetry).toHaveBeenCalledTimes(1);
  rerender(<SingleWaveDropLoading onClose={onClose} onRetry={onRetry} />);
  const close = screen.getByRole("button", { name: "Close panel" });
  expect(close).toHaveFocus();
  expect(
    screen.queryByRole("button", { name: "Try again" })
  ).not.toBeInTheDocument();
  fireEvent.keyDown(close, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
});

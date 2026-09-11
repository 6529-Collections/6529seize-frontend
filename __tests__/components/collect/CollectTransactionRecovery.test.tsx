import CollectTransactionRecovery from "@/components/collect/CollectTransactionRecovery";
import { act, fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
it("rejects malformed hashes and associates the error with the input", () => {
  const onRecover = jest.fn();
  render(<CollectTransactionRecovery disabled={false} onRecover={onRecover} />);
  const input = screen.getByRole("textbox", {
    name: "Transaction hash from your wallet",
  });
  fireEvent.change(input, { target: { value: "0x123" } });
  fireEvent.click(
    screen.getByRole("button", { name: "Check this transaction" })
  );
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription(
    expect.stringContaining("64 hexadecimal")
  );
  expect(onRecover).not.toHaveBeenCalled();
});
it("checks a supplied hash once without providing a send callback", async () => {
  let finish: (() => void) | undefined;
  const onRecover = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  render(<CollectTransactionRecovery disabled={false} onRecover={onRecover} />);
  const hash = `0x${"a".repeat(64)}`;
  fireEvent.change(screen.getByRole("textbox"), { target: { value: hash } });
  const button = screen.getByRole("button", { name: "Check this transaction" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(onRecover).toHaveBeenCalledTimes(1);
  expect(onRecover).toHaveBeenCalledWith(hash);
  expect(button).toBeDisabled();
  await act(async () => {
    finish?.();
  });
});
it("retains the hash and exposes a failed check without starting a new transaction", async () => {
  const onRecover = jest.fn().mockRejectedValue(new Error("offline"));
  render(<CollectTransactionRecovery disabled={false} onRecover={onRecover} />);
  const hash = `0x${"b".repeat(64)}`;
  fireEvent.change(screen.getByRole("textbox"), { target: { value: hash } });
  fireEvent.click(
    screen.getByRole("button", { name: "Check this transaction" })
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Keep the same hash"
  );
  expect(screen.getByRole("textbox")).toHaveValue(hash);
  expect(onRecover).toHaveBeenCalledTimes(1);
});

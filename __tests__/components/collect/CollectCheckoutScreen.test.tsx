import CollectCheckoutScreen from "@/components/collect/CollectCheckoutScreen";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

it("keeps the checkout draft mounted when hidden and restores it on resume", async () => {
  const close = jest.fn();
  const content = <input aria-label="Delivery draft" defaultValue="original" />;
  const view = render(
    <CollectCheckoutScreen onClose={close}>{content}</CollectCheckoutScreen>
  );
  const field = screen.getByRole("textbox", { name: "Delivery draft" });
  fireEvent.change(field, { target: { value: "edited" } });
  await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
  fireEvent.click(screen.getByRole("button", { name: "Back to collecting" }));
  expect(close).toHaveBeenCalledTimes(1);
  view.rerender(
    <CollectCheckoutScreen onClose={close} open={false}>
      {content}
    </CollectCheckoutScreen>
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(field).toBeInTheDocument();
  expect(field).not.toBeVisible();
  view.rerender(
    <CollectCheckoutScreen onClose={close}>{content}</CollectCheckoutScreen>
  );
  expect(
    screen.getByRole("dialog", { name: "Review your purchase" })
  ).toBeVisible();
  expect(screen.getByRole("textbox", { name: "Delivery draft" })).toBe(field);
  expect(field).toHaveValue("edited");
});

it("blocks Back and Escape while execution is busy and permits Escape after it settles", async () => {
  const user = userEvent.setup();
  const close = jest.fn();
  const view = render(
    <CollectCheckoutScreen onClose={close} busy>
      <button>Inspect terms</button>
    </CollectCheckoutScreen>
  );
  await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
  const back = screen.getByRole("button", { name: "Back to collecting" });
  expect(back).toBeDisabled();
  fireEvent.click(back);
  await user.keyboard("{Escape}");
  expect(close).not.toHaveBeenCalled();
  view.rerender(
    <CollectCheckoutScreen onClose={close}>
      <button>Inspect terms</button>
    </CollectCheckoutScreen>
  );
  await user.keyboard("{Escape}");
  expect(close).toHaveBeenCalledTimes(1);
});

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";

jest.mock("@/hooks/useIsMobileLayoutViewport");
jest.mock("@/hooks/useIsTouchDevice");

it("preserves an explicitly retained child while closing releases focus and hides its controls", async () => {
  jest.mocked(useIsMobileLayoutViewport).mockReturnValue(false);
  jest.mocked(useIsTouchDevice).mockReturnValue(false);
  const mounted = jest.fn();
  const unmounted = jest.fn();
  function ReviewDraft() {
    const [amount, setAmount] = useState("");
    useEffect(() => {
      mounted();
      return () => {
        unmounted();
      };
    }, []);
    return (
      <label>
        Review amount
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>
    );
  }
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open review</button>
        <button>Other action</button>
        <MobileWrapperDialog
          title="Retained review"
          isOpen={open}
          onClose={() => setOpen(false)}
          keepMounted
          tabletModal
          enableDragToClose={false}
        >
          <ReviewDraft />
        </MobileWrapperDialog>
      </>
    );
  }
  const user = userEvent.setup();
  const view = render(<Harness />);
  const opener = screen.getByRole("button", { name: "Open review" });
  await user.click(opener);
  const input = screen.getByRole("textbox", { name: "Review amount" });
  await user.type(input, "0.25");
  expect(mounted).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Close" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  );
  expect(input).toBeInTheDocument();
  expect(input).not.toBeVisible();
  expect(
    screen.queryByRole("textbox", { name: "Review amount" })
  ).not.toBeInTheDocument();
  await waitFor(() => expect(opener).toHaveFocus());
  await user.tab();
  expect(screen.getByRole("button", { name: "Other action" })).toHaveFocus();
  expect(unmounted).not.toHaveBeenCalled();
  await user.click(opener);
  expect(screen.getByRole("textbox", { name: "Review amount" })).toBe(input);
  expect(input).toHaveValue("0.25");
  expect(mounted).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(unmounted).toHaveBeenCalledTimes(1);
});

it("does not restore the old opener over another dialog opened during close", async () => {
  jest.mocked(useIsMobileLayoutViewport).mockReturnValue(false);
  jest.mocked(useIsTouchDevice).mockReturnValue(false);
  function Harness() {
    const [first, setFirst] = useState(false);
    const [second, setSecond] = useState(false);
    return (
      <>
        <button onClick={() => setFirst(true)}>First review</button>
        <MobileWrapperDialog
          title="First"
          isOpen={first}
          keepMounted
          onClose={() => {
            setFirst(false);
            setSecond(true);
          }}
          tabletModal
        >
          <input aria-label="First amount" />
        </MobileWrapperDialog>
        <MobileWrapperDialog
          title="Second"
          isOpen={second}
          onClose={() => setSecond(false)}
          tabletModal
        >
          <input aria-label="Second amount" />
        </MobileWrapperDialog>
      </>
    );
  }
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "First review" }));
  await user.click(screen.getByRole("button", { name: "Close" }));
  const second = await screen.findByRole("dialog", { name: "Second" });
  const input = within(second).getByRole("textbox", { name: "Second amount" });
  await user.click(input);
  await user.type(input, "0.5");
  expect(input).toHaveFocus();
  expect(input).toHaveValue("0.5");
  expect(
    screen.getByRole("button", { name: "First review", hidden: true })
  ).not.toHaveFocus();
});

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";

jest.mock("@headlessui/react", () => {
  const Dialog = ({ children, className }: any) => (
    <div data-testid="dialog" className={className}>
      {children}
    </div>
  );
  const DialogPanel = ({ children, className }: any) => (
    <div data-testid="dialog-panel" className={className}>
      {children}
    </div>
  );
  const DialogTitle = ({ children, className }: any) => (
    <div className={className}>{children}</div>
  );
  const Transition = ({ show, children }: any) =>
    show ? <div data-testid="root">{children}</div> : null;
  const TransitionChild = ({ children }: any) => <div>{children}</div>;

  return {
    Dialog,
    DialogPanel,
    DialogTitle,
    Transition,
    TransitionChild,
  };
});

describe("CommonDropdownItemsMobileWrapper", () => {
  it("uses the default z-index class when none is provided", () => {
    const setOpen = jest.fn();

    render(
      <CommonDropdownItemsMobileWrapper isOpen={true} setOpen={setOpen}>
        <li>child</li>
      </CommonDropdownItemsMobileWrapper>
    );

    expect(screen.getByTestId("dialog")).toHaveClass("tw-z-[1000]");
  });

  it("applies a custom z-index class when provided", () => {
    const setOpen = jest.fn();

    render(
      <CommonDropdownItemsMobileWrapper
        isOpen={true}
        setOpen={setOpen}
        zIndexClassName="tw-z-[1020]"
      >
        <li>child</li>
      </CommonDropdownItemsMobileWrapper>
    );

    expect(screen.getByTestId("dialog")).toHaveClass("tw-z-[1020]");
  });

  it("renders when open and closes on button click", () => {
    const setOpen = jest.fn();

    render(
      <CommonDropdownItemsMobileWrapper
        isOpen={true}
        setOpen={setOpen}
        label="test"
      >
        <li>child</li>
      </CommonDropdownItemsMobileWrapper>
    );

    expect(screen.getByText("test")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close panel"));
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onClose,
    onAfterLeave,
    title,
    closeLabel,
    zIndexClassName,
    children,
  }: {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onAfterLeave?: () => void;
    readonly title?: string;
    readonly closeLabel: string;
    readonly zIndexClassName: string;
    readonly children: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="dialog" className={zIndexClassName}>
        {title}
        <button onClick={onClose} aria-label={closeLabel} />
        <button data-testid="transition-after-leave" onClick={onAfterLeave} />
        {children}
      </div>
    ) : null,
}));

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

  it("forwards after leave callback to the transition", () => {
    const setOpen = jest.fn();
    const onAfterLeave = jest.fn();

    render(
      <CommonDropdownItemsMobileWrapper
        isOpen={true}
        setOpen={setOpen}
        onAfterLeave={onAfterLeave}
      >
        <li>child</li>
      </CommonDropdownItemsMobileWrapper>
    );

    fireEvent.click(screen.getByTestId("transition-after-leave"));

    expect(onAfterLeave).toHaveBeenCalled();
  });
});

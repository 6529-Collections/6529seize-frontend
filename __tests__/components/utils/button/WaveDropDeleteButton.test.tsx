import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import WaveDropDeleteButton from "@/components/utils/button/WaveDropDeleteButton";

let mockOpacityProps: any;

jest.mock("@/components/utils/animation/CommonAnimationWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="wrapper">{children}</div>,
}));

jest.mock("@/components/utils/animation/CommonAnimationOpacity", () => ({
  __esModule: true,
  default: (props: any) => {
    mockOpacityProps = props;
    return <div data-testid="opacity">{props.children}</div>;
  },
}));

jest.mock(
  "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal",
  () => ({
    __esModule: true,
    default: ({ onDropDeleted }: any) => (
      <div data-testid="modal">
        <button data-testid="confirm" onClick={() => onDropDeleted()} />
      </div>
    ),
  })
);

describe("WaveDropDeleteButton", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("opens modal and navigates back after deletion", () => {
    const back = jest.spyOn(window.history, "back").mockImplementation();
    render(<WaveDropDeleteButton drop={{ id: "1" } as any} />);
    const trigger = screen.getByRole("button", { name: "Delete Drop" });
    expect(trigger).toHaveClass("tw-h-10", "tw-border-red/20", "tw-bg-red/5");
    fireEvent.click(trigger);
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(mockOpacityProps.elementRole).toBeUndefined();
    fireEvent.click(screen.getByTestId("confirm"));
    jest.advanceTimersByTime(300);
    expect(back).toHaveBeenCalled();
    back.mockRestore();
  });
});

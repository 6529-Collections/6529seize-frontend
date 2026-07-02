import { render } from "@testing-library/react";
import { SidebarSubwaveConnector } from "@/components/brain/left-sidebar/waves/SidebarSubwaveConnector";

describe("SidebarSubwaveConnector", () => {
  it("renders a rounded elbow and continuation rail for non-final subwaves", () => {
    const { container } = render(
      <div className="tw-relative">
        <SidebarSubwaveConnector
          guideLineOffsetClasses="tw-left-9"
          isLastSubwave={false}
        />
      </div>
    );

    const elbow = container.querySelector('[class~="tw-rounded-bl-xl"]');
    const continuation = container.querySelector(
      '[class~="tw-top-1/2"][class~="tw-bottom-0"]'
    );

    expect(container.querySelectorAll("span")).toHaveLength(2);
    expect(elbow).not.toBeNull();
    expect(elbow).toHaveClass("tw-left-9");
    expect(elbow).toHaveClass("tw-top-0");
    expect(elbow).toHaveClass("tw-h-1/2");
    expect(elbow).toHaveClass("tw-w-7");
    expect(elbow).toHaveClass("tw-border-l");
    expect(elbow).toHaveClass("tw-border-b");
    expect(elbow).toHaveClass("tw-rounded-bl-xl");
    expect(continuation).not.toBeNull();
    expect(continuation).toHaveClass("tw-left-9");
    expect(continuation).toHaveClass("tw-border-l");
    expect(continuation).not.toHaveClass("tw-border-b");
  });

  it("omits the continuation rail for the last subwave", () => {
    const { container } = render(
      <div className="tw-relative">
        <SidebarSubwaveConnector
          guideLineOffsetClasses="tw-left-9"
          isLastSubwave
        />
      </div>
    );

    const elbow = container.querySelector('[class~="tw-rounded-bl-xl"]');
    const continuation = container.querySelector(
      '[class~="tw-top-1/2"][class~="tw-bottom-0"]'
    );

    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(elbow).not.toBeNull();
    expect(elbow).toHaveClass("tw-left-9");
    expect(elbow).toHaveClass("tw-top-0");
    expect(elbow).toHaveClass("tw-h-1/2");
    expect(elbow).toHaveClass("tw-w-7");
    expect(elbow).toHaveClass("tw-border-l");
    expect(elbow).toHaveClass("tw-border-b");
    expect(elbow).toHaveClass("tw-rounded-bl-xl");
    expect(continuation).toBeNull();
  });
});

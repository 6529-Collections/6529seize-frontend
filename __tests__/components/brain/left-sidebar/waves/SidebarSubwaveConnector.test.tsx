import { render } from "@testing-library/react";
import { SidebarSubwaveConnector } from "@/components/brain/left-sidebar/waves/SidebarSubwaveConnector";

describe("SidebarSubwaveConnector", () => {
  it("renders a continuous rounded elbow and rail for non-final subwaves", () => {
    const { container } = render(
      <div className="tw-relative">
        <SidebarSubwaveConnector
          guideLineOffsetClasses="tw-left-9"
          isLastSubwave={false}
        />
      </div>
    );

    const spans = container.querySelectorAll("span");
    const trunk = spans.item(0);
    const elbow = spans.item(1);

    expect(spans).toHaveLength(2);
    expect(trunk).toHaveClass("tw-left-9");
    expect(trunk).toHaveClass("tw-top-0");
    expect(trunk).toHaveClass("tw-bottom-0");
    expect(trunk).toHaveClass("tw-border-l");
    expect(trunk).not.toHaveClass("tw-border-b");
    expect(elbow).not.toBeNull();
    expect(elbow).toHaveClass("tw-left-9");
    expect(elbow).toHaveClass("tw-top-0");
    expect(elbow).toHaveClass("tw-h-1/2");
    expect(elbow).toHaveClass("tw-w-7");
    expect(elbow).toHaveClass("tw-border-l");
    expect(elbow).toHaveClass("tw-border-b");
    expect(elbow).toHaveClass("tw-rounded-bl-xl");
  });

  it("uses only the rounded elbow for the last subwave", () => {
    const { container } = render(
      <div className="tw-relative">
        <SidebarSubwaveConnector
          guideLineOffsetClasses="tw-left-9"
          isLastSubwave
        />
      </div>
    );

    const spans = container.querySelectorAll("span");
    const elbow = spans.item(0);

    expect(spans).toHaveLength(1);
    expect(elbow).not.toBeNull();
    expect(elbow).toHaveClass("tw-left-9");
    expect(elbow).toHaveClass("tw-top-0");
    expect(elbow).toHaveClass("tw-h-1/2");
    expect(elbow).toHaveClass("tw-w-7");
    expect(elbow).toHaveClass("tw-border-l");
    expect(elbow).toHaveClass("tw-border-b");
    expect(elbow).toHaveClass("tw-rounded-bl-xl");
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import SingleWaveDropVoteSlider from "@/components/waves/drop/SingleWaveDropVoteSlider";
import { SingleWaveDropVoteSize } from "@/components/waves/drop/SingleWaveDropVote.types";

// Mock framer-motion
jest.mock("framer-motion", () => {
  const MotionDiv = ({ children, style, ...props }: any) => {
    // Don't pass framer-motion specific props to DOM
    const domProps = { ...props };
    delete domProps.whileHover;
    delete domProps.whileTap;
    delete domProps.animate;
    delete domProps.initial;
    delete domProps.transition;
    return (
      <div {...domProps} style={style}>
        {children}
      </div>
    );
  };

  return {
    domAnimation: {},
    LazyMotion: ({ children }: any) => <>{children}</>,
    m: {
      div: MotionDiv,
    },
    motion: {
      div: MotionDiv,
    },
    useMotionValue: (initialValue: number) => ({
      set: jest.fn(),
      get: () => initialValue,
    }),
    useSpring: (value: any) => value,
    useTransform: () => 1,
  };
});

// Mock formatNumberWithCommas
jest.mock("@/helpers/Helpers", () => ({
  formatNumberWithCommas: (num: number) => num.toLocaleString("en-US"),
}));

describe("SingleWaveDropVoteSlider", () => {
  const defaultProps = {
    voteValue: 50,
    minValue: -100,
    maxValue: 100,
    setVoteValue: jest.fn(),
    label: "Rep",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const expectTooltipValue = (value: string) => {
    const values = screen.getAllByText((content, element) => {
      return (
        content === value || element?.textContent?.replace(/\s+/g, "") === value
      );
    });
    expect(values.length).toBeGreaterThan(0);
  };

  it("renders slider with basic elements", () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} />);

    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBeGreaterThan(0);
    expectTooltipValue("50");
  });

  it("displays vote value in tooltip", () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} voteValue={75} />);

    expectTooltipValue("75");
  });

  it("handles string vote value by defaulting to 0", () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} voteValue="invalid" />);

    expectTooltipValue("0");
  });

  it("calls setVoteValue when slider changes", () => {
    const setVoteValue = jest.fn();
    render(
      <SingleWaveDropVoteSlider {...defaultProps} setVoteValue={setVoteValue} />
    );

    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "50" } });

    expect(setVoteValue).toHaveBeenCalled();
  });

  it("calls onValueAccepted when either range input is clicked", () => {
    const onValueAccepted = jest.fn();
    render(
      <SingleWaveDropVoteSlider
        {...defaultProps}
        onValueAccepted={onValueAccepted}
      />
    );

    const sliders = screen.getAllByRole("slider");
    fireEvent.click(sliders[0]);
    fireEvent.click(sliders[1]);

    expect(onValueAccepted).toHaveBeenCalledTimes(2);
  });

  it("clamps accepted values to the slider min and max", () => {
    const onValueAccepted = jest.fn();
    const { rerender } = render(
      <SingleWaveDropVoteSlider
        {...defaultProps}
        voteValue={-5}
        minValue={0}
        maxValue={10}
        onValueAccepted={onValueAccepted}
      />
    );

    fireEvent.click(screen.getAllByRole("slider")[0]);

    expect(onValueAccepted).toHaveBeenLastCalledWith(0);

    rerender(
      <SingleWaveDropVoteSlider
        {...defaultProps}
        voteValue={200}
        minValue={0}
        maxValue={100}
        onValueAccepted={onValueAccepted}
      />
    );

    fireEvent.click(screen.getAllByRole("slider")[0]);

    expect(onValueAccepted).toHaveBeenLastCalledWith(100);
  });

  it("uses semantic progress color for the mini slider", () => {
    const { container } = render(
      <SingleWaveDropVoteSlider
        {...defaultProps}
        voteValue={50}
        size={SingleWaveDropVoteSize.MINI}
      />
    );

    expect(container.querySelector(".tw-bg-emerald-500")).toBeInTheDocument();
  });

  it("uses negative semantic progress color for the mini slider", () => {
    const { container } = render(
      <SingleWaveDropVoteSlider
        {...defaultProps}
        voteValue={-50}
        size={SingleWaveDropVoteSize.MINI}
      />
    );

    expect(container.querySelector(".tw-bg-rose-500")).toBeInTheDocument();
  });

  it("uses neutral semantic progress color for the mini slider", () => {
    const { container } = render(
      <SingleWaveDropVoteSlider
        {...defaultProps}
        voteValue={0}
        size={SingleWaveDropVoteSize.MINI}
      />
    );

    expect(container.querySelector(".tw-bg-iron-400")).toBeInTheDocument();
  });

  it("uses semantic progress color for the normal slider", () => {
    const { container } = render(
      <SingleWaveDropVoteSlider {...defaultProps} voteValue={50} />
    );

    expect(container.querySelector(".tw-bg-emerald-500")).toBeInTheDocument();
  });

  it("handles zero range case", () => {
    render(
      <SingleWaveDropVoteSlider
        {...defaultProps}
        minValue={0}
        maxValue={0}
        voteValue={0}
      />
    );

    expectTooltipValue("0");
  });

  it("handles negative vote values", () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} voteValue={-25} />);

    expectTooltipValue("-25");
  });

  it("stops click propagation from the range input", () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} />);

    const slider = screen.getAllByRole("slider")[0];
    const clickEvent = new MouseEvent("click", { bubbles: true });
    const stopPropagation = jest.spyOn(clickEvent, "stopPropagation");

    slider.dispatchEvent(clickEvent);

    expect(stopPropagation).toHaveBeenCalled();
  });

  it("handles mouse events for dragging state", () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} />);

    const slider = screen.getAllByRole("slider")[1]; // Second slider (thumb hit area)

    fireEvent.mouseDown(slider);
    // Can't easily test isDragging state change due to component encapsulation

    fireEvent.mouseUp(slider);
  });

  it("handles touch events for dragging state", () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} />);

    const slider = screen.getAllByRole("slider")[1]; // Second slider (thumb hit area)

    fireEvent.touchStart(slider);
    fireEvent.touchEnd(slider);
  });

  it("displays correct credit type in tooltip", () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} label="Rep" />);

    expect(screen.getByText("Rep")).toBeInTheDocument();
  });

  it("handles edge case where all values are zero", () => {
    render(
      <SingleWaveDropVoteSlider
        {...defaultProps}
        minValue={0}
        maxValue={0}
        voteValue={0}
      />
    );

    // Should render without crashing and show 0 value
    expectTooltipValue("0");
  });

  it("formats large numbers with commas in tooltip", () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} voteValue={1234567} />);

    const tooltips = screen.getAllByText((content, element) => {
      return Boolean(element?.textContent?.includes("1,234,567"));
    });
    expect(tooltips.length).toBeGreaterThan(0);
  });
});

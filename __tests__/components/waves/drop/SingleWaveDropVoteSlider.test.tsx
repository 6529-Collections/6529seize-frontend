import { render, screen, fireEvent } from '@testing-library/react';
import SingleWaveDropVoteSlider from '../../../../components/waves/drop/SingleWaveDropVoteSlider';
import { ApiWaveCreditType } from '../../../../generated/models/ApiWaveCreditType';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, animate, style, ...props }: any) => {
      // Don't pass framer-motion specific props to DOM
      const domProps = { ...props };
      delete domProps.whileHover;
      delete domProps.whileTap;
      delete domProps.animate;
      delete domProps.initial;
      delete domProps.transition;
      return <div {...domProps} style={style}>{children}</div>;
    },
  },
  useMotionValue: (initialValue: number) => ({
    set: jest.fn(),
    get: () => initialValue,
  }),
  useSpring: (value: any) => value,
  useTransform: () => 1,
}));

// Mock formatNumberWithCommas
jest.mock('../../../../helpers/Helpers', () => ({
  formatNumberWithCommas: (num: number) => num.toLocaleString(),
}));

describe('SingleWaveDropVoteSlider', () => {
  const defaultProps = {
    voteValue: 50,
    minValue: -100,
    maxValue: 100,
    setVoteValue: jest.fn(),
    creditType: ApiWaveCreditType.Rep,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders slider with basic elements', () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} />);
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThan(0);
    const tooltips = screen.getAllByText((content, element) => {
      return element?.textContent === '50 REP';
    });
    expect(tooltips.length).toBeGreaterThan(0); // Vote value in tooltip
  });

  it('displays vote value in tooltip', () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} voteValue={75} />);
    
    const tooltips = screen.getAllByText((content, element) => {
      return element?.textContent === '75 REP';
    });
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('handles string vote value by defaulting to 0', () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} voteValue="invalid" />);
    
    const tooltips = screen.getAllByText((content, element) => {
      return element?.textContent === '0 REP';
    });
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('calls setVoteValue when slider changes', () => {
    const setVoteValue = jest.fn();
    render(<SingleWaveDropVoteSlider {...defaultProps} setVoteValue={setVoteValue} />);
    
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '50' } });
    
    expect(setVoteValue).toHaveBeenCalled();
  });

  it('applies golden theme for rank 1', () => {
    const { container } = render(<SingleWaveDropVoteSlider {...defaultProps} rank={1} />);
    
    const progressBar = container.querySelector('.tw-bg-gradient-to-r.tw-from-\\[\\#E8D48A\\]\\/90');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies silver theme for rank 2', () => {
    const { container } = render(<SingleWaveDropVoteSlider {...defaultProps} rank={2} />);
    
    const progressBar = container.querySelector('.tw-bg-gradient-to-r.tw-from-\\[\\#DDDDDD\\]\\/90');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies bronze theme for rank 3', () => {
    const { container } = render(<SingleWaveDropVoteSlider {...defaultProps} rank={3} />);
    
    const progressBar = container.querySelector('.tw-bg-gradient-to-r.tw-from-\\[\\#CD7F32\\]\\/90');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies default theme for no rank', () => {
    const { container } = render(<SingleWaveDropVoteSlider {...defaultProps} />);
    
    const progressBar = container.querySelector('.tw-bg-gradient-to-r.tw-from-iron-300\\/20');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles zero range case', () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} minValue={0} maxValue={0} voteValue={0} />);
    
    const tooltips = screen.getAllByText((content, element) => {
      return element?.textContent === '0 REP';
    });
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('handles negative vote values', () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} voteValue={-25} />);
    
    const tooltips = screen.getAllByText((content, element) => {
      return element?.textContent === '-25 REP';
    });
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('has click handler on container to stop propagation', () => {
    const { container } = render(<SingleWaveDropVoteSlider {...defaultProps} />);
    
    const sliderContainer = container.querySelector('.tw-h-9');
    expect(sliderContainer).toBeInTheDocument();
    
    // Verify the container doesn't crash when clicked
    fireEvent.click(sliderContainer!);
    
    // The test passes if no errors are thrown and the component remains rendered
    expect(sliderContainer).toBeInTheDocument();
  });

  it('handles mouse events for dragging state', () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} />);
    
    const slider = screen.getAllByRole('slider')[1]; // Second slider (thumb hit area)
    
    fireEvent.mouseDown(slider);
    // Can't easily test isDragging state change due to component encapsulation
    
    fireEvent.mouseUp(slider);
  });

  it('handles touch events for dragging state', () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} />);
    
    const slider = screen.getAllByRole('slider')[1]; // Second slider (thumb hit area)
    
    fireEvent.touchStart(slider);
    fireEvent.touchEnd(slider);
  });

  it('displays correct credit type in tooltip', () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} creditType={ApiWaveCreditType.Rep} />);
    
    const tooltips = screen.getAllByText((content, element) => {
      return element?.textContent === '50 REP';
    });
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('handles edge case where all values are zero', () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} minValue={0} maxValue={0} voteValue={0} />);
    
    // Should render without crashing and show 0 value
    const tooltips = screen.getAllByText((content, element) => {
      return element?.textContent === '0 REP';
    });
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('formats large numbers with commas in tooltip', () => {
    render(<SingleWaveDropVoteSlider {...defaultProps} voteValue={1234567} />);
    
    const tooltips = screen.getAllByText((content, element) => {
      return Boolean(element?.textContent?.includes('1,234,567'));
    });
    expect(tooltips.length).toBeGreaterThan(0);
  });
});
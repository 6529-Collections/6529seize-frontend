import { render } from '@testing-library/react';
import CreateWavesMainStepConnectionLine from '../../../../../components/waves/create-wave/main-steps/CreateWavesMainStepConnectionLine';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, style, ...props }: any) => {
      // Don't pass framer-motion specific props to DOM
      const domProps = { ...props };
      delete domProps.initial;
      delete domProps.animate;
      delete domProps.transition;
      return <div {...domProps} style={style}>{children}</div>;
    },
  },
}));

describe('CreateWavesMainStepConnectionLine', () => {
  it('renders static background line', () => {
    const { container } = render(<CreateWavesMainStepConnectionLine done={false} />);
    
    const backgroundLine = container.querySelector('.tw-bg-iron-700');
    expect(backgroundLine).toBeInTheDocument();
    expect(backgroundLine).toHaveClass('tw-absolute', 'tw-right-3', 'tw-top-10', 'tw-h-full', 'tw-rounded-sm', 'tw-w-0.5');
  });

  it('renders animated progress line when done is false', () => {
    const { container } = render(<CreateWavesMainStepConnectionLine done={false} />);
    
    const progressLine = container.querySelector('.tw-bg-primary-500');
    expect(progressLine).toBeInTheDocument();
    expect(progressLine).toHaveClass('tw-absolute', 'tw-right-3', 'tw-top-10', 'tw-h-full', 'tw-rounded-sm', 'tw-w-0.5');
  });

  it('renders animated progress line when done is true', () => {
    const { container } = render(<CreateWavesMainStepConnectionLine done={true} />);
    
    const progressLine = container.querySelector('.tw-bg-primary-500');
    expect(progressLine).toBeInTheDocument();
    expect(progressLine).toHaveClass('tw-absolute', 'tw-right-3', 'tw-top-10', 'tw-h-full', 'tw-rounded-sm', 'tw-w-0.5');
  });

  it('has proper aria-hidden attributes for accessibility', () => {
    const { container } = render(<CreateWavesMainStepConnectionLine done={true} />);
    
    const lines = container.querySelectorAll('[aria-hidden="true"]');
    expect(lines).toHaveLength(2);
  });

  it('progress line is present when component renders', () => {
    const { container } = render(<CreateWavesMainStepConnectionLine done={true} />);
    
    const progressLine = container.querySelector('.tw-bg-primary-500');
    expect(progressLine).toBeInTheDocument();
    expect(progressLine).toHaveClass('tw-bg-primary-500');
  });
});
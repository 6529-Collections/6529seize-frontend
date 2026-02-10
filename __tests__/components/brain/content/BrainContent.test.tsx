import { render, screen, fireEvent } from '@testing-library/react';
import BrainContent from '@/components/brain/content/BrainContent';
import { ActiveDropAction } from '@/types/dropInteractionTypes';

let bpValue = 'S';
const registerRef = jest.fn();

jest.mock('react-use', () => ({
  createBreakpoint: () => () => bpValue,
}));

jest.mock('@/hooks/useDeviceInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: true })),
}));

jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: () => ({ registerRef }),
}));

jest.mock('@/components/brain/content/BrainContentPinnedWaves', () => ({
  __esModule: true,
  default: () => <div data-testid="pinned" />,
}));

jest.mock('@/components/brain/content/input/BrainContentInput', () => ({
  __esModule: true,
  default: ({ activeDrop, onCancelReplyQuote }: any) => (
    <div data-testid="input">
      {activeDrop?.id ?? 'no-drop'}
      <button onClick={onCancelReplyQuote}>cancel</button>
    </div>
  ),
}));

describe('BrainContent', () => {
  beforeEach(() => {
    registerRef.mockClear();
  });

  it('shows pinned waves on small breakpoint', () => {
    bpValue = 'S';
      render(
        <BrainContent
          activeDrop={{
            action: ActiveDropAction.REPLY,
            drop: { id: 'd', wave: { id: 'w' } } as any,
            partId: 0,
          }}
          onCancelReplyQuote={jest.fn()}
        >
          child
        </BrainContent>
      );
    expect(screen.getByTestId('pinned')).toBeInTheDocument();
    expect(registerRef).toHaveBeenCalledWith('pinned', expect.any(HTMLElement));
  });

  it('hides pinned waves on large breakpoint', () => {
    bpValue = 'LG';
    render(
      <BrainContent activeDrop={null} onCancelReplyQuote={jest.fn()}>
        child
      </BrainContent>
    );
    expect(screen.queryByTestId('pinned')).toBeNull();
  });

  it('passes props to BrainContentInput', () => {
    bpValue = 'S';
    const onCancel = jest.fn();
      render(
        <BrainContent
          activeDrop={{
            id: 'x',
            action: ActiveDropAction.REPLY,
            drop: { id: 'x', wave: { id: 'w' } } as any,
            partId: 0,
          } as any}
          onCancelReplyQuote={onCancel}
        >
          child
        </BrainContent>
      );
    expect(screen.getByTestId('input')).toHaveTextContent('x');
    fireEvent.click(screen.getByText('cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});

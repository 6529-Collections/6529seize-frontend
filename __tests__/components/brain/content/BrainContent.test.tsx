import { render, screen, fireEvent } from '@testing-library/react';
import BrainContent from '@/components/brain/content/BrainContent';
import { ActiveDropAction } from '@/types/dropInteractionTypes';

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
  it('renders children without the old pinned waves slot', () => {
    render(
      <BrainContent activeDrop={null} onCancelReplyQuote={jest.fn()}>
        child
      </BrainContent>
    );
    expect(screen.getByText('child')).toBeInTheDocument();
    expect(screen.queryByTestId('pinned')).toBeNull();
  });

  it('passes props to BrainContentInput', () => {
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

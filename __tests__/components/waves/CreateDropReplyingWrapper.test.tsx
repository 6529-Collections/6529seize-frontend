import { render, screen } from '@testing-library/react';
import React from 'react';
import CreateDropReplyingWrapper from '@/components/waves/CreateDropReplyingWrapper';
import { ActiveDropAction } from '@/types/dropInteractionTypes';

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> }
}));

jest.mock('@/components/waves/CreateDropReplying', () => ({ __esModule: true, default: (p: any) => <div data-testid="child" data-disabled={p.disabled} /> }));

describe('CreateDropReplyingWrapper', () => {
  const drop = { id: 'd1', author: { handle: 'bob' } } as any;
  it('renders child when different drop id', () => {
    render(
      <CreateDropReplyingWrapper activeDrop={{ drop, action: ActiveDropAction.REPLY }} submitting={false} dropId="other" onCancelReplyQuote={() => {}} />
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveAttribute('data-disabled', 'false');
  });

  it('does not render when no active drop', () => {
    const { queryByTestId } = render(
      <CreateDropReplyingWrapper activeDrop={null} submitting={false} dropId={null} onCancelReplyQuote={() => {}} />
    );
    expect(queryByTestId('child')).toBeNull();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateDropReplyingWrapper from '../../../components/waves/CreateDropReplyingWrapper';
import { ActiveDropAction } from '../../../types/dropInteractionTypes';

jest.mock('../../../components/waves/CreateDropReplying', () => (props: any) => <div data-testid="replying">{props.action}</div>);

test('renders when active drop differs from current dropId', () => {
  const active = { drop: { id: '1' }, action: ActiveDropAction.REPLY } as any;
  render(<CreateDropReplyingWrapper activeDrop={active} submitting={false} dropId="2" onCancelReplyQuote={jest.fn()} />);
  expect(screen.getByTestId('replying')).toHaveTextContent(String(ActiveDropAction.REPLY));
});

test('does not render when ids match', () => {
  const active = { drop: { id: '1' }, action: ActiveDropAction.REPLY } as any;
  const { container } = render(<CreateDropReplyingWrapper activeDrop={active} submitting={false} dropId="1" onCancelReplyQuote={jest.fn()} />);
  expect(container.firstChild).toBeNull();
});

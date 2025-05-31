import React from 'react';
import { render, screen } from '@testing-library/react';
import NotificationItem from '../../../../../components/brain/notifications/NotificationItem';
import { ApiNotificationCause } from '../../../../../generated/models/ApiNotificationCause';

jest.mock('../../../../../components/brain/notifications/drop-quoted/NotificationDropQuoted', () => ({ __esModule: true, default: () => <div data-testid="quoted" /> }));
jest.mock('../../../../../components/brain/notifications/drop-replied/NotificationDropReplied', () => ({ __esModule: true, default: () => <div data-testid="replied" /> }));

describe('NotificationItem', () => {
  const base = { id: '1' } as any;
  it('renders quoted component', () => {
    render(<NotificationItem notification={{ ...base, cause: ApiNotificationCause.DropQuoted }} activeDrop={null} onReply={jest.fn()} onQuote={jest.fn()} />);
    expect(screen.getByTestId('quoted')).toBeInTheDocument();
  });

  it('renders replied component', () => {
    render(<NotificationItem notification={{ ...base, cause: ApiNotificationCause.DropReplied }} activeDrop={null} onReply={jest.fn()} onQuote={jest.fn()} />);
    expect(screen.getByTestId('replied')).toBeInTheDocument();
  });
});

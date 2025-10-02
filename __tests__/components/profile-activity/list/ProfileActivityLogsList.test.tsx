import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileActivityLogsList from '@/components/profile-activity/list/ProfileActivityLogsList';

jest.mock('@/components/profile-activity/list/ProfileActivityLogsItem', () => (props: any) => <tr data-testid="item" data-id={props.log.id} />);
jest.mock('@/components/profile-activity/list/items/utils/ProfileActivityLogItemWrapper', () => (props: any) => <>{props.children}</>);

describe('ProfileActivityLogsList', () => {
  it('renders one row per log', () => {
    const logs = [{ id: '1' }, { id: '2' }] as any;
    render(<ProfileActivityLogsList logs={logs} user={null} />);
    const items = screen.getAllByTestId('item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('data-id', '1');
  });
});

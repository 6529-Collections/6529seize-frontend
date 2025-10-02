import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectGroupModalItems from '@/components/utils/select-group/SelectGroupModalItems';
import { ApiGroupFull } from '@/generated/models/ApiGroupFull';

jest.mock('@/components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { XXLARGE: 'xx' }
}));

jest.mock('@/components/groups/select/item/GroupItem', () => ({ __esModule: true, default: (props: any) => (
  <div data-testid={`group-${props.group.id}`} onClick={() => props.onActiveGroupId()} />
) }));

describe('SelectGroupModalItems', () => {
  const groups: ApiGroupFull[] = [
    { id: '1', name: 'A' } as ApiGroupFull,
    { id: '2', name: 'B' } as ApiGroupFull
  ];

  it('shows loader when loading', () => {
    render(<SelectGroupModalItems groups={groups} loading={true} onGroupSelect={jest.fn()} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders group items and handles selection', async () => {
    const onSelect = jest.fn();
    render(<SelectGroupModalItems groups={groups} loading={false} onGroupSelect={onSelect} />);
    await userEvent.click(screen.getByTestId('group-2'));
    expect(onSelect).toHaveBeenCalledWith(groups[1]);
  });
});

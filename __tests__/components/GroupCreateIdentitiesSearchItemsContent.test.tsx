import { render, screen } from '@testing-library/react';
import React from 'react';
import GroupCreateIdentitiesSearchItemsContent from '../../components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearchItemsContent';

jest.mock('../../components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearchItem', () => ({ __esModule: true, default: (props: any) => <div data-testid="item" data-selected={props.selected}>{props.item.display}</div> }));

const items = [
  { wallet: '1', display: 'one' },
  { wallet: '2', display: 'two' },
] as any;

describe('GroupCreateIdentitiesSearchItemsContent', () => {
  it('shows loading text', () => {
    render(
      <ul>
        <GroupCreateIdentitiesSearchItemsContent items={items} loading={true} selectedWallets={[]} onSelect={jest.fn()} />
      </ul>
    );
    expect(screen.getByText('Loading...', { selector: 'li' })).toBeInTheDocument();
  });

  it('renders items when provided', () => {
    render(
      <ul>
        <GroupCreateIdentitiesSearchItemsContent items={items} loading={false} selectedWallets={["2"]} onSelect={jest.fn()} />
      </ul>
    );
    const rendered = screen.getAllByTestId('item');
    expect(rendered).toHaveLength(2);
    expect(rendered[1]).toHaveAttribute('data-selected', 'true');
  });

  it('shows no results when empty', () => {
    render(
      <ul>
        <GroupCreateIdentitiesSearchItemsContent items={[]} loading={false} selectedWallets={[]} onSelect={jest.fn()} />
      </ul>
    );
    expect(screen.getByText('No results')).toBeInTheDocument();
  });
});

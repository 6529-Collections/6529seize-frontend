import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateIdentitiesSearch from '@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch';

jest.mock('@/helpers/AllowlistToolHelpers', () => ({
  getRandomObjectId: () => 'id'
}));

jest.mock('@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearchItems', () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="identity-search-items"
      data-results-layout={props.resultsLayout}
    >
      {props.open && <button onClick={() => props.onSelect({ wallet: '0x1' })}>select</button>}
    </div>
  )
}));

describe('GroupCreateIdentitiesSearch', () => {
  it('opens on focus and resets on select', async () => {
    const onSelect = jest.fn();
    render(<GroupCreateIdentitiesSearch selectedWallets={[]} onIdentitySelect={onSelect} />);

    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    expect(screen.getByText('select')).toBeInTheDocument();

    await userEvent.type(input, 'abc');
    expect(input).toHaveValue('abc');

    await userEvent.click(screen.getByText('select'));
    expect(onSelect).toHaveBeenCalledWith({ wallet: '0x1' });
    expect(input).toHaveValue('');
  });

  it('passes inline results layout to search items', () => {
    render(
      <GroupCreateIdentitiesSearch
        selectedWallets={[]}
        resultsLayout="inline"
        onIdentitySelect={jest.fn()}
      />
    );

    expect(screen.getByTestId('identity-search-items')).toHaveAttribute(
      'data-results-layout',
      'inline'
    );
  });

  it('keeps results open while tabbing inside search and closes after leaving', async () => {
    const user = userEvent.setup();
    render(
      <>
        <GroupCreateIdentitiesSearch
          selectedWallets={[]}
          onIdentitySelect={jest.fn()}
        />
        <button type="button">outside</button>
      </>
    );

    const input = screen.getByRole('textbox');
    await user.click(input);
    expect(screen.getByRole('button', { name: 'select' })).toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole('button', { name: 'select' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'outside' })).toHaveFocus();
    expect(
      screen.queryByRole('button', { name: 'select' })
    ).not.toBeInTheDocument();
  });
});

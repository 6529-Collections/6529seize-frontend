import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateIdentitiesSearch from '../../../components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch';

jest.mock('../../../helpers/AllowlistToolHelpers', () => ({
  getRandomObjectId: () => 'id'
}));

jest.mock('../../../components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearchItems', () => ({
  __esModule: true,
  default: (props: any) => (
    <div>{props.open && <button onClick={() => props.onSelect({ wallet: '0x1' })}>select</button>}</div>
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
});

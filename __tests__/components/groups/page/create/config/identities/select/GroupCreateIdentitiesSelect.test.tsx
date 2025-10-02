import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import GroupCreateIdentitiesSelect from '@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSelect';
import { CommunityMemberMinimal } from '@/entities/IProfile';

let searchProps: any;
jest.mock('@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch', () => (props: any) => { searchProps = props; return <button data-testid="search" onClick={() => props.onIdentitySelect({ wallet: 'w1', handle: 'h1' })} />; });
let itemsProps: any;
jest.mock('@/components/groups/page/create/config/GroupCreateIdentitySelectedItems', () => (props: any) => { itemsProps = props; return <div data-testid="items" onClick={() => props.onRemove('w1')}></div>; });

describe('GroupCreateIdentitiesSelect', () => {
  it('passes props to children and handles events', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const onRemove = jest.fn();
    const identities: CommunityMemberMinimal[] = [{ wallet: 'w2', handle: 'h2' } as any];
    render(
      <GroupCreateIdentitiesSelect
        onIdentitySelect={onSelect}
        selectedIdentities={identities}
        selectedWallets={['w2']}
        onRemove={onRemove}
      />
    );
    await user.click(screen.getByTestId('search'));
    expect(onSelect).toHaveBeenCalledWith({ wallet: 'w1', handle: 'h1' });
    expect(searchProps.selectedWallets).toEqual(['w2']);
    await user.click(screen.getByTestId('items'));
    expect(onRemove).toHaveBeenCalledWith('w1');
    expect(itemsProps.selectedIdentities).toBe(identities);
  });
});


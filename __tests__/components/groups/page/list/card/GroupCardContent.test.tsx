import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthContext } from '@/components/auth/Auth';

const GroupCardContent = require('@/components/groups/page/list/card/GroupCardContent').default;
const { GroupCardState } = require('@/components/groups/page/list/card/GroupCard');

const group: any = { 
  id: 'g1', 
  name: 'My Group',
  group: {
    tdh: {},
    rep: {},
    cic: {},
    level: {},
    identity_group_identities_count: 0
  }
};

function renderComp(options: {handle?: string|null, setState?: (s: GroupCardState) => void, haveActive?: boolean} = {}) {
  const {handle = null, setState = undefined, haveActive = false} = options;
  return render(
    <AuthContext.Provider value={{ connectedProfile: handle ? { handle } : null } as any}>
      <GroupCardContent group={group} haveActiveGroupVoteAll={haveActive} setState={setState} />
    </AuthContext.Provider>
  );
}

describe('GroupCardContent', () => {
  it('shows group name', () => {
    renderComp();
    expect(screen.getByText('My Group')).toBeInTheDocument();
    expect(screen.queryByText('Rep all')).toBeNull();
  });

  it('renders buttons when connected', () => {
    const setState = jest.fn();
    renderComp({ handle:'me', setState });
    fireEvent.click(screen.getByRole('button', { name: 'Rep all' }));
    expect(setState).toHaveBeenCalledWith(GroupCardState.REP);
    fireEvent.click(screen.getByRole('button', { name: 'NIC all' }));
    expect(setState).toHaveBeenCalledWith(GroupCardState.NIC);
  });

  it('disables buttons when vote all active', () => {
    const setState = jest.fn();
    renderComp({ handle:'me', setState, haveActive:true });
    expect(screen.getByRole('button', { name:'Rep all' })).toBeDisabled();
    expect(screen.getByRole('button', { name:'NIC all' })).toBeDisabled();
  });
});

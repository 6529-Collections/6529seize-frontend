import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupsListSearch from '../../../../../../components/groups/page/list/search/GroupsListSearch';

let identityProps: any = null;

jest.mock('../../../../../../components/utils/input/identity/IdentitySearch', () => ({
  __esModule: true,
  IdentitySearchSize: { SM: 'sm' },
  default: (props: any) => { identityProps = props; return <div data-testid="identity" />; }
}));

jest.mock('../../../../../../helpers/AllowlistToolHelpers', () => ({
  __esModule: true,
  getRandomObjectId: () => 'id1'
}));

describe('GroupsListSearch', () => {
  beforeEach(() => { identityProps = null; });

  it('handles identity search and group name input', async () => {
    const setIdentity = jest.fn();
    const setGroupName = jest.fn();
    function Wrapper() {
      const [id, setId] = React.useState<string | null>(null);
      const [name, setName] = React.useState('');
      return (
        <GroupsListSearch
          identity={id}
          groupName={name}
          showIdentitySearch={true}
          showCreateNewGroupButton={false}
          showMyGroupsButton={false}
          setIdentity={(v) => { setId(v); setIdentity(v); }}
          setGroupName={(v) => { setName(v ?? ''); setGroupName(v); }}
          onCreateNewGroup={jest.fn()}
          onMyGroups={jest.fn()}
        />
      );
    }
    render(<Wrapper />);
    expect(screen.getByTestId('identity')).toBeInTheDocument();
    identityProps.setIdentity('bob');
    expect(setIdentity).toHaveBeenCalledWith('bob');
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'group');
    expect(setGroupName).toHaveBeenLastCalledWith('group');
    expect(input).toHaveValue('group');
    const clear = screen.getByLabelText('Clear group name');
    await userEvent.click(clear);
    expect(setGroupName).toHaveBeenCalledWith(null);
  });

  it('fires callbacks for my groups and create new', async () => {
    const onCreateNewGroup = jest.fn();
    const onMyGroups = jest.fn();
    render(
      <GroupsListSearch
        identity={null}
        groupName={null}
        showIdentitySearch={false}
        showCreateNewGroupButton={true}
        showMyGroupsButton={true}
        setIdentity={jest.fn()}
        setGroupName={jest.fn()}
        onCreateNewGroup={onCreateNewGroup}
        onMyGroups={onMyGroups}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'My groups' }));
    expect(onMyGroups).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Create New' }));
    expect(onCreateNewGroup).toHaveBeenCalled();
  });
});

import { render, screen } from '@testing-library/react';
import CreateWaveGroups from '@/components/waves/create-wave/groups/CreateWaveGroups';
import { ApiWaveType } from '@/generated/models/ApiWaveType';
import { CREATE_WAVE_GROUPS } from '@/helpers/waves/waves.constants';

jest.mock('@/components/waves/create-wave/groups/CreateWaveGroup', () => (props: any) => (
  <div data-testid="group">{props.groupType}</div>
));
jest.mock('@/components/waves/create-wave/utils/CreateWaveWarning', () => (props: any) => (
  <div data-testid="warning">{props.title}</div>
));

describe('CreateWaveGroups', () => {
  it('renders groups and warning when restricted', () => {
    const groups = { admin: '1', canView: '2' } as any;
    render(
      <CreateWaveGroups
        waveType={ApiWaveType.Rank}
        groups={groups}
        onGroupSelect={jest.fn()}
        chatEnabled={false}
        adminCanDeleteDrops={false}
        groupsCache={{}} 
        setChatEnabled={jest.fn()}
        setDropsAdminCanDelete={jest.fn()}
      />
    );
    expect(screen.getAllByTestId('group')).toHaveLength(CREATE_WAVE_GROUPS[ApiWaveType.Rank].length);
    expect(screen.getByTestId('warning')).toBeInTheDocument();
  });
});

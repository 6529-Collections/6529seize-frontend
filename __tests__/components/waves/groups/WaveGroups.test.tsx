import { render } from '@testing-library/react';
import React from 'react';
import WaveGroups from '@/components/waves/groups/WaveGroups';
import { ApiWaveType } from '@/generated/models/ApiWaveType';

// Capture props passed to the mocked WaveGroup component
const captured: any[] = [];
jest.mock('@/components/waves/specs/groups/group/WaveGroup', () => {
  const { WaveGroupType } = jest.requireActual('../../../../components/waves/specs/groups/group/WaveGroup.types');
  return {
    __esModule: true,
    default: (props: any) => {
      captured.push(props);
      return <div data-testid={`group-${props.type}`} />;
    },
    WaveGroupType,
  };
});

describe('WaveGroups', () => {
  const baseWave: any = {
    wave: { type: ApiWaveType.Rank, admin_group: null, authenticated_user_eligible_for_admin: true },
    visibility: { scope: {} },
    participation: { scope: {}, authenticated_user_eligible: true },
    voting: { scope: {}, authenticated_user_eligible: false },
    chat: { scope: {}, authenticated_user_eligible: true },
  };

  beforeEach(() => {
    captured.length = 0;
  });

  it('renders all groups with ring by default', () => {
    const { getAllByTestId, container } = render(<WaveGroups wave={baseWave} />);
    expect(getAllByTestId(/group-/)).toHaveLength(5);
    expect(captured.map((c) => c.type)).toEqual([
      'VIEW',
      'DROP',
      'VOTE',
      'CHAT',
      'ADMIN',
    ]);
    const inner = container.querySelector('.tw-h-full') as HTMLElement;
    expect(inner.className).toContain('tw-ring-1');
  });

  it('omits drop and vote groups for chat waves and no ring', () => {
    const wave = { ...baseWave, wave: { ...baseWave.wave, type: ApiWaveType.Chat } };
    const { getAllByTestId, container } = render(<WaveGroups wave={wave} useRing={false} />);
    expect(getAllByTestId(/group-/)).toHaveLength(3);
    expect(captured.map((c) => c.type)).toEqual([
      'VIEW',
      'CHAT',
      'ADMIN',
    ]);
    const inner = container.querySelector('.tw-h-full') as HTMLElement;
    expect(inner.className).toContain('tw-rounded-b-xl');
  });
});

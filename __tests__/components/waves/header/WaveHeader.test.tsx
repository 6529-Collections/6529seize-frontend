import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveHeader, { WaveHeaderPinnedSide } from '../../../../components/waves/header/WaveHeader';
import { ApiWaveType } from '../../../../generated/models/ApiWaveType';
import { AuthContext } from '../../../../components/auth/Auth';

jest.mock('../../../../components/waves/header/WaveHeaderFollow', () => () => <div />);
jest.mock('../../../../components/waves/header/options/WaveHeaderOptions', () => () => <div />);
jest.mock('../../../../components/waves/header/name/WaveHeaderName', () => () => <div data-testid="name" />);
jest.mock('../../../../components/waves/header/WaveHeaderFollowers', () => () => <div />);
jest.mock('../../../../components/waves/header/WaveHeaderPinned', () => () => <div data-testid="pinned" />);
jest.mock('../../../../components/waves/WavePicture', () => () => <div />);
jest.mock('../../../../components/waves/specs/WaveNotificationSettings', () => () => <div />);

const baseWave: any = {
  id: 'w',
  name: 'Wave',
  created_at: 0,
  picture: 'p',
  author: { handle: 'a', banner1_color: '#000', banner2_color: '#111' },
  contributors_overview: [],
  metrics: { drops_count: 1 },
  wave: { type: ApiWaveType.Chat },
};

describe('WaveHeader', () => {
  const wrapper = (wave:any, props?:any) =>
    render(
      <AuthContext.Provider value={{ connectedProfile: null, activeProfileProxy: null } as any}>
        <WaveHeader wave={wave} onFollowersClick={jest.fn()} {...props} />
      </AuthContext.Provider>
    );

  it('shows drop icon when wave not chat', () => {
    wrapper({ ...baseWave, wave: { type: ApiWaveType.Approve } });
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('omits drop icon for chat waves and applies ring classes', () => {
    const { container } = wrapper(baseWave, { useRing: false, useRounded: false, pinnedSide: WaveHeaderPinnedSide.RIGHT });
    expect(document.querySelector('svg')).toBeNull();
    expect(container.firstChild?.firstChild).not.toHaveClass('tw-ring-1');
  });
});

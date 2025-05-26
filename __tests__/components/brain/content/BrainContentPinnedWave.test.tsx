import { render, fireEvent } from '@testing-library/react';
import BrainContentPinnedWave from '../../../../components/brain/content/BrainContentPinnedWave';
import { ApiWaveType } from '../../../../generated/models/ObjectSerializer';

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    push: jest.fn(),
  }),
}));

jest.mock('../../../../hooks/usePrefetchWaveData', () => ({
  usePrefetchWaveData: () => jest.fn(),
}));

jest.mock('../../../../hooks/useWaveData', () => ({
  useWaveData: () => ({
    data: {
      name: 'wave name',
      picture: '',
      wave: { type: ApiWaveType.Chat },
      contributors_overview: [],
    },
  }),
}));

jest.mock('../../../../hooks/isMobileDevice', () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock('../../../../contexts/wave/MyStreamContext', () => ({
  useMyStream: () => ({ registerWave: jest.fn() }),
}));

describe('BrainContentPinnedWave', () => {
  it('calls callbacks on hover and remove', () => {
    const onMouseEnter = jest.fn();
    const onMouseLeave = jest.fn();
    const onRemove = jest.fn();
    const { getByRole } = render(
      <BrainContentPinnedWave
        waveId="1"
        active={false}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onRemove={onRemove}
      />,
    );
    fireEvent.mouseEnter(getByRole('link').parentElement!);
    expect(onMouseEnter).toHaveBeenCalledWith('1');
    fireEvent.click(getByRole('button', { name: 'Remove wave' }));
    expect(onRemove).toHaveBeenCalledWith('1');
  });
});

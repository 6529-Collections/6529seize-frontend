import { render } from '@testing-library/react';
import React from 'react';
import WaveTypeIcon from '../../../../components/waves/specs/WaveTypeIcon';
import { ApiWaveType } from '../../../../generated/models/ApiWaveType';
import { WAVE_LABELS } from '../../../../helpers/waves/waves.constants';

describe('WaveTypeIcon', () => {
  it('displays wave type label', () => {
    const { getByText } = render(<WaveTypeIcon waveType={ApiWaveType.Chat} />);
    expect(getByText(WAVE_LABELS[ApiWaveType.Chat])).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveItemChat from '../../../../components/waves/list/WaveItemChat';

jest.mock('../../../../hooks/useWaveById', () => ({ useWaveById: jest.fn() }));
jest.mock('../../../../components/waves/ChatItemHrefButtons', () => (p: any) => <div data-testid="href-buttons">{p.relativeHref}</div>);
jest.mock('../../../../components/waves/list/WaveItem', () => (p: any) => <div data-testid="wave-item">{p.wave ? p.wave.id : 'none'}</div>);

const { useWaveById } = require('../../../../hooks/useWaveById');

describe('WaveItemChat', () => {
  it('passes wave data and relative link', () => {
    (useWaveById as jest.Mock).mockReturnValue({ wave: { id: 'w1' } });
    render(<WaveItemChat href="https://a" waveId="w1" />);
    expect(screen.getByTestId('wave-item')).toHaveTextContent('w1');
    expect(screen.getByTestId('href-buttons')).toHaveTextContent('/waves/w1');
  });
});

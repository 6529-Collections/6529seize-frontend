import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultSingleWaveDrop } from '../../../../components/waves/drop/DefaultSingleWaveDrop';
import { SingleWaveDropTab } from '../../../../components/waves/drop/SingleWaveDrop';

jest.mock('../../../../components/waves/drop/SingleWaveDropHeader', () => ({
  __esModule: true,
  SingleWaveDropHeader: (props: any) => (
    <button data-testid="header" onClick={() => props.setActiveTab(SingleWaveDropTab.CHAT)} />
  ),
}));

jest.mock('../../../../components/waves/drop/SingleWaveDropInfoPanel', () => ({
  __esModule: true,
  SingleWaveDropInfoPanel: (props: any) => <div data-testid="info">{props.activeTab}</div>,
}));

jest.mock('../../../../components/waves/drop/SingleWaveDropChat', () => ({
  __esModule: true,
  SingleWaveDropChat: () => <div data-testid="chat" />,
}));

jest.mock('../../../../hooks/useDrop', () => ({ useDrop: () => ({ drop: { id: '1', wave: { id: 'w1' } } }) }));
jest.mock('../../../../hooks/useWaveData', () => ({ useWaveData: () => ({ data: { id: 'w1' } }) }));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/p',
}));

describe('DefaultSingleWaveDrop', () => {
  it('renders info panel and chat toggle', async () => {
    render(<DefaultSingleWaveDrop drop={{ id: '1', wave: { id: 'w1' } } as any} onClose={jest.fn()} />);
    expect(screen.getByTestId('info')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('header'));
    expect(screen.getByTestId('chat')).toBeInTheDocument();
  });
});

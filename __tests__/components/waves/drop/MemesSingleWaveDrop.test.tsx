import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemesSingleWaveDrop } from '../../../../components/waves/drop/MemesSingleWaveDrop';
import { SingleWaveDropTab } from '../../../../components/waves/drop/SingleWaveDrop';

let headerProps: any;

jest.mock('../../../../components/waves/drop/SingleWaveDropHeader', () => ({
  __esModule: true,
  SingleWaveDropHeader: (props: any) => { headerProps = props; return <button data-testid="header" onClick={() => props.setActiveTab(SingleWaveDropTab.CHAT)} />; }
}));
jest.mock('../../../../components/waves/drop/SingleWaveDropChat', () => ({
  __esModule: true,
  SingleWaveDropChat: () => <div data-testid="chat" />,
}));
jest.mock('../../../../components/waves/drop/MemesSingleWaveDropInfoPanel', () => ({
  MemesSingleWaveDropInfoPanel: (props: any) => <div data-testid="info" data-wave={props.wave?.id} />
}));

jest.mock('../../../../hooks/useDrop', () => ({ useDrop: () => ({ drop: { id: 'd1', wave: { id: 'w1' } } }) }));
jest.mock('../../../../hooks/useWaveData', () => ({ useWaveData: () => ({ data: { id: 'w1' } }) }));
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn(), pathname: '/p' }) }));

describe('MemesSingleWaveDrop', () => {
  it('renders info panel and toggles chat', () => {
    render(<MemesSingleWaveDrop drop={{ id:'d1', wave:{ id:'w1' }, stableHash:'sh', stableKey:'sk' } as any} onClose={jest.fn()} />);
    expect(screen.getByTestId('info')).toHaveAttribute('data-wave','w1');
    headerProps.setActiveTab(SingleWaveDropTab.CHAT);
    expect(screen.getByTestId('chat')).toBeInTheDocument();
  });
});

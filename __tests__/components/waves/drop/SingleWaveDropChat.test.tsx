import { render, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { SingleWaveDropChat } from '@/components/waves/drop/SingleWaveDropChat';

jest.mock('@/hooks/useCapacitor', () => () => false);
jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({ useLayout: () => ({ spaces: { measurementsComplete: true, headerSpace: 10 } }) }));

let capturedProps: any;
jest.mock('@/components/waves/drops/WaveDropsAll', () => ({ __esModule: true, default: (props: any) => { capturedProps = props; return <div data-testid="drops-all" />; } }));

jest.mock('@/components/waves/CreateDropWaveWrapper', () => ({ CreateDropWaveWrapper: ({ children }: any) => <div>{children}</div>, CreateDropWaveWrapperContext: { SINGLE_DROP: 'SINGLE_DROP' } }));

jest.mock('@/components/waves/PrivilegedDropCreator', () => ({ __esModule: true, default: (props: any) => <div data-testid="creator" onClick={props.onCancelReplyQuote} data-part={props.activeDrop?.partId} data-action={props.activeDrop?.action} />, DropMode: { BOTH: 'BOTH' } }));

// Mock window.matchMedia for useDeviceInfo hook
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('SingleWaveDropChat', () => {
  it('handles reply and reset actions', () => {
    const wave: any = { id: 'w1' };
    const drop: any = { id: 'd1' };
    render(<SingleWaveDropChat wave={wave} drop={drop} />);

    expect(capturedProps.waveId).toBe('w1');
    expect(capturedProps.dropId).toBe('d1');

    act(() => capturedProps.onReply({ drop, partId: 2 }));
    expect(document.querySelector('[data-part="2"]')).toBeInTheDocument();

    fireEvent.click(document.querySelector('[data-testid="creator"]')!);
    expect(document.querySelector('[data-part="1"]')).toBeInTheDocument();
  });
});

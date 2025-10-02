import { render } from '@testing-library/react';
import React from 'react';
import BrainRightSidebarFollowers from '@/components/brain/right-sidebar/BrainRightSidebarFollowers';

let capturedProps: any;
jest.mock('@/components/waves/followers/WaveFollowersList', () => ({ __esModule: true, default: (props: any) => { capturedProps = props; return <div data-testid="list"/>; } }));

describe('BrainRightSidebarFollowers', () => {
  it('passes wave and close handler to list', () => {
    const close = jest.fn();
    const wave: any = { id: 'w' };
    render(<BrainRightSidebarFollowers wave={wave} closeFollowers={close} />);
    expect(capturedProps.wave).toBe(wave);
    expect(capturedProps.onBackClick).toBe(close);
  });
});

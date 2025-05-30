import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { WaveWinnersDropContent } from '../../../../../components/waves/winners/drops/WaveWinnersDropContent';

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push }) }));

const WaveDropContentMock = jest.fn((props: any) => (
  <button data-testid="content" onClick={() => props.onDropContentClick(props.drop)} />
));

jest.mock('../../../../../components/waves/drops/WaveDropContent', () => ({
  __esModule: true,
  default: (props: any) => WaveDropContentMock(props),
}));

describe('WaveWinnersDropContent', () => {
  const winner: any = { drop: { id: 'd1', wave: { id: 'w1' }, serial_no: 2 } };
  it('passes initial index and handles click', async () => {
    const user = userEvent.setup();
    render(<WaveWinnersDropContent winner={winner} />);
    
    // Check that the mock was called
    expect(WaveDropContentMock).toHaveBeenCalled();
    
    // Get the call arguments and verify specific properties
    const callArgs = WaveDropContentMock.mock.calls[0][0];
    expect(callArgs.activePartIndex).toBe(0);
    expect(callArgs.drop.id).toBe('d1');
    expect(callArgs.drop.serial_no).toBe(2);
    expect(callArgs.drop.type).toBe('FULL');
    expect(callArgs.drop.wave.id).toBe('w1');
    
    await user.click(screen.getByTestId('content'));
    expect(push).toHaveBeenCalledWith('/my-stream?wave=w1&serialNo=2/', undefined, { shallow: true });
  });
});

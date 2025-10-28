import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('@/components/waves/drops/WaveDropQuote', () => (props: any) => (
  <div data-testid="quote">{props.drop ? props.drop.id : 'none'}</div>
));

const useQueryMock = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: any) => useQueryMock(...args),
}));

import WaveDropQuoteWithSerialNo from '@/components/waves/drops/WaveDropQuoteWithSerialNo';
import { QueryKey } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { WaveDropsSearchStrategy } from '@/contexts/wave/hooks/types';

describe('WaveDropQuoteWithSerialNo', () => {
  it('fetches drop by serial number and renders quote', async () => {
    useQueryMock.mockReturnValue({
      data: { wave: { id: 'w' }, drops: [{ id: 'd1', serial_no: 5 }] },
    });

    render(
      <WaveDropQuoteWithSerialNo serialNo={5} waveId="w" onQuoteClick={jest.fn()} />
    );

    expect(useQueryMock).toHaveBeenCalledWith({
      queryKey: [
        QueryKey.DROPS,
        {
          waveId: 'w',
          limit: 1,
          dropId: null,
          serialNo: 5,
          strategy: WaveDropsSearchStrategy.Both,
        },
      ],
      queryFn: expect.any(Function),
    });

    await waitFor(() => {
      expect(screen.getByTestId('quote')).toHaveTextContent('d1');
    });
  });
});

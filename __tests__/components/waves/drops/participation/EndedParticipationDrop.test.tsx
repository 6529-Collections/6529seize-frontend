import { render } from '@testing-library/react';
import React from 'react';
import EndedParticipationDrop from '../../../../../components/waves/drops/participation/EndedParticipationDrop';

jest.mock('next/navigation', () => ({ useRouter: jest.fn(() => ({ push: jest.fn() })) }));
jest.mock('../../../../../hooks/isMobileDevice', () => jest.fn(() => true));

const WaveDropContentMock = jest.fn(() => null);
const WaveDropMobileMenuMock = jest.fn(() => null);
jest.mock('../../../../../components/waves/drops/WaveDropContent', () => (props: any) => {
  WaveDropContentMock(props);
  return <div data-testid="content" />;
});
jest.mock('../../../../../components/waves/drops/WaveDropMobileMenu', () => (props: any) => {
  WaveDropMobileMenuMock(props);
  return <div data-testid="menu" />;
});

const drop: any = { id: 'd', created_at: 1, wave:{ id:'w', name:'W'}, author:{ handle:'alice', level:1, cic:{} }, parts:[{part_id:1}], metadata:[] };

describe('EndedParticipationDrop', () => {
  it('opens mobile menu on long press', () => {
    const { rerender } = render(
      <EndedParticipationDrop
        drop={drop}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        location={0 as any}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );
    // Initially menu should be closed
    expect(WaveDropMobileMenuMock.mock.calls[0][0].isOpen).toBe(false);
    
    // Trigger onLongPress prop from WaveDropContent
    const onLongPress = WaveDropContentMock.mock.calls[0][0].onLongPress;
    onLongPress();
    
    // Force a re-render to check updated state
    rerender(
      <EndedParticipationDrop
        drop={drop}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        location={0 as any}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );
    
    // After long press, menu should be open
    expect(WaveDropMobileMenuMock.mock.calls[1][0].isOpen).toBe(true);
  });
});

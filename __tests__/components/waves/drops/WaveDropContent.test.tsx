import React from 'react';
import { render } from '@testing-library/react';
import WaveDropContent from '../../../../components/waves/drops/WaveDropContent';

let partProps: any;
jest.mock('../../../../components/waves/drops/WaveDropPart', () => (props: any) => { partProps = props; return <div data-testid="part" />; });

describe('WaveDropContent', () => {
  it('passes props to WaveDropPart', () => {
    const drop = { id: 'd' } as any;
    const setIndex = jest.fn();
    const ref = { current: null };
    render(
      <WaveDropContent
        drop={drop}
        activePartIndex={1}
        setActivePartIndex={setIndex}
        onDropContentClick={() => {}}
        onQuoteClick={() => {}}
        onLongPress={() => {}}
        setLongPressTriggered={() => {}}
        parentContainerRef={ref}
      />
    );
    expect(partProps.drop).toBe(drop);
    expect(partProps.activePartIndex).toBe(1);
  });
});

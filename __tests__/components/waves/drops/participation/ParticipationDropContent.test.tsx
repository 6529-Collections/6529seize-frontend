import { render } from '@testing-library/react';
import React from 'react';
import ParticipationDropContent from '@/components/waves/drops/participation/ParticipationDropContent';

jest.mock('@/components/waves/drops/WaveDropContent', () => (props: any) => {
  return <div data-testid="wave" data-props={JSON.stringify(props)} />;
});

describe('ParticipationDropContent', () => {
  it('passes props to WaveDropContent', () => {
    const drop = { id: 'd' } as any;
    const setActivePartIndex = jest.fn();
    const onLongPress = jest.fn();
    const onQuoteClick = jest.fn();
    const onDropContentClick = jest.fn();
    const setLongPressTriggered = jest.fn();
    const { getByTestId } = render(
      <ParticipationDropContent
        drop={drop}
        activePartIndex={1}
        setActivePartIndex={setActivePartIndex}
        onLongPress={onLongPress}
        onDropContentClick={onDropContentClick}
        onQuoteClick={onQuoteClick}
        setLongPressTriggered={setLongPressTriggered}
      />
    );
    const props = JSON.parse(getByTestId('wave').getAttribute('data-props') as string);
    expect(props.drop).toStrictEqual(drop);
    expect(props.activePartIndex).toBe(1);
    expect(props.onLongPress).toBeUndefined();
  });
});

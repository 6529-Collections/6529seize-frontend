import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveDropPartDrop from '../../../../components/waves/drops/WaveDropPartDrop';

jest.mock('../../../../components/waves/drops/WaveDropPartTitle', () => (props: any) => <div data-testid="title">{props.title}</div>);
jest.mock('../../../../components/waves/drops/WaveDropPartContent', () => (props: any) => <div data-testid="content">{JSON.stringify(props)}</div>);

describe('WaveDropPartDrop', () => {
  const drop = { id: '1', title: 'T', mentioned_users: [], referenced_nfts: [], wave: {} } as any;
  const part = { id: 'p' } as any;
  it('forwards props to subcomponents', () => {
    render(
      <WaveDropPartDrop
        drop={drop}
        activePart={part}
        havePreviousPart={true}
        haveNextPart={false}
        isStorm={false}
        activePartIndex={2}
        setActivePartIndex={() => {}}
        onQuoteClick={() => {}}
      />
    );
    expect(screen.getByTestId('title')).toHaveTextContent('T');
    const props = JSON.parse(screen.getByTestId('content').textContent!);
    expect(props.activePart).toEqual(part);
    expect(props.havePreviousPart).toBe(true);
    expect(props.activePartIndex).toBe(2);
  });
});

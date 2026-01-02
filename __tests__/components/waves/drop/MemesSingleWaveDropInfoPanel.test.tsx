import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemesSingleWaveDropInfoPanel } from '@/components/waves/drop/MemesSingleWaveDropInfoPanel';
import { ApiDropType } from '@/generated/models/ApiDropType';

jest.mock('framer-motion', () => ({ motion: { div: (p:any)=> <div {...p}/> }, AnimatePresence: ({ children }:any)=> <div>{children}</div> }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (p:any)=> <svg data-testid="fa" {...p}/> }));
jest.mock('@/components/waves/drop/SingleWaveDropInfoDetails', () => ({ SingleWaveDropInfoDetails: () => <div data-testid="details"/> }));
jest.mock('@/components/waves/drop/SingleWaveDropInfoAuthorSection', () => ({ SingleWaveDropInfoAuthorSection: () => <div data-testid="author"/> }));
jest.mock('@/components/waves/drop/SingleWaveDropInfoActions', () => ({ SingleWaveDropInfoActions: () => <div data-testid="actions"/> }));
jest.mock('@/components/waves/drop/SingleWaveDropPosition', () => ({ SingleWaveDropPosition: () => <div data-testid="position"/> }));
jest.mock('@/components/waves/drop/SingleWaveDropVotes', () => ({ SingleWaveDropVotes: () => <div data-testid="votes"/> }));
jest.mock('@/components/waves/drop/WinnerBadge', () => ({ WinnerBadge: () => <div data-testid="badge"/> }));
jest.mock('@/components/waves/drop/SingleWaveDropTraits', () => ({ SingleWaveDropTraits: () => <div data-testid="traits"/> }));
jest.mock('@/components/waves/drop/WaveDropAdditionalInfo', () => ({ WaveDropAdditionalInfo: () => <div data-testid="process"/> }));
jest.mock('@/components/utils/button/WaveDropDeleteButton', () => ({ __esModule: true, default: () => <div data-testid="delete"/> }));
jest.mock('@/components/drops/view/item/content/media/DropListItemContentMedia', () => (props:any) => <div data-testid="media" {...props}/>);
jest.mock('@/hooks/drops/useDropInteractionRules', () => ({ useDropInteractionRules: jest.fn(() => ({ isWinner:true, canDelete:true })) }));

const baseDrop:any = {
  drop_type: ApiDropType.Participatory,
  rank:1,
  metadata:[{data_key:'title', data_value:'Title'}, {data_key:'description', data_value:'Desc'}],
  parts:[{ media:[{ mime_type:'image/png', url:'img.png' }] }]
};

describe('MemesSingleWaveDropInfoPanel', () => {
  it('renders drop info and delete button', () => {
    render(<MemesSingleWaveDropInfoPanel drop={baseDrop} wave={null} />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByTestId('media')).toHaveAttribute('media_url', 'img.png');
    expect(screen.getByTestId('traits')).toBeInTheDocument();
    expect(screen.getByTestId('process')).toBeInTheDocument();
    expect(screen.getByTestId('author')).toBeInTheDocument();
    expect(screen.getByTestId('details')).toBeInTheDocument();
    expect(screen.getByTestId('delete')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
  });

  it('closes fullscreen when button clicked', async () => {
    const setState = jest.fn();
    const spy = jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, setState]);
    render(<MemesSingleWaveDropInfoPanel drop={baseDrop} wave={null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Exit fullscreen view' }));
    expect(setState).toHaveBeenCalled();
    spy.mockRestore();
  });
});

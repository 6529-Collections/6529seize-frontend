import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemesWaveWinnersDrop } from '@/components/waves/winners/drops/MemesWaveWinnerDrop';
import type { ApiWave } from '@/generated/models/ApiWave';
import type { ApiWaveDecisionWinner } from '@/generated/models/ApiWaveDecisionWinner';

jest.mock('@/helpers/waves/drop.helpers', () => ({
  convertApiDropToExtendedDrop: jest.fn(() => ({ id: 'ext' })),
}));
jest.mock('@/components/waves/winners/drops/header/WaveWinnersDropHeaderAuthorPfp', () => () => <div data-testid="pfp" />);
jest.mock('@/components/user/utils/UserCICAndLevel', () => ({ __esModule: true, default: () => <div data-testid="level" />, UserCICAndLevelSize: {} }));
jest.mock('@/helpers/Helpers', () => ({ cicToType: jest.fn(), formatNumberWithCommas: (n: number) => String(n) }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));
jest.mock('next/link', () => ({ __esModule: true, default: ({href,children,onClick,className}:any) => <a href={href} onClick={onClick} className={className}>{children}</a> }));
jest.mock('@/components/memes/drops/MemeDropTraits', () => () => <div data-testid="traits" />);
jest.mock('@/components/drops/view/item/content/media/DropListItemContentMedia', () => () => <div data-testid="media" />);
jest.mock('@/hooks/useDeviceInfo', () => ({ __esModule: true, default: () => ({ hasTouchScreen: false }) }));
jest.mock('@/hooks/useLongPressInteraction', () => ({ __esModule: true, default: () => ({ isActive:false, setIsActive: jest.fn(), touchHandlers:{} }) }));
jest.mock('@/components/waves/drops/WaveDropActionsOpen', () => () => <div data-testid="actions" />);
jest.mock('@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper', () => (p:any) => <div>{p.children}</div>);
jest.mock('@/components/waves/drops/WaveDropMobileMenuOpen', () => () => <div data-testid="mobile" />);
jest.mock('@/components/waves/drops/time/WaveDropTime', () => () => <span data-testid="time" />);

const winner: ApiWaveDecisionWinner = {
  drop: {
    id: 1,
    rating: 5,
    raters_count: 2,
    top_raters: [],
    parts: [],
    metadata: [{ data_key: 'title', data_value: 'T' }, { data_key: 'description', data_value: 'D' }],
    context_profile_context: { rating: 1 },
    author: { handle: 'bob', level:1, cic:1 },
    created_at: 0,
  },
} as any;
const wave: ApiWave = { voting: { credit_type: 'votes' } } as any;

describe('MemesWaveWinnersDrop', () => {
  it('calls convert helper and onDropClick', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const { container } = render(
      <MemesWaveWinnersDrop winner={winner} wave={wave} onDropClick={onClick} />
    );
    expect(require('@/helpers/waves/drop.helpers').convertApiDropToExtendedDrop).toHaveBeenCalledWith(winner.drop);
    await user.click(container.firstElementChild as HTMLElement);
    expect(onClick).toHaveBeenCalledWith({ id: 'ext' });
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

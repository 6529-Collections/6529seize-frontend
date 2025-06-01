import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemesLeaderboardDrop } from '../../../../components/memes/drops/MemesLeaderboardDrop';

const useIsMobileScreen = jest.fn();
jest.mock('../../../../hooks/isMobileScreen', () => ({
  __esModule: true,
  default: (...args: any[]) => useIsMobileScreen(...args),
}));

const useDropInteractionRules = jest.fn();
jest.mock('../../../../hooks/drops/useDropInteractionRules', () => ({
  useDropInteractionRules: (...args: any[]) => useDropInteractionRules(...args),
}));

const useDeviceInfo = jest.fn();
jest.mock('../../../../hooks/useDeviceInfo', () => ({
  __esModule: true,
  default: (...args: any[]) => useDeviceInfo(...args),
}));

const useLongPressInteraction = jest.fn();
jest.mock('../../../../hooks/useLongPressInteraction', () => ({
  __esModule: true,
  default: (...args: any[]) => useLongPressInteraction(...args),
}));

jest.mock('../../../../components/memes/drops/MemesLeaderboardDropCard', () => (props: any) => (
  <div data-testid="card" {...props}>{props.children}</div>
));
jest.mock('../../../../components/memes/drops/MemesLeaderboardDropHeader', () => (p: any) => <div data-testid="header">{p.title}</div>);
jest.mock('../../../../components/memes/drops/MemesLeaderboardDropDescription', () => (p: any) => <div data-testid="desc">{p.description}</div>);
jest.mock('../../../../components/memes/drops/MemesLeaderboardDropVoteSummary', () => () => <div data-testid="summary" />);
jest.mock('../../../../components/memes/drops/MemesLeaderboardDropArtistInfo', () => () => <div data-testid="artist" />);
jest.mock('../../../../components/memes/drops/MemeDropTraits', () => () => <div data-testid="traits" />);
jest.mock('../../../../components/drops/view/item/content/media/DropListItemContentMedia', () => () => <div data-testid="media" />);
jest.mock('../../../../components/waves/drops/WaveDropActionsOptions', () => () => <div data-testid="options" />);
jest.mock('../../../../components/waves/drops/WaveDropActionsOpen', () => () => <div data-testid="open" />);
jest.mock('../../../../components/voting', () => ({
  VotingModal: (p: any) => <div data-testid="modal">{p.isOpen ? 'open' : 'closed'}</div>,
  MobileVotingModal: (p: any) => <div data-testid="mobile-modal">{p.isOpen ? 'open' : 'closed'}</div>,
}));
jest.mock('../../../../components/voting/VotingModalButton', () => (p: any) => (
  <button data-testid="vote-btn" onClick={p.onClick}>vote</button>
));
jest.mock('../../../../components/utils/select/dropdown/CommonDropdownItemsMobileWrapper', () => (p: any) => <div data-testid="wrapper">{p.children}</div>);
jest.mock('../../../../components/waves/drops/WaveDropMobileMenuDelete', () => () => <div data-testid="mobile-delete"/>);
jest.mock('../../../../components/waves/drops/WaveDropMobileMenuOpen', () => () => <div data-testid="mobile-open"/>);
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node
}));

const drop: any = {
  id: 'd1',
  wave: { voting_credit_type: 'CREDIT' },
  parts: [{ media: [{ mime_type: 'image', url: 'img' }] }],
  metadata: [{ data_key: 'title', data_value: 'T' }, { data_key: 'description', data_value: 'D' }],
  rating: 1,
  rating_prediction: 2,
  raters_count: 0,
  top_raters: [],
  context_profile_context: 'ctx'
};

beforeEach(() => {
  useDropInteractionRules.mockReturnValue({ canDelete: true });
  useLongPressInteraction.mockReturnValue({ isActive: false, setIsActive: jest.fn(), touchHandlers: {} });
});

test('calls onDropClick when not touch screen', async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);
  const onClick = jest.fn();
  const { container } = render(
    <MemesLeaderboardDrop drop={drop} onDropClick={onClick} />
  );
  await userEvent.click(container.firstElementChild as HTMLElement);
  expect(onClick).toHaveBeenCalledWith(drop);
});

test('does not call onDropClick on touch devices', async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(false);
  const onClick = jest.fn();
  const { container } = render(
    <MemesLeaderboardDrop drop={drop} onDropClick={onClick} />
  );
  await userEvent.click(container.firstElementChild as HTMLElement);
  expect(onClick).not.toHaveBeenCalled();
});

test('opens voting modal on desktop', async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);
  render(<MemesLeaderboardDrop drop={drop} onDropClick={jest.fn()} />);
  expect(screen.getByTestId('modal')).toHaveTextContent('closed');
  await userEvent.click(screen.getByTestId('vote-btn'));
  expect(screen.getByTestId('modal')).toHaveTextContent('open');
});

test('uses mobile modal on small screens', async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(true);
  render(<MemesLeaderboardDrop drop={drop} onDropClick={jest.fn()} />);
  await userEvent.click(screen.getByTestId('vote-btn'));
  expect(screen.getByTestId('mobile-modal')).toHaveTextContent('open');
});


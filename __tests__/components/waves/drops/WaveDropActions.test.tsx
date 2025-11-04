import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveDropActions from '@/components/waves/drops/WaveDropActions';
import { AuthContext } from '@/components/auth/Auth';
import { useDropInteractionRules } from '@/hooks/drops/useDropInteractionRules';
import { useSeizeSettings } from '@/contexts/SeizeSettingsContext';
import { ApiDropType } from '@/generated/models/ApiDropType';

jest.mock('@/components/waves/drops/WaveDropActionsRate', () => () => <div data-testid="rate" />);
jest.mock('@/components/waves/drops/WaveDropActionsReply', () => () => <div data-testid="reply" />);
jest.mock('@/components/waves/drops/WaveDropActionsQuote', () => () => <div data-testid="quote" />);
jest.mock('@/components/waves/drops/WaveDropActionsCopyLink', () => () => <div data-testid="copy" />);
jest.mock('@/components/waves/drops/WaveDropActionsOptions', () => () => <div data-testid="options" />);
jest.mock('@/components/waves/drops/WaveDropActionsOpen', () => () => <div data-testid="open" />);
jest.mock('@/components/waves/drops/WaveDropFollowAuthor', () => () => <div data-testid="follow" />);
jest.mock('@/components/waves/drops/WaveDropActionsAddReaction', () => () => <div data-testid="add-reaction" />);

jest.mock('@/hooks/drops/useDropInteractionRules', () => ({ useDropInteractionRules: jest.fn() }));
jest.mock('@/contexts/SeizeSettingsContext', () => ({ useSeizeSettings: jest.fn() }));
jest.mock('@/contexts/EmojiContext', () => ({ 
  useEmoji: () => ({ emojiMap: [], loading: false, categories: [], categoryIcons: {}, findNativeEmoji: jest.fn(), findCustomEmoji: jest.fn() })
}));

const rulesMock = useDropInteractionRules as jest.Mock;
const settingsMock = useSeizeSettings as jest.Mock;

const auth = { connectedProfile: { handle: 'alice' } } as any;
const wrapper = ({ children }: any) => <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;

const baseDrop: any = { id: 'drop1', author: { handle: 'bob' }, wave: { id: 'w1' }, drop_type: ApiDropType.Chat };

beforeEach(() => {
  rulesMock.mockReturnValue({ canDelete: true });
  settingsMock.mockReturnValue({ isMemesWave: () => false });
});

describe('WaveDropActions', () => {
  it('renders follow button and voting and options', () => {
    render(<WaveDropActions drop={baseDrop} activePartIndex={0} onReply={() => {}} onQuote={() => {}} />, { wrapper });
    expect(screen.getByTestId('follow')).toBeInTheDocument();
    expect(screen.getByTestId('rate')).toBeInTheDocument();
    expect(screen.getByTestId('options')).toBeInTheDocument();
  });

  it('hides follow when author is current profile', () => {
    render(
      <AuthContext.Provider value={{ connectedProfile: { handle: 'bob' } } as any}>
        <WaveDropActions drop={baseDrop} activePartIndex={0} onReply={() => {}} onQuote={() => {}} />
      </AuthContext.Provider>
    );
    expect(screen.queryByTestId('follow')).toBeNull();
  });

  it('hides voting when participation drop in memes wave', () => {
    settingsMock.mockReturnValue({ isMemesWave: () => true });
    const drop = { ...baseDrop, drop_type: ApiDropType.Participatory };
    render(<WaveDropActions drop={drop} activePartIndex={0} onReply={() => {}} onQuote={() => {}} />, { wrapper });
    expect(screen.queryByTestId('rate')).toBeNull();
  });

  it('does not render options when cannot delete', () => {
    rulesMock.mockReturnValue({ canDelete: false });
    render(<WaveDropActions drop={baseDrop} activePartIndex={0} onReply={() => {}} onQuote={() => {}} />, { wrapper });
    expect(screen.queryByTestId('options')).toBeNull();
  });
});

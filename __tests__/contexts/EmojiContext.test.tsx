import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { EmojiProvider, useEmoji } from '../../contexts/EmojiContext';

const fetchMock = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(['smile']) }));

beforeAll(() => {
  (global as any).fetch = fetchMock;
});

beforeEach(() => {
  fetchMock.mockClear();
});

describe('EmojiContext', () => {
  it('provides emoji data after fetch', async () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <EmojiProvider>{children}</EmojiProvider>
    );
    const { result } = renderHook(() => useEmoji(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('emoji-list.json'));
    expect(result.current.emojiMap[0].emojis[0].id).toBe('smile');
  });

  it('throws if hook used outside provider', () => {
    expect(() => renderHook(() => useEmoji())).toThrow('useEmoji must be used within an EmojiProvider');
  });
});

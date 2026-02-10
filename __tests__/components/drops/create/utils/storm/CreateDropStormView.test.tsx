import { render, screen } from '@testing-library/react';
import CreateDropStormView from '@/components/drops/create/utils/storm/CreateDropStormView';
import type { CreateDropConfig } from '@/entities/IDrop';

jest.mock('@/components/drops/create/utils/storm/CreateDropStormViewPart', () => {
  return jest.fn(() => <div data-testid="part" />);
});

const MockPart = require('@/components/drops/create/utils/storm/CreateDropStormViewPart');

describe('CreateDropStormView', () => {
  const profile = { id: '1', handle: 'alice', pfp: null } as any;
  const wave = { name: 'Wave', image: null, id: 'wave1' };

  function createDropWithParts(count: number): CreateDropConfig {
    return {
      parts: Array.from({ length: count }, () => ({
        content: 'content',
        quoted_drop: null,
        media: [new File([''], 'a.png', { type: 'image/png' })],
      })),
      referenced_nfts: [],
      mentioned_users: [],
      title: 'title',
    } as any;
  }

  afterEach(() => {
    (MockPart as jest.Mock).mockClear();
  });

  it('renders a part component for each drop part', () => {
    const drop = createDropWithParts(2);
    render(<CreateDropStormView drop={drop} profile={profile} wave={wave} removePart={jest.fn()} />);
    expect(screen.getAllByTestId('part')).toHaveLength(2);
    expect(MockPart).toHaveBeenCalledTimes(2);
  });

  it('renders nothing when there are no parts', () => {
    const drop = createDropWithParts(0);
    render(<CreateDropStormView drop={drop} profile={profile} wave={wave} removePart={jest.fn()} />);
    expect(screen.queryByTestId('part')).toBeNull();
  });
});

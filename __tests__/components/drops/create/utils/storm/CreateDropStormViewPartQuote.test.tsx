import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock react-dom first 
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node
}));
import CreateDropStormViewPartQuote from '@/components/drops/create/utils/storm/CreateDropStormViewPartQuote';
import { useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');
jest.mock('@/components/drops/view/part/DropPart', () => ({ __esModule: true, default: (props:any) => <div data-testid="part">{props.partContent}</div>, DropPartSize: { SMALL: 'small' }}));

const drop = {
  parts: [{ part_id: 1, content: 'c', media: [] }],
  mentioned_users: [],
  referenced_nfts: [],
  created_at: 1,
  title: 't',
  wave: { name: 'w', picture: null, id: 'w1' },
};

(useQuery as jest.Mock).mockReturnValue({ data: drop });

describe('CreateDropStormViewPartQuote', () => {
  it('renders quoted part when drop available', () => {
    render(<CreateDropStormViewPartQuote profile={{} as any} quotedDrop={{ drop_id: 'd', drop_part_id: 1 }} />);
    expect(screen.getByTestId('part')).toHaveTextContent('c');
  });
});

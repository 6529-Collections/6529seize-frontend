import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import MemesArtSubmissionModal from '@/components/waves/memes/MemesArtSubmissionModal';

jest.mock('@/components/waves/memes/submission/MemesArtSubmissionContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="container" />,
}));

describe('MemesArtSubmissionModal', () => {
  const wave = { id: 'w', participation: { terms: '' } } as any;

  it('renders nothing when closed', () => {
    const { container } = render(
      <MemesArtSubmissionModal isOpen={false} wave={wave} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = jest.fn();
    render(<MemesArtSubmissionModal isOpen={true} wave={wave} onClose={onClose} />);
    const overlay = document.querySelector('.tailwind-scope') as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});

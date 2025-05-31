import { render, screen } from '@testing-library/react';
import WaveGroupScope from '../../../../../../components/waves/specs/groups/group/WaveGroupScope';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, className }: any) => <a href={href} className={className}>{children}</a> }));
jest.mock('../../../../../../helpers/image.helpers', () => ({ getScaledImageUri: (u: string) => 'scaled-' + u, ImageScale: { W_AUTO_H_50: '50' } }));

describe('WaveGroupScope', () => {
  it('shows hidden label', () => {
    const group = { is_hidden: true } as any;
    render(<WaveGroupScope group={group} />);
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });

  it('renders link with image when visible', () => {
    const group = { id: '1', name: 'Group', is_hidden: false, author: { handle: 'alice', pfp: 'img.png' } } as any;
    render(<WaveGroupScope group={group} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/network?page=1&group=1');
    expect(screen.getByRole('img')).toHaveAttribute('src', 'scaled-img.png');
    expect(screen.getByText('Group')).toBeInTheDocument();
  });
});

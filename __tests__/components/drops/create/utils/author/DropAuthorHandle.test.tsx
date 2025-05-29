import { render, screen } from '@testing-library/react';
import DropAuthorHandle from '../../../../../../components/drops/create/utils/author/DropAuthorHandle';
import { DropPartSize } from '../../../../../../components/drops/view/part/DropPart';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

const useRouterMock = useRouter as jest.Mock;

describe('DropAuthorHandle', () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({ query: { user: 'alice' } });
  });

  it('renders plain text when current user is author', () => {
    render(<DropAuthorHandle profile={{ handle: 'alice' } as any} size={DropPartSize.SMALL} />);
    const p = screen.getByText('alice');
    expect(p.tagName).toBe('P');
    expect(p).toHaveClass('tw-text-sm');
    expect(p.querySelector('a')).toBeNull();
  });

  it('renders link when viewing another author', () => {
    render(<DropAuthorHandle profile={{ handle: 'bob' } as any} size={DropPartSize.LARGE} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/bob');
    expect(link.textContent).toBe('bob');
  });
});

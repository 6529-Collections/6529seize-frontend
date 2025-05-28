import { renderHook } from '@testing-library/react';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

const mockUseRouter = useRouter as jest.Mock;
const mockUseQuery = useQuery as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useBreadcrumbs', () => {
  it('builds static breadcrumbs for a simple path', () => {
    mockUseRouter.mockReturnValue({
      pathname: '/about/mission',
      asPath: '/about/mission',
      query: {},
    });
    mockUseQuery.mockReturnValue({ data: null, isLoading: false });

    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toEqual([
      { display: 'Home', href: '/' },
      { display: 'About', href: '/about' },
      { display: 'Mission' },
    ]);
  });

  it('builds dynamic breadcrumbs using fetched data', () => {
    mockUseRouter.mockReturnValue({
      pathname: '/the-memes/[id]',
      asPath: '/the-memes/42',
      query: {},
    });
    mockUseQuery.mockReturnValue({ data: { name: 'Meme 42' }, isLoading: false });

    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toEqual([
      { display: 'Home', href: '/' },
      { display: 'The Memes', href: '/the-memes' },
      { display: 'Meme 42' },
    ]);
  });
});

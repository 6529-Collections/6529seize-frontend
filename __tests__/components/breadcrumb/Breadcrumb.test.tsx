import { render, screen } from '@testing-library/react';
import Breadcrumb, { Crumb } from '@/components/breadcrumb/Breadcrumb';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

const useCapacitorMock = jest.fn();
jest.mock('@/hooks/useCapacitor', () => ({ __esModule: true, default: () => useCapacitorMock() }));

describe('Breadcrumb', () => {
  beforeEach(() => {
    useCapacitorMock.mockReset();
  });

  const crumbs: Crumb[] = [
    { display: 'Home', href: '/' },
    { display: 'Page', href: '/page' },
    { display: 'Details' },
  ];

  it('renders crumbs with separators on web', () => {
    useCapacitorMock.mockReturnValue({ isCapacitor: false });
    render(<Breadcrumb breadcrumbs={crumbs} />);

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/');
    expect(links[0]).toHaveTextContent('Home');
    expect(links[1]).toHaveAttribute('href', '/page');

    const separators = screen.getAllByText(/\|/);
    expect(separators).toHaveLength(2);
    expect(separators[0]).toHaveTextContent('| Page');
    expect(separators[1]).toHaveTextContent('| Details');
  });

  it('adds capacitor classes and placeholder when running on capacitor', () => {
    useCapacitorMock.mockReturnValue({ isCapacitor: true });
    render(<Breadcrumb breadcrumbs={crumbs} />);

    const container = document.querySelector('.capacitorBreadcrumb');
    expect(container).not.toBeNull();
    expect(screen.getByText(/Details/)).toBeInTheDocument();
    expect(screen.getByText(/Details/).tagName).toBe('SPAN');

    const placeholder = document.querySelector('.capacitorPlaceholder');
    expect(placeholder).toBeInTheDocument();
  });
});

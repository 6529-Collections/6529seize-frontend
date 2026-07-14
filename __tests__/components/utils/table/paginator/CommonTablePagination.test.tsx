import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommonTablePagination from '@/components/utils/table/paginator/CommonTablePagination';
import { useBrowserLocale } from '@/hooks/useBrowserLocale';
import type { ComponentProps } from 'react';

jest.mock('@/hooks/useBrowserLocale', () => ({
  useBrowserLocale: jest.fn(),
}));

const useBrowserLocaleMock = jest.mocked(useBrowserLocale);
type PaginationProps = ComponentProps<typeof CommonTablePagination>;

function renderPagination(overrides: Partial<PaginationProps> = {}) {
  return render(
    <CommonTablePagination
      small={false}
      currentPage={1}
      setCurrentPage={jest.fn()}
      totalPages={2}
      haveNextPage={true}
      {...overrides}
    />
  );
}

describe('CommonTablePagination', () => {
  beforeEach(() => {
    useBrowserLocaleMock.mockReturnValue('en-US');
  });

  it('handles previous and next clicks', async () => {
    const setPage = jest.fn();
    renderPagination({ currentPage: 2, setCurrentPage: setPage, totalPages: 3 });
    await userEvent.click(screen.getByText('Previous'));
    expect(setPage).toHaveBeenCalledWith(1);
    await userEvent.click(screen.getByText('Next'));
    expect(setPage).toHaveBeenCalledWith(3);
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    renderPagination({ loading: true });
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it('formats the current and total page counts', () => {
    renderPagination({ currentPage: 12345, totalPages: 20598 });

    expect(screen.getByText('Page 12,345 of 20,598')).toBeInTheDocument();
  });

  it('uses localized copy and number formatting', () => {
    useBrowserLocaleMock.mockReturnValue('de-DE');

    renderPagination({ currentPage: 12345, totalPages: 20598 });

    expect(screen.getByText('Seite 12.345 von 20.598')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeInTheDocument();
  });
});

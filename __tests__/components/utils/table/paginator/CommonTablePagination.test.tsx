import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommonTablePagination from '@/components/utils/table/paginator/CommonTablePagination';
import { useBrowserLocale } from '@/hooks/useBrowserLocale';

jest.mock('@/hooks/useBrowserLocale', () => ({
  useBrowserLocale: jest.fn(),
}));

const useBrowserLocaleMock = jest.mocked(useBrowserLocale);

describe('CommonTablePagination', () => {
  beforeEach(() => {
    useBrowserLocaleMock.mockReturnValue('en-US');
  });

  it('handles previous and next clicks', async () => {
    const setPage = jest.fn();
    render(
      <CommonTablePagination
        small={false}
        currentPage={2}
        setCurrentPage={setPage}
        totalPages={3}
        haveNextPage={true}
      />
    );
    await userEvent.click(screen.getByText('Previous'));
    expect(setPage).toHaveBeenCalledWith(1);
    await userEvent.click(screen.getByText('Next'));
    expect(setPage).toHaveBeenCalledWith(3);
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    const setPage = jest.fn();
    render(
      <CommonTablePagination
        small={false}
        currentPage={1}
        setCurrentPage={setPage}
        totalPages={2}
        haveNextPage={true}
        loading
      />
    );
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it('formats the current and total page counts', () => {
    render(
      <CommonTablePagination
        small={false}
        currentPage={12345}
        setCurrentPage={jest.fn()}
        totalPages={20598}
        haveNextPage={true}
      />
    );

    expect(screen.getByText('Page 12,345 of 20,598')).toBeInTheDocument();
  });

  it('uses localized copy and number formatting', () => {
    useBrowserLocaleMock.mockReturnValue('de-DE');

    render(
      <CommonTablePagination
        small={false}
        currentPage={12345}
        setCurrentPage={jest.fn()}
        totalPages={20598}
        haveNextPage={true}
      />
    );

    expect(screen.getByText('Seite 12.345 von 20.598')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeInTheDocument();
  });
});

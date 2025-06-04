import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommonTablePagination from '../../../../../components/utils/table/paginator/CommonTablePagination';

describe('CommonTablePagination', () => {
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
});

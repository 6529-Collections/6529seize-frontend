import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateSnapshotFormSearchCollectionInput from '../../../../../components/distribution-plan-tool/create-snapshots/form/CreateSnapshotFormSearchCollectionInput';

describe('CreateSnapshotFormSearchCollectionInput', () => {
  it('calls setKeyword on input change', async () => {
    function Wrapper() {
      const [keyword, setKeyword] = React.useState('foo');
      return (
        <CreateSnapshotFormSearchCollectionInput
          keyword={keyword}
          setKeyword={setKeyword}
          openDropdown={jest.fn()}
          loading={false}
        />
      );
    }
    render(<Wrapper />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'bar');
    expect(input).toHaveValue('foobar');
  });

  it('calls openDropdown on click', async () => {
    const openDropdown = jest.fn();
    render(
      <CreateSnapshotFormSearchCollectionInput
        keyword=""
        setKeyword={jest.fn()}
        openDropdown={openDropdown}
        loading={false}
      />
    );
    await userEvent.click(screen.getByRole('textbox'));
    expect(openDropdown).toHaveBeenCalled();
  });

  it('shows spinner when loading', () => {
    render(
      <CreateSnapshotFormSearchCollectionInput
        keyword=""
        setKeyword={jest.fn()}
        openDropdown={jest.fn()}
        loading={true}
      />
    );
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });
});

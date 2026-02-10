import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlockPickerResultTableRow from '@/components/block-picker/result/BlockPickerResultTableRow';

jest.mock('@/components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper', () => ({
  __esModule: true,
  default: ({ children, showModal, onClose }: any) => showModal ? (
    <div data-testid="modal">
      <button aria-label="Close" onClick={(e: any) => { e.stopPropagation(); onClose(); }}>Close</button>
      {children}
    </div>
  ) : null,
  AllowlistToolModalSize: { X_LARGE: 'X_LARGE' },
}));

jest.mock('@/components/block-picker/result/BlockPickerResultTableRowModal', () => ({
  __esModule: true,
  default: ({ predictedBlock }: any) => <div>{`Blocks that include ${predictedBlock.blockNumberIncludes}`}</div>,
}));

describe('BlockPickerResultTableRow', () => {
  const predictedBlock = {
    blockNumberIncludes: 111,
    count: 3,
    blockNumbers: [100, 101, 102],
  };

  it('renders row data and toggles modal on click', async () => {
    const user = userEvent.setup();
    render(
      <table><tbody>
        <BlockPickerResultTableRow predictedBlock={predictedBlock} />
      </tbody></table>
    );

    expect(screen.getByText('111')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();

    await user.click(screen.getByRole('row'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Blocks that include 111')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});

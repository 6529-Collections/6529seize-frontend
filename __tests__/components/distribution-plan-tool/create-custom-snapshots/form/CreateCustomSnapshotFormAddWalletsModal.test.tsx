import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CreateCustomSnapshotFormAddWalletsModal from '@/components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotFormAddWalletsModal';

jest.mock(
  '@/components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotFormUpload',
  () => ({ fileName, setFileName, setTokens }: any) => (
    <div data-testid="upload" onClick={() => setFileName('file.csv')} />
  )
);

const tableMock = jest.fn((props: any) => <div data-testid="table" />);
jest.mock(
  '@/components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotFormTable',
  () => ({
    __esModule: true,
    default: (props: any) => tableMock(props),
  })
);

describe('CreateCustomSnapshotFormAddWalletsModal', () => {
  const defaultProps = {
    fileName: null,
    setFileName: jest.fn(),
    tokens: [],
    addUploadedTokens: jest.fn(),
    setManualWallet: jest.fn(),
    addManualWallet: jest.fn(),
    onRemoveToken: jest.fn(),
    onClose: jest.fn(),
  };

  it('updates manual wallet and adds it', () => {
    render(<CreateCustomSnapshotFormAddWalletsModal {...defaultProps} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '0xabc' } });
    expect(defaultProps.setManualWallet).toHaveBeenCalledWith('0xabc');
    const addButton = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(addButton);
    expect(defaultProps.addManualWallet).toHaveBeenCalled();
  });


  it('passes tokens to table and handles close', () => {
    const onClose = jest.fn();
    const props = { ...defaultProps, tokens: [{ owner: '0x1' } as any], onClose };
    render(<CreateCustomSnapshotFormAddWalletsModal {...props} />);
    expect(tableMock).toHaveBeenCalledWith(
      expect.objectContaining({ tokens: props.tokens, onRemoveToken: props.onRemoveToken })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CreateGroupWalletsUpload from '@/components/groups/page/create/config/wallets/CreateGroupWalletsUpload';
import { GroupCreateWalletsType } from '@/components/groups/page/create/config/wallets/GroupCreateWallets';

let mockContent = '';
class MockFileReader {
  onload: ((e: any) => void) | null = null;
  readAsText() { if (this.onload) this.onload({ target: { result: mockContent } }); }
}
// @ts-ignore
global.FileReader = MockFileReader;

describe('CreateGroupWalletsUpload', () => {
  it('parses uploaded csv and sets wallets', () => {
    const setWallets = jest.fn();
    mockContent = '0xAa00000000000000000000000000000000000000\n0xAA00000000000000000000000000000000000000,0xBb00000000000000000000000000000000000000';
      const { container } = render(
        <CreateGroupWalletsUpload type={GroupCreateWalletsType.INCLUDE} wallets={null} setWallets={setWallets} />
      );
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'w.csv')] } });
    expect(setWallets).toHaveBeenCalledWith([
      '0xaa00000000000000000000000000000000000000',
      '0xbb00000000000000000000000000000000000000',
    ]);
  });

  it('removes wallets on button click', () => {
    const setWallets = jest.fn();
      const { getByLabelText } = render(
        <CreateGroupWalletsUpload type={GroupCreateWalletsType.EXCLUDE} wallets={['0x1']} setWallets={setWallets} />
      );
    fireEvent.click(getByLabelText('Remove wallets'));
    expect(setWallets).toHaveBeenCalledWith(null);
  });
});
